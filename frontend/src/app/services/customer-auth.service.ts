import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CustomerUser, VerificationCodeResponse, CustomerAuthResponse } from '../models/customer.model';

export interface StoredCustomerRecord {
  id: string;
  email: string;
  name: string;
  phone?: string;
  passwordHash: string;
  verified: boolean;
  memberTier?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerAuthService {
  private http = inject(HttpClient);

  private readonly STORAGE_CUSTOMER_KEY = 'aura_botanica_customer_profile';
  private readonly STORAGE_TOKEN_KEY = 'aura_botanica_customer_token';
  private readonly STORAGE_REGISTERED_USERS_KEY = 'aura_botanica_registered_customers';
  private readonly SALT = 'aura_botanica_salt_herb_2026';

  public get backendUrl(): string {
    if (typeof window !== 'undefined' && window.location.port === '4200') {
      return 'http://localhost:3000/api/customer';
    }
    return '/api/customer';
  }

  public currentCustomer = signal<CustomerUser | null>(this.loadCustomerFromStorage());
  public customerToken = signal<string | null>(this.loadTokenFromStorage());
  public pendingVerificationEmail = signal<string>('');
  public lastSentDemoCode = signal<string | null>(null);

  public isCustomerLoggedIn = computed(() => !!this.currentCustomer());

  constructor() {
    this.seedSampleCustomer();
  }

  /**
   * One-way cryptographic SHA-256 hash using native Web Crypto API.
   * Matches the backend password hashing algorithm.
   */
  public async hashPassword(password: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + this.SALT);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return this.fallbackHash(password + this.SALT);
  }

  private fallbackHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  private async seedSampleCustomer() {
    try {
      const users = this.getRegisteredUsers();
      if (!users['helena.vance@example.com']) {
        const hash = await this.hashPassword('Sanctuary2026!');
        users['helena.vance@example.com'] = {
          id: 'cust-helena-01',
          email: 'helena.vance@example.com',
          name: 'Helena Vance',
          phone: '(415) 555-0192',
          passwordHash: hash,
          verified: true,
          memberTier: 'Botanical Circle',
          createdAt: new Date().toISOString()
        };
        this.saveRegisteredUsers(users);
      }
    } catch (e) {
      // ignore
    }
  }

  private getRegisteredUsers(): Record<string, StoredCustomerRecord> {
    try {
      const raw = localStorage.getItem(this.STORAGE_REGISTERED_USERS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read registered users from storage', e);
    }
    return {};
  }

  private saveRegisteredUsers(users: Record<string, StoredCustomerRecord>) {
    try {
      localStorage.setItem(this.STORAGE_REGISTERED_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Could not save registered users to storage', e);
    }
  }

  public isEmailRegistered(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    const users = this.getRegisteredUsers();
    return !!users[normalized];
  }

  private loadCustomerFromStorage(): CustomerUser | null {
    try {
      const data = localStorage.getItem(this.STORAGE_CUSTOMER_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Could not load customer profile from localStorage', e);
    }
    return null;
  }

  private loadTokenFromStorage(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }

  private saveSession(token: string, customer: CustomerUser) {
    this.currentCustomer.set(customer);
    this.customerToken.set(token);
    try {
      localStorage.setItem(this.STORAGE_CUSTOMER_KEY, JSON.stringify(customer));
      localStorage.setItem(this.STORAGE_TOKEN_KEY, token);
    } catch (e) {
      console.warn('Could not save customer session to storage', e);
    }
  }

  /**
   * Step 1: Dispatches a 6-digit email verification code to the customer's mail.
   * Checks if email is already registered and alerts the user to sign in instead.
   */
  public async sendVerificationCode(email: string): Promise<VerificationCodeResponse & { alreadyRegistered?: boolean }> {
    const trimmedEmail = email.trim().toLowerCase();
    this.pendingVerificationEmail.set(trimmedEmail);

    // 1. Check local registered accounts
    if (this.isEmailRegistered(trimmedEmail)) {
      return {
        success: false,
        alreadyRegistered: true,
        message: 'user already registerd, please sign-in to continue'
      };
    }

    // 2. Query backend
    try {
      const res: any = await firstValueFrom(
        this.http.post<VerificationCodeResponse>(`${this.backendUrl}/send-code`, { email: trimmedEmail })
      );

      if (res && res.success) {
        if (res.demoCode) {
          this.lastSentDemoCode.set(res.demoCode);
        }
        return res;
      }
      return {
        success: false,
        alreadyRegistered: !!res?.alreadyRegistered,
        message: res?.errorMessage || 'Failed to dispatch verification code.'
      };
    } catch (httpError: any) {
      if (httpError?.status === 409 || httpError?.error?.alreadyRegistered) {
        return {
          success: false,
          alreadyRegistered: true,
          message: 'user already registerd, please sign-in to continue'
        };
      }

      // Local fallback for offline/direct frontend testing
      const simulatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      this.lastSentDemoCode.set(simulatedCode);
      return {
        success: true,
        message: `Verification code dispatched to ${trimmedEmail}`,
        demoCode: simulatedCode
      };
    }
  }

  /**
   * Step 2: Validates the 6-digit code sent to the email and completes registration.
   */
  public async verifyCodeAndRegister(
    email: string,
    code: string,
    name?: string,
    password?: string,
    phone?: string
  ): Promise<CustomerAuthResponse> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();
    const passwordHash = password ? await this.hashPassword(password) : '';

    // Save registered user locally so sign-in works permanently across restarts and logouts
    const newCustomer: CustomerUser = {
      id: `cust-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      email: trimmedEmail,
      name: name?.trim() || trimmedEmail.split('@')[0],
      phone: phone || '',
      verified: true,
      memberTier: 'Botanical Circle',
      createdAt: new Date().toISOString()
    };

    const token = `cust-tok-${Date.now().toString(36)}`;

    try {
      const res: any = await firstValueFrom(
        this.http.post<CustomerAuthResponse>(`${this.backendUrl}/verify-register`, {
          email: trimmedEmail,
          code: trimmedCode,
          name,
          password,
          phone
        })
      );

      if (res && res.success && res.customer) {
        const users = this.getRegisteredUsers();
        users[trimmedEmail] = {
          ...res.customer,
          passwordHash,
          createdAt: new Date().toISOString()
        };
        this.saveRegisteredUsers(users);

        this.saveSession(res.token || token, res.customer);
        return res;
      }
      return { success: false, errorMessage: res?.errorMessage || 'Invalid verification code.' };
    } catch (err: any) {
      // Check against lastSentDemoCode if local fallback mode
      if (this.lastSentDemoCode() && this.lastSentDemoCode() === trimmedCode) {
        const users = this.getRegisteredUsers();
        users[trimmedEmail] = {
          ...newCustomer,
          passwordHash,
          createdAt: new Date().toISOString()
        };
        this.saveRegisteredUsers(users);

        this.saveSession(token, newCustomer);
        return { success: true, token, customer: newCustomer };
      }
      return { success: false, errorMessage: err?.error?.errorMessage || 'Incorrect or expired verification code.' };
    }
  }

  /**
   * Sign In using email and password.
   * Tries backend first; if backend is offline or customer registered locally, verifies against stored hash.
   */
  public async loginWithPassword(email: string, password: string): Promise<CustomerAuthResponse> {
    const trimmedEmail = email.trim().toLowerCase();
    const inputHash = await this.hashPassword(password);

    // 1. Try backend authentication
    try {
      const res: any = await firstValueFrom(
        this.http.post<CustomerAuthResponse>(`${this.backendUrl}/login`, {
          email: trimmedEmail,
          password
        })
      );

      if (res && res.success && res.customer) {
        // Also keep local registry updated
        const users = this.getRegisteredUsers();
        users[trimmedEmail] = {
          ...res.customer,
          passwordHash: inputHash,
          createdAt: new Date().toISOString()
        };
        this.saveRegisteredUsers(users);

        this.saveSession(res.token || `cust-tok-${Date.now()}`, res.customer);
        return res;
      }
    } catch (err: any) {
      // Backend error or offline, fallback to local registered database
    }

    // 2. Check local registered user database
    const users = this.getRegisteredUsers();
    const storedUser = users[trimmedEmail];

    if (!storedUser) {
      return { 
        success: false, 
        errorMessage: 'No customer account found with this email. Please register first.' 
      };
    }

    if (storedUser.passwordHash && storedUser.passwordHash !== inputHash) {
      return { 
        success: false, 
        errorMessage: 'Invalid email or password.' 
      };
    }

    // Authentication verified!
    const verifiedCustomer: CustomerUser = {
      id: storedUser.id,
      email: storedUser.email,
      name: storedUser.name,
      phone: storedUser.phone,
      verified: true,
      memberTier: 'Botanical Circle',
      createdAt: storedUser.createdAt
    };

    const token = `cust-tok-${Date.now().toString(36)}`;
    this.saveSession(token, verifiedCustomer);

    return { 
      success: true, 
      token, 
      customer: verifiedCustomer 
    };
  }

  /**
   * Clears the active customer session while retaining registered account records.
   */
  public logout() {
    const token = this.customerToken();
    if (token) {
      try {
        this.http.post(`${this.backendUrl}/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).subscribe({ error: () => {} });
      } catch (e) {}
    }

    this.currentCustomer.set(null);
    this.customerToken.set(null);
    try {
      localStorage.removeItem(this.STORAGE_CUSTOMER_KEY);
      localStorage.removeItem(this.STORAGE_TOKEN_KEY);
    } catch (e) {
      // ignore
    }
  }
}
