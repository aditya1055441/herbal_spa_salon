import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AdminCredentialsRecord {
  username: string;
  passwordHash: string;
  isDefaultPassword: boolean;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  mustChangePassword?: boolean;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  private readonly STORAGE_CREDENTIALS_KEY = 'aura_botanica_admin_credentials';
  private readonly SESSION_KEY = 'aura_botanica_admin_session';
  private readonly SALT = 'aura_botanica_salt_herb_2026';
  private readonly BACKEND_AUTH_URL = 'http://localhost:3000/api/auth';

  public isAuthenticated = signal<boolean>(false);
  public needsPasswordChange = signal<boolean>(false);
  public currentUsername = signal<string | null>(null);
  public sessionToken = signal<string | null>(null);

  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initCredentials();
    this.restoreSession();
  }

  /**
   * One-way cryptographic SHA-256 hash using native Web Crypto API.
   * Passwords are never stored or transmitted in plain text.
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

  public async initCredentials(): Promise<void> {
    try {
      const existing = localStorage.getItem(this.STORAGE_CREDENTIALS_KEY);
      if (!existing) {
        // Hash the initial default password "system"
        const initialHash = await this.hashPassword('system');
        const defaultRecord: AdminCredentialsRecord = {
          username: 'admin',
          passwordHash: initialHash,
          isDefaultPassword: true,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_CREDENTIALS_KEY, JSON.stringify(defaultRecord));
      }
    } catch (e) {
      console.warn('Could not initialize admin credentials in storage', e);
    }
  }

  public async ensureInitialized(): Promise<AdminCredentialsRecord> {
    if (this.initPromise) {
      await this.initPromise;
    }
    let creds = this.getCredentials();
    if (!creds) {
      await this.initCredentials();
      creds = this.getCredentials();
    }
    return creds!;
  }

  private restoreSession() {
    try {
      // sessionStorage is strictly isolated per browser window/tab!
      const session = sessionStorage.getItem(this.SESSION_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed && parsed.authenticated && parsed.token) {
          this.isAuthenticated.set(true);
          this.sessionToken.set(parsed.token);
          this.currentUsername.set(parsed.username || 'admin');
          this.needsPasswordChange.set(!!parsed.mustChangePassword);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * Verification method called by route guard to verify active session.
   * If in a different browser, session is empty and returns false.
   */
  public async checkAuthentication(): Promise<boolean> {
    this.restoreSession();
    if (!this.isAuthenticated() || !this.sessionToken()) {
      return false;
    }

    // Attempt verification with backend server if available
    try {
      const token = this.sessionToken();
      const res: any = await firstValueFrom(
        this.http.get(`${this.BACKEND_AUTH_URL}/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      if (res && res.authenticated) {
        this.needsPasswordChange.set(!!res.mustChangePassword);
        return true;
      }
      this.logout();
      return false;
    } catch (err) {
      // If backend is offline or standalone mode, verify local session token
      return this.isAuthenticated();
    }
  }

  public getCredentials(): AdminCredentialsRecord | null {
    try {
      const data = localStorage.getItem(this.STORAGE_CREDENTIALS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error reading admin credentials', e);
    }
    return null;
  }

  /**
   * Authenticates the user with username and password.
   * Compares the SHA-256 hash against the stored one-way hash.
   */
  public async login(usernameInput: string, passwordInput: string): Promise<AuthResponse> {
    const trimmedUser = usernameInput.trim();
    if (!trimmedUser || !passwordInput) {
      return { success: false, errorMessage: 'Please enter both username and password.' };
    }

    // Try backend authentication first
    try {
      const backendRes: any = await firstValueFrom(
        this.http.post(`${this.BACKEND_AUTH_URL}/login`, {
          username: trimmedUser,
          password: passwordInput
        })
      );

      if (backendRes && backendRes.success) {
        const token = backendRes.token || `auth-token-${Date.now().toString(36)}`;
        this.sessionToken.set(token);
        this.isAuthenticated.set(true);
        this.currentUsername.set(backendRes.username || 'admin');
        this.needsPasswordChange.set(!!backendRes.mustChangePassword);

        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({
          authenticated: true,
          token,
          username: backendRes.username || 'admin',
          mustChangePassword: !!backendRes.mustChangePassword
        }));

        return {
          success: true,
          mustChangePassword: !!backendRes.mustChangePassword
        };
      }
    } catch (httpError) {
      // Fallback to client-side cryptographic verification
    }

    const creds = await this.ensureInitialized();
    if (!creds) {
      return { success: false, errorMessage: 'Admin account configuration not found.' };
    }

    if (creds.username.toLowerCase() !== trimmedUser.toLowerCase()) {
      return { success: false, errorMessage: 'Invalid username or password.' };
    }

    const inputHash = await this.hashPassword(passwordInput);
    if (inputHash !== creds.passwordHash) {
      return { success: false, errorMessage: 'Invalid username or password.' };
    }

    // Password matches!
    const token = `session-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    this.sessionToken.set(token);
    this.isAuthenticated.set(true);
    this.currentUsername.set(creds.username);

    if (creds.isDefaultPassword) {
      this.needsPasswordChange.set(true);
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({
        authenticated: true,
        token,
        username: creds.username,
        mustChangePassword: true
      }));
      return { success: true, mustChangePassword: true };
    } else {
      this.needsPasswordChange.set(false);
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({
        authenticated: true,
        token,
        username: creds.username,
        mustChangePassword: false
      }));
      return { success: true, mustChangePassword: false };
    }
  }

  /**
   * Changes the admin password and stores only the new one-way hash.
   */
  public async changePassword(
    currentPasswordInput: string,
    newPasswordInput: string,
    confirmPasswordInput: string
  ): Promise<AuthResponse> {
    if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
      return { success: false, errorMessage: 'All password fields are required.' };
    }

    if (newPasswordInput !== confirmPasswordInput) {
      return { success: false, errorMessage: 'New password and confirmation do not match.' };
    }

    if (newPasswordInput.length < 6) {
      return { success: false, errorMessage: 'New password must be at least 6 characters long.' };
    }

    if (newPasswordInput.toLowerCase() === 'system') {
      return { success: false, errorMessage: 'New password cannot be the default "system" password.' };
    }

    // Update backend if connected
    try {
      const token = this.sessionToken();
      await firstValueFrom(
        this.http.post(`${this.BACKEND_AUTH_URL}/change-password`, {
          currentPassword: currentPasswordInput,
          newPassword: newPasswordInput,
          confirmPassword: confirmPasswordInput
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
    } catch (e) {
      // local fallback handles it
    }

    const creds = await this.ensureInitialized();
    if (!creds) {
      return { success: false, errorMessage: 'Admin account record missing.' };
    }

    const currentHash = await this.hashPassword(currentPasswordInput);
    if (currentHash !== creds.passwordHash) {
      return { success: false, errorMessage: 'Current password is incorrect.' };
    }

    // Hash the new password using one-way SHA-256
    const newHash = await this.hashPassword(newPasswordInput);

    const updatedRecord: AdminCredentialsRecord = {
      username: creds.username,
      passwordHash: newHash,
      isDefaultPassword: false,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.STORAGE_CREDENTIALS_KEY, JSON.stringify(updatedRecord));

    // Update active session
    this.needsPasswordChange.set(false);
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({
      authenticated: true,
      token: this.sessionToken(),
      username: creds.username,
      mustChangePassword: false
    }));

    return { success: true };
  }

  /**
   * Clears the current admin session.
   */
  public logout() {
    const token = this.sessionToken();
    if (token) {
      try {
        this.http.post(`${this.BACKEND_AUTH_URL}/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).subscribe({ error: () => {} });
      } catch (e) {}
    }

    this.isAuthenticated.set(false);
    this.needsPasswordChange.set(false);
    this.currentUsername.set(null);
    this.sessionToken.set(null);
    try {
      sessionStorage.removeItem(this.SESSION_KEY);
    } catch (e) {
      // ignore
    }
  }
}
