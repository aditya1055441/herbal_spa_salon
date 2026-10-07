import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CustomerAuthService } from '../../services/customer-auth.service';

@Component({
  selector: 'app-customer-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="customer-auth-section">
      <div class="container">
        <div class="auth-box-wrapper">
          <div class="luxury-card customer-auth-card">
            
            <!-- Auth Header -->
            <div class="auth-header text-center">
              <span class="badge badge-gold">Sanctuary Circle</span>
              <h1 class="auth-title">
                {{ authMode() === 'register' ? 'Join Our Chemical-Free Sanctuary' : 'Welcome Back, Guest' }}
              </h1>
              <p class="auth-subtitle">
                {{ authMode() === 'register' 
                  ? 'Register with your email to unlock personalized botanical prescriptions and track appointments.' 
                  : 'Sign in to view your upcoming appointments and personalized herbal recommendations.' }}
              </p>
              <div class="botanical-divider">🌿</div>

              <!-- Mode Toggle Tabs -->
              <div class="mode-toggle-pill">
                <button 
                  [class.active]="authMode() === 'register'" 
                  (click)="setMode('register')"
                >
                  New Guest Registration
                </button>
                <button 
                  [class.active]="authMode() === 'login'" 
                  (click)="setMode('login')"
                >
                  Member Sign In
                </button>
              </div>
            </div>

            <!-- ===============================================================
                 FLOW A: REGISTRATION (With Email Verification Code)
                 =============================================================== -->
            <div *ngIf="authMode() === 'register'">
              
              <!-- STEP 1: Enter Email to Request Code -->
              <div *ngIf="registerStep() === 1" class="step-view">
                <form (submit)="requestVerificationCode($event)">
                  <div class="form-group mb-3">
                    <label>Your Email Address *</label>
                    <input 
                      type="email" 
                      [(ngModel)]="email" 
                      name="email" 
                      placeholder="e.g. helena@example.com" 
                      required 
                      class="custom-input"
                    />
                    <small class="field-hint">We will immediately send a 6-digit verification code to confirm your email.</small>
                  </div>

                  <div *ngIf="errorMessage()" class="alert-banner alert-error">
                    ⚠️ {{ errorMessage() }}
                  </div>

                  <button 
                    type="submit" 
                    class="btn btn-primary w-100" 
                    [disabled]="isSubmitting() || !email.trim()"
                  >
                    <span *ngIf="!isSubmitting()">Send Email Verification Code →</span>
                    <span *ngIf="isSubmitting()">Dispatching Code to Mail...</span>
                  </button>
                </form>
              </div>

              <!-- STEP 2: Enter Verification Code & Complete Details -->
              <div *ngIf="registerStep() === 2" class="step-view">
                
                <!-- Email Confirmation Banner with Demo Code Indicator -->
                <div class="email-dispatched-box">
                  <span class="mail-icon">✉️</span>
                  <div>
                    <strong>Verification Code Dispatched!</strong>
                    <p>Please enter the 6-digit code sent to <strong>{{ email }}</strong>.</p>
                  </div>
                </div>

                <!-- Live Demo Simulation Callout -->
                <div *ngIf="customerAuth.lastSentDemoCode()" class="demo-code-callout">
                  <span>✨ <strong>Email Service Simulator:</strong> Your verification code is</span>
                  <code class="demo-code-pill">{{ customerAuth.lastSentDemoCode() }}</code>
                </div>

                <form (submit)="verifyAndComplete($event)">
                  <div class="form-group mb-3">
                    <label>6-Digit Email Verification Code *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="verificationCode" 
                      name="verificationCode" 
                      placeholder="e.g. 849201" 
                      maxlength="6"
                      required 
                      class="custom-input code-input text-center"
                    />
                  </div>

                  <div class="form-group mb-3">
                    <label>Your Full Name *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="fullName" 
                      name="fullName" 
                      placeholder="e.g. Helena Vance" 
                      required 
                      class="custom-input"
                    />
                  </div>

                  <div class="form-group mb-3">
                    <label>Phone Number (For appointment text reminders)</label>
                    <input 
                      type="tel" 
                      [(ngModel)]="phone" 
                      name="phone" 
                      placeholder="(415) 555-0192" 
                      class="custom-input"
                    />
                  </div>

                  <div class="form-group mb-3">
                    <label>Create Secure Password * (Minimum 6 characters)</label>
                    <input 
                      type="password" 
                      [(ngModel)]="password" 
                      name="password" 
                      placeholder="••••••••" 
                      required 
                      class="custom-input"
                    />
                  </div>

                  <div *ngIf="errorMessage()" class="alert-banner alert-error">
                    ⚠️ {{ errorMessage() }}
                  </div>

                  <div *ngIf="successMessage()" class="alert-banner alert-success">
                    ✓ {{ successMessage() }}
                  </div>

                  <button 
                    type="submit" 
                    class="btn btn-primary w-100 mb-2" 
                    [disabled]="isSubmitting() || verificationCode.length < 6"
                  >
                    <span *ngIf="!isSubmitting()">Verify Code & Activate Sanctuary Profile →</span>
                    <span *ngIf="isSubmitting()">Verifying & Creating Profile...</span>
                  </button>

                  <div class="resend-row text-center">
                    <button type="button" class="btn-link" (click)="resendCode()">
                      Didn't receive code? Resend Code
                    </button>
                    <span>•</span>
                    <button type="button" class="btn-link" (click)="registerStep.set(1)">
                      Change Email
                    </button>
                  </div>
                </form>
              </div>

            </div>

            <!-- ===============================================================
                 FLOW B: MEMBER SIGN IN (For Existing Verified Guests)
                 =============================================================== -->
            <div *ngIf="authMode() === 'login'" class="step-view">
              <form (submit)="handleLogin($event)">
                <div class="form-group mb-3">
                  <label>Email Address *</label>
                  <input 
                    type="email" 
                    [(ngModel)]="email" 
                    name="loginEmail" 
                    placeholder="e.g. helena@example.com" 
                    required 
                    class="custom-input"
                  />
                </div>

                <div class="form-group mb-3">
                  <label>Password *</label>
                  <input 
                    type="password" 
                    [(ngModel)]="password" 
                    name="loginPassword" 
                    placeholder="••••••••" 
                    required 
                    class="custom-input"
                  />
                </div>

                <div *ngIf="errorMessage()" class="alert-banner alert-error">
                  ⚠️ {{ errorMessage() }}
                </div>

                <button 
                  type="submit" 
                  class="btn btn-primary w-100 mb-3" 
                  [disabled]="isSubmitting() || !email.trim() || !password"
                >
                  <span *ngIf="!isSubmitting()">Sign In to Sanctuary Account →</span>
                  <span *ngIf="isSubmitting()">Signing In...</span>
                </button>

                <div class="text-center">
                  <button type="button" class="btn-link" (click)="switchToCodeLogin()">
                    Or sign in using one-time email code →
                  </button>
                </div>
              </form>
            </div>

            <!-- Footer Guarantee -->
            <div class="auth-card-footer text-center">
              🌿 100% Privacy Guarantee • We never share your email with third parties.
            </div>

          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./customer-auth.component.css']
})
export class CustomerAuthComponent implements OnInit {
  public customerAuth = inject(CustomerAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public authMode = signal<'register' | 'login'>('register');
  public registerStep = signal<number>(1);

  // Form Fields
  public email = '';
  public verificationCode = '';
  public fullName = '';
  public phone = '';
  public password = '';

  public errorMessage = signal<string>('');
  public successMessage = signal<string>('');
  public isSubmitting = signal<boolean>(false);

  private returnUrl = '/account';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'login') {
        this.authMode.set('login');
      }
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });

    // If already logged in, redirect to account dashboard
    if (this.customerAuth.isCustomerLoggedIn()) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  public setMode(mode: 'register' | 'login') {
    this.authMode.set(mode);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  public async requestVerificationCode(e: Event) {
    e.preventDefault();
    if (!this.email.trim() || !this.email.includes('@')) {
      this.errorMessage.set('Please provide a valid email address.');
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    try {
      const res = await this.customerAuth.sendVerificationCode(this.email);
      if (res.success) {
        this.registerStep.set(2);
      } else {
        this.errorMessage.set(res.message || 'Could not send verification code.');
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Error requesting verification code.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public async verifyAndComplete(e: Event) {
    e.preventDefault();
    if (this.verificationCode.length < 6) {
      this.errorMessage.set('Please enter the full 6-digit verification code.');
      return;
    }

    if (!this.password || this.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    try {
      const res = await this.customerAuth.verifyCodeAndRegister(
        this.email,
        this.verificationCode,
        this.fullName,
        this.password,
        this.phone
      );

      if (res.success) {
        this.successMessage.set('Email verified! Redirecting to your sanctuary account...');
        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl);
        }, 1000);
      } else {
        this.errorMessage.set(res.errorMessage || 'Invalid verification code.');
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Verification failed.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public async resendCode() {
    this.errorMessage.set('');
    const res = await this.customerAuth.sendVerificationCode(this.email);
    if (res.success) {
      this.successMessage.set('A fresh verification code was sent to your email.');
      setTimeout(() => this.successMessage.set(''), 4000);
    }
  }

  public async handleLogin(e: Event) {
    e.preventDefault();
    this.errorMessage.set('');
    this.isSubmitting.set(true);

    try {
      const res = await this.customerAuth.loginWithPassword(this.email, this.password);
      if (res.success) {
        this.router.navigateByUrl(this.returnUrl);
      } else {
        this.errorMessage.set(res.errorMessage || 'Sign in failed. Check your email and password.');
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Authentication error.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public switchToCodeLogin() {
    this.setMode('register');
    this.registerStep.set(1);
  }
}
