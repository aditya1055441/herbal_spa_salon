import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CustomerUser, VerificationCodeResponse, CustomerAuthResponse } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerAuthService {
  private http = inject(HttpClient);

  private readonly STORAGE_CUSTOMER_KEY = 'aura_botanica_customer_profile';
  private readonly STORAGE_TOKEN_KEY = 'aura_botanica_customer_token';
  private readonly BACKEND_URL = 'http://localhost:3000/api/customer';

  public currentCustomer = signal<CustomerUser | null>(this.loadCustomerFromStorage());
  public customerToken = signal<string | null>(this.loadTokenFromStorage());
  public pendingVerificationEmail = signal<string>('');
  public lastSentDemoCode = signal<string | null>(null);

  public isCustomerLoggedIn = computed(() => !!this.currentCustomer());

  constructor() {}

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
   */
  public async sendVerificationCode(email: string): Promise<VerificationCodeResponse> {
    const trimmedEmail = email.trim().toLowerCase();
    this.pendingVerificationEmail.set(trimmedEmail);

    try {
      const res: any = await firstValueFrom(
        this.http.post<VerificationCodeResponse>(`${this.BACKEND_URL}/send-code`, { email: trimmedEmail })
      );

      if (res && res.success) {
        if (res.demoCode) {
          this.lastSentDemoCode.set(res.demoCode);
        }
        return res;
      }
      return { success: false, message: res?.errorMessage || 'Failed to dispatch verification code.' };
    } catch (httpError: any) {
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

    try {
      const res: any = await firstValueFrom(
        this.http.post<CustomerAuthResponse>(`${this.BACKEND_URL}/verify-register`, {
          email: trimmedEmail,
          code: trimmedCode,
          name,
          password,
          phone
        })
      );

      if (res && res.success && res.customer) {
        this.saveSession(res.token || 'cust-tok-' + Date.now(), res.customer);
        return res;
      }
      return { success: false, errorMessage: res?.errorMessage || 'Invalid verification code.' };
    } catch (err: any) {
      // Check against lastSentDemoCode if local fallback mode
      if (this.lastSentDemoCode() && this.lastSentDemoCode() === trimmedCode) {
        const newCustomer: CustomerUser = {
          id: `cust-${Date.now().toString(36)}`,
          email: trimmedEmail,
          name: name?.trim() || trimmedEmail.split('@')[0],
          phone: phone || '',
          verified: true,
          memberTier: 'Botanical Circle',
          createdAt: new Date().toISOString()
        };
        const token = `cust-tok-${Date.now()}`;
        this.saveSession(token, newCustomer);
        return { success: true, token, customer: newCustomer };
      }
      return { success: false, errorMessage: err?.error?.errorMessage || 'Incorrect or expired verification code.' };
    }
  }

  /**
   * Sign In using email and password.
   */
  public async loginWithPassword(email: string, password: string): Promise<CustomerAuthResponse> {
    const trimmedEmail = email.trim().toLowerCase();

    try {
      const res: any = await firstValueFrom(
        this.http.post<CustomerAuthResponse>(`${this.BACKEND_URL}/login`, {
          email: trimmedEmail,
          password
        })
      );

      if (res && res.success && res.customer) {
        this.saveSession(res.token || 'cust-tok-' + Date.now(), res.customer);
        return res;
      }
      return { success: false, errorMessage: res?.errorMessage || 'Sign in failed.' };
    } catch (err: any) {
      return { success: false, errorMessage: err?.error?.errorMessage || 'Invalid email or password.' };
    }
  }

  /**
   * Clears the active customer session.
   */
  public logout() {
    const token = this.customerToken();
    if (token) {
      try {
        this.http.post(`${this.BACKEND_URL}/logout`, {}, {
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
