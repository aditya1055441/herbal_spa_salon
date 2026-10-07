import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="login-page-section">
      <div class="container">
        
        <!-- Login Form Box -->
        <div class="login-box-wrapper">
          <div class="luxury-card login-card">
            
            <!-- Standard Login View -->
            <div *ngIf="!authService.needsPasswordChange()">
              <div class="auth-header text-center">
                <span class="badge badge-gold">Sanctuary Internal Access</span>
                <h1 class="auth-title">Practitioner Portal</h1>
                <p class="auth-subtitle">
                  Secure authentication required to manage appointments and salon operations.
                </p>
                <div class="botanical-divider">🌿</div>
              </div>

              <!-- Default Credential Notice for First Setup -->
              <div class="default-creds-callout">
                <span class="callout-icon">ℹ️</span>
                <div class="callout-content">
                  <strong>Initial Setup Credentials:</strong>
                  <p>Username: <code>admin</code> • Password: <code>system</code></p>
                  <small>You will be prompted to replace the default password immediately.</small>
                </div>
              </div>

              <form class="auth-form" (submit)="handleLogin($event)">
                <div class="form-group">
                  <label>Practitioner Username</label>
                  <input 
                    type="text" 
                    [(ngModel)]="username" 
                    name="username" 
                    placeholder="admin" 
                    required 
                    class="custom-input"
                  />
                </div>

                <div class="form-group">
                  <label>Master Password</label>
                  <input 
                    type="password" 
                    [(ngModel)]="password" 
                    name="password" 
                    placeholder="••••••••" 
                    required 
                    class="custom-input"
                  />
                </div>

                <div *ngIf="errorMessage()" class="auth-error-banner">
                  ⚠️ {{ errorMessage() }}
                </div>

                <button 
                  type="submit" 
                  class="btn btn-primary w-100 auth-btn" 
                  [disabled]="isSubmitting()"
                >
                  <span *ngIf="!isSubmitting()">Sign In to Sanctuary CMS →</span>
                  <span *ngIf="isSubmitting()">Authenticating Session...</span>
                </button>
              </form>

              <div class="crypto-note text-center">
                🔒 Protected by one-way SHA-256 salted cryptographic hashing.
              </div>
            </div>

            <!-- Mandatory First-Login Password Change View -->
            <div *ngIf="authService.needsPasswordChange()">
              <div class="auth-header text-center">
                <span class="badge badge-sage">Security Verification Required</span>
                <h2 class="auth-title">Change Default Password</h2>
                <p class="auth-subtitle">
                  For sanctuary security, the default 'system' password must be changed before accessing the management panel.
                </p>
                <div class="botanical-divider">⚜️</div>
              </div>

              <div class="security-banner">
                🛡️ <strong>Zero Plaintext Storage:</strong> Passwords are one-way hashed with SHA-256 before being stored.
              </div>

              <form class="auth-form" (submit)="handlePasswordChange($event)">
                <div class="form-group">
                  <label>Current / Default Password *</label>
                  <input 
                    type="password" 
                    [(ngModel)]="currentPassword" 
                    name="currentPassword" 
                    placeholder="Enter 'system'" 
                    required 
                    class="custom-input"
                  />
                </div>

                <div class="form-group">
                  <label>New Secure Password * (Minimum 6 characters)</label>
                  <input 
                    type="password" 
                    [(ngModel)]="newPassword" 
                    name="newPassword" 
                    placeholder="Choose a new password" 
                    required 
                    class="custom-input"
                  />
                </div>

                <div class="form-group">
                  <label>Confirm New Password *</label>
                  <input 
                    type="password" 
                    [(ngModel)]="confirmPassword" 
                    name="confirmPassword" 
                    placeholder="Confirm new password" 
                    required 
                    class="custom-input"
                  />
                </div>

                <div *ngIf="passwordError()" class="auth-error-banner">
                  ⚠️ {{ passwordError() }}
                </div>

                <div *ngIf="passwordSuccess()" class="auth-success-banner">
                  ✓ Password updated successfully! Redirecting to Sanctuary CMS...
                </div>

                <button 
                  type="submit" 
                  class="btn btn-primary w-100 auth-btn" 
                  [disabled]="isSubmitting()"
                >
                  <span *ngIf="!isSubmitting()">Update Password & Proceed to Admin →</span>
                  <span *ngIf="isSubmitting()">Saving Cryptographic Hash...</span>
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>
    </section>
  `,
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public username = 'admin';
  public password = '';
  public errorMessage = signal<string>('');
  public isSubmitting = signal<boolean>(false);

  // Password Change fields
  public currentPassword = '';
  public newPassword = '';
  public confirmPassword = '';
  public passwordError = signal<string>('');
  public passwordSuccess = signal<boolean>(false);

  private returnUrl = '/admin';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });

    // If already authenticated and doesn't need password change, route directly to admin
    if (this.authService.isAuthenticated() && !this.authService.needsPasswordChange()) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  public async handleLogin(e: Event) {
    e.preventDefault();
    this.errorMessage.set('');
    this.isSubmitting.set(true);

    try {
      const res = await this.authService.login(this.username, this.password);
      if (!res.success) {
        this.errorMessage.set(res.errorMessage || 'Invalid credentials.');
      } else {
        if (res.mustChangePassword) {
          this.currentPassword = this.password;
        } else {
          this.router.navigateByUrl(this.returnUrl);
        }
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Authentication error.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public async handlePasswordChange(e: Event) {
    e.preventDefault();
    this.passwordError.set('');
    this.passwordSuccess.set(false);
    this.isSubmitting.set(true);

    try {
      const res = await this.authService.changePassword(
        this.currentPassword,
        this.newPassword,
        this.confirmPassword
      );

      if (!res.success) {
        this.passwordError.set(res.errorMessage || 'Password update failed.');
      } else {
        this.passwordSuccess.set(true);
        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl);
        }, 1000);
      }
    } catch (err: any) {
      this.passwordError.set(err?.message || 'Error updating password.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
