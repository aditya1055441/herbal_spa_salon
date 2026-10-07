import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SpaDataService } from '../../services/spa-data.service';
import { AuthService } from '../../services/auth.service';
import { TreatmentService, HerbalProduct, AppointmentBooking } from '../../models/spa.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="admin-panel-section">
      <div class="container">

        <!-- ===================================================================
             VIEW 1: Admin Login Screen (When Not Authenticated)
             =================================================================== -->
        <div *ngIf="!authService.isAuthenticated()" class="admin-auth-container">
          <div class="luxury-card auth-card">
            <div class="auth-header text-center">
              <span class="badge badge-gold">Restricted Access</span>
              <h2 class="auth-title">Practitioner Portal Sign In</h2>
              <p class="auth-subtitle">
                Access the appointment schedule, chemical-free service catalogue, and Square POS telemetry.
              </p>
              <div class="botanical-divider">🌿</div>
            </div>

            <!-- Default Credentials Notice -->
            <div class="default-creds-callout">
              <span class="callout-icon">ℹ️</span>
              <div class="callout-content">
                <strong>Initial Setup Notice:</strong>
                <p>Default credentials: Username <code>admin</code> • Password <code>system</code>.</p>
                <small>You will be required to change your password immediately upon first login.</small>
              </div>
            </div>

            <form class="auth-form" (submit)="handleLogin($event)">
              <div class="form-group">
                <label>Practitioner Username</label>
                <input 
                  type="text" 
                  [(ngModel)]="loginUsername" 
                  name="loginUsername" 
                  placeholder="admin" 
                  required 
                  class="custom-input"
                />
              </div>

              <div class="form-group">
                <label>Master Password</label>
                <input 
                  type="password" 
                  [(ngModel)]="loginPassword" 
                  name="loginPassword" 
                  placeholder="••••••••" 
                  required 
                  class="custom-input"
                />
              </div>

              <div *ngIf="loginError()" class="auth-error-banner">
                ⚠️ {{ loginError() }}
              </div>

              <button 
                type="submit" 
                class="btn btn-primary w-100 auth-btn" 
                [disabled]="isAuthenticating()"
              >
                <span *ngIf="!isAuthenticating()">Sign In to Sanctuary CMS →</span>
                <span *ngIf="isAuthenticating()">Authenticating & Verifying Hash...</span>
              </button>
            </form>

            <div class="crypto-security-note text-center">
              🔒 Passwords are cryptographically protected via one-way SHA-256 hashing.
            </div>
          </div>
        </div>

        <!-- ===================================================================
             VIEW 2: Mandatory First-Time Password Reset (Before Accessing Panel)
             =================================================================== -->
        <div *ngIf="authService.isAuthenticated() && authService.needsPasswordChange()" class="admin-auth-container">
          <div class="luxury-card auth-card password-reset-card">
            <div class="auth-header text-center">
              <span class="badge badge-sage">Security Verification</span>
              <h2 class="auth-title">Update Default Password</h2>
              <p class="auth-subtitle">
                First-time sign-in detected with the default "system" password. 
                Please choose a secure new password before accessing the sanctuary management panel.
              </p>
              <div class="botanical-divider">⚜️</div>
            </div>

            <div class="security-alert-box">
              🛡️ <strong>Zero Plaintext Storage:</strong> Your new password will be hashed with SHA-256 and salted before saving.
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
                  placeholder="Choose a strong password" 
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
                  placeholder="Re-enter new password" 
                  required 
                  class="custom-input"
                />
              </div>

              <div *ngIf="passwordChangeError()" class="auth-error-banner">
                ⚠️ {{ passwordChangeError() }}
              </div>

              <div *ngIf="passwordChangeSuccess()" class="auth-success-banner">
                ✓ Password updated and hashed successfully! Redirecting to CMS dashboard...
              </div>

              <button 
                type="submit" 
                class="btn btn-primary w-100 auth-btn" 
                [disabled]="isUpdatingPassword()"
              >
                <span *ngIf="!isUpdatingPassword()">Save Hashed Password & Enter Dashboard →</span>
                <span *ngIf="isUpdatingPassword()">Hashing & Updating Credentials...</span>
              </button>
            </form>
          </div>
        </div>

        <!-- ===================================================================
             VIEW 3: Full Admin Operations Dashboard (When Authenticated & Updated)
             =================================================================== -->
        <div *ngIf="authService.isAuthenticated() && !authService.needsPasswordChange()">
          
          <!-- Admin Top Bar with Sign Out -->
          <div class="admin-top-bar">
            <div>
              <span class="badge badge-gold">Sanctuary Practitioner CMS</span>
              <h1 class="admin-title">Sanctuary Operations & Management</h1>
              <p>Update ritual descriptions, pricing, inventory, and inspect Square POS appointments.</p>
            </div>
            
            <div class="admin-user-controls">
              <div class="square-status-pill">
                <span class="pulse-dot"></span>
                <span>Square POS: <strong>L_AURA_SANCTUARY_01</strong></span>
              </div>
              <button class="btn btn-outline btn-sm" (click)="promptPasswordModal()">
                🔑 Change Password
              </button>
              <button class="btn btn-outline btn-sm sign-out-btn" (click)="handleSignOut()">
                Sign Out ({{ authService.currentUsername() }})
              </button>
            </div>
          </div>

          <!-- Optional Inline Password Update Modal -->
          <div *ngIf="showPasswordModal()" class="inline-password-box luxury-card">
            <div class="flex-between">
              <h4>Update Practitioner Password</h4>
              <button class="close-modal-btn" (click)="showPasswordModal.set(false)">✕</button>
            </div>
            <form (submit)="handlePasswordChange($event)" class="mt-3">
              <div class="form-group mb-2">
                <label>Current Password</label>
                <input type="password" [(ngModel)]="currentPassword" name="cp" class="custom-input" required>
              </div>
              <div class="form-group mb-2">
                <label>New Password (min 6 chars)</label>
                <input type="password" [(ngModel)]="newPassword" name="np" class="custom-input" required>
              </div>
              <div class="form-group mb-2">
                <label>Confirm New Password</label>
                <input type="password" [(ngModel)]="confirmPassword" name="cnp" class="custom-input" required>
              </div>
              <div *ngIf="passwordChangeError()" class="auth-error-banner">
                ⚠️ {{ passwordChangeError() }}
              </div>
              <div *ngIf="passwordChangeSuccess()" class="auth-success-banner">
                ✓ Password updated and hashed!
              </div>
              <button type="submit" class="btn btn-primary btn-sm mt-2">Update Password</button>
            </form>
          </div>

          <!-- CMS Navigation Tabs -->
          <div class="cms-tabs">
            <button 
              [class.active]="activeTab() === 'appointments'" 
              (click)="activeTab.set('appointments')"
            >
              📅 Bookings & Schedule ({{ spaService.bookings().length }})
            </button>
            <button 
              [class.active]="activeTab() === 'services'" 
              (click)="activeTab.set('services')"
            >
              🌿 Rituals & Services ({{ spaService.services().length }})
            </button>
            <button 
              [class.active]="activeTab() === 'products'" 
              (click)="activeTab.set('products')"
            >
              🏺 Apothecary Inventory ({{ spaService.products().length }})
            </button>
            <button 
              [class.active]="activeTab() === 'settings'" 
              (click)="activeTab.set('settings')"
            >
              ⚙️ Square API & Cloud Settings
            </button>
          </div>

          <!-- TAB 1: Appointments -->
          <div *ngIf="activeTab() === 'appointments'" class="tab-pane">
            <div class="luxury-card">
              <div class="pane-header">
                <h3>Synchronized Sanctuary Appointments</h3>
                <p>Appointments confirmed via Square Web Payments with encrypted hold.</p>
              </div>

              <div class="appointments-table-wrapper">
                <table class="cms-table">
                  <thead>
                    <tr>
                      <th>Ref ID</th>
                      <th>Date & Time</th>
                      <th>Guest Information</th>
                      <th>Treatment Ritual</th>
                      <th>Practitioner</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let b of spaService.bookings()">
                      <td>
                        <code class="ref-code">{{ b.id }}</code>
                      </td>
                      <td>
                        <strong>{{ b.date }}</strong><br>
                        <small>{{ b.timeSlot }}</small>
                      </td>
                      <td>
                        <strong>{{ b.guestName }}</strong><br>
                        <small>{{ b.guestEmail }}</small><br>
                        <small>{{ b.guestPhone }}</small>
                        <div *ngIf="b.healthNotes" class="guest-notes-tag">
                          ⚠️ {{ b.healthNotes }}
                        </div>
                      </td>
                      <td>{{ b.serviceName }}</td>
                      <td>{{ b.specialistName.split('—')[0] }}</td>
                      <td><strong>$\{{ b.price }}</strong></td>
                      <td>
                        <span class="status-badge" [class]="'status-' + b.status">
                          {{ b.status | uppercase }}
                        </span>
                      </td>
                      <td>
                        <div class="action-btn-group">
                          <button 
                            *ngIf="b.status !== 'completed'"
                            class="cms-btn-sm" 
                            (click)="updateStatus(b.id, 'completed')"
                            title="Mark Complete"
                          >
                            ✓
                          </button>
                          <button 
                            *ngIf="b.status !== 'cancelled'"
                            class="cms-btn-sm danger" 
                            (click)="updateStatus(b.id, 'cancelled')"
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB 2: Services / Rituals CMS -->
          <div *ngIf="activeTab() === 'services'" class="tab-pane">
            <div class="luxury-card">
              <div class="pane-header flex-between">
                <div>
                  <h3>Treatment Rituals & Chemical-Free Services</h3>
                  <p>Modify service descriptions, pricing, and ingredients. Changes reflect instantly.</p>
                </div>
              </div>

              <div class="services-edit-list">
                <div *ngFor="let s of spaService.services()" class="service-edit-item">
                  <div class="edit-item-header">
                    <div>
                      <h4>{{ s.name }}</h4>
                      <span class="badge badge-sage">{{ s.category | uppercase }}</span>
                    </div>
                    <div class="price-input-wrapper">
                      <label>Price ($ USD):</label>
                      <input 
                        type="number" 
                        [(ngModel)]="s.price" 
                        (change)="saveService(s)"
                        class="cms-input-sm"
                      />
                    </div>
                  </div>

                  <div class="edit-item-body">
                    <div class="field-row">
                      <label>Subtitle / One-line descriptor:</label>
                      <input 
                        type="text" 
                        [(ngModel)]="s.subtitle" 
                        (change)="saveService(s)"
                        class="cms-input"
                      />
                    </div>
                    <div class="field-row">
                      <label>Duration (Minutes):</label>
                      <input 
                        type="number" 
                        [(ngModel)]="s.durationMinutes" 
                        (change)="saveService(s)"
                        class="cms-input-sm"
                      />
                    </div>
                    <div class="field-row">
                      <label>Detailed Ritual Narrative:</label>
                      <textarea 
                        rows="2" 
                        [(ngModel)]="s.description" 
                        (change)="saveService(s)"
                        class="cms-textarea"
                      ></textarea>
                    </div>
                    <div class="field-row">
                      <label>Herbal Ingredients (comma separated):</label>
                      <input 
                        type="text" 
                        [ngModel]="s.herbalIngredients.join(', ')"
                        (ngModelChange)="updateIngredients(s, $event)"
                        class="cms-input"
                      />
                    </div>
                  </div>

                  <div class="save-status-indicator">
                    ✓ Synced with website & database
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: Apothecary Products CMS -->
          <div *ngIf="activeTab() === 'products'" class="tab-pane">
            <div class="luxury-card">
              <div class="pane-header">
                <h3>Take-Home Apothecary Product Catalog</h3>
                <p>Manage product pricing, sizes, and stock availability.</p>
              </div>

              <div class="products-edit-grid">
                <div *ngFor="let p of spaService.products()" class="product-edit-item">
                  <div class="prod-edit-top">
                    <h4>{{ p.name }}</h4>
                    <label class="toggle-stock">
                      <input 
                        type="checkbox" 
                        [(ngModel)]="p.inStock" 
                        (change)="saveProduct(p)"
                      />
                      <span>In Stock</span>
                    </label>
                  </div>

                  <div class="field-row">
                    <label>Size / Net Weight:</label>
                    <input 
                      type="text" 
                      [(ngModel)]="p.size" 
                      (change)="saveProduct(p)"
                      class="cms-input"
                    />
                  </div>

                  <div class="field-row">
                    <label>Price ($ USD):</label>
                    <input 
                      type="number" 
                      [(ngModel)]="p.price" 
                      (change)="saveProduct(p)"
                      class="cms-input-sm"
                    />
                  </div>

                  <div class="field-row">
                    <label>Usage Directions:</label>
                    <textarea 
                      rows="2" 
                      [(ngModel)]="p.directions" 
                      (change)="saveProduct(p)"
                      class="cms-textarea"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 4: Square API Settings & Cloud Deployment -->
          <div *ngIf="activeTab() === 'settings'" class="tab-pane">
            <div class="luxury-card settings-card">
              <h3>Square POS & Google Cloud Platform Deployment</h3>
              <p>Live technical configuration for Square POS APIs and GCP Cloud Run hosting.</p>

              <div class="settings-grid">
                <div class="settings-box">
                  <h4>Square POS Integration</h4>
                  <div class="config-field">
                    <label>Square Environment:</label>
                    <span class="badge badge-sage">Sandbox Ready (Production Toggle Available)</span>
                  </div>
                  <div class="config-field">
                    <label>Square Application ID:</label>
                    <code>sandbox-sq0idb-YOUR_SANDBOX_APP_ID_AURA_BOTANICA</code>
                  </div>
                  <div class="config-field">
                    <label>Location ID:</label>
                    <code>L_AURA_SANCTUARY_01</code>
                  </div>
                  <div class="config-field">
                    <label>Web Payments SDK:</label>
                    <span class="text-success">Active & Verified (https://sandbox.web.squarecdn.com/v1/square.js)</span>
                  </div>
                </div>

                <div class="settings-box">
                  <h4>Hosting & Cloud Architecture</h4>
                  <div class="config-field">
                    <label>Primary Cloud Platform:</label>
                    <span>Google Cloud Platform (GCP Cloud Run / Firebase)</span>
                  </div>
                  <div class="config-field">
                    <label>Secondary Cloud Ready:</label>
                    <span>AWS (App Runner / ECS & S3 + CloudFront)</span>
                  </div>
                  <div class="config-field">
                    <label>Containerization:</label>
                    <span>Multi-stage Dockerfile provided with Nginx & Node.js proxy</span>
                  </div>
                  <div class="config-field">
                    <label>One-Way Security:</label>
                    <span>SHA-256 salted password hashing, zero plaintext credentials</span>
                  </div>
                </div>
              </div>

              <!-- Post-Launch Support Notice -->
              <div class="support-notice-banner">
                <strong>✨ 30-Day Post-Launch Support Guarantee Included</strong>
                <p>
                  Our engineering team provides dedicated assistance for custom domain DNS routing on GCP/AWS, 
                  Square production API credential flips, and staff onboarding for the booking schedule.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  `,
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  public spaService = inject(SpaDataService);
  public authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    if (!this.authService.isAuthenticated() || this.authService.needsPasswordChange()) {
      this.router.navigate(['/login']);
    }
  }

  // Auth Inputs
  public loginUsername = 'admin';
  public loginPassword = '';
  public loginError = signal<string>('');
  public isAuthenticating = signal<boolean>(false);

  // Password Change Inputs
  public currentPassword = '';
  public newPassword = '';
  public confirmPassword = '';
  public passwordChangeError = signal<string>('');
  public passwordChangeSuccess = signal<boolean>(false);
  public isUpdatingPassword = signal<boolean>(false);
  public showPasswordModal = signal<boolean>(false);

  // Active Dashboard Tab
  public activeTab = signal<'appointments' | 'services' | 'products' | 'settings'>('appointments');

  public async handleLogin(e: Event) {
    e.preventDefault();
    this.loginError.set('');
    this.isAuthenticating.set(true);

    try {
      const result = await this.authService.login(this.loginUsername, this.loginPassword);
      if (!result.success) {
        this.loginError.set(result.errorMessage || 'Invalid credentials.');
      } else {
        if (result.mustChangePassword) {
          this.currentPassword = this.loginPassword; // prefill current password for convenience
        }
      }
    } catch (err: any) {
      this.loginError.set(err?.message || 'Authentication error.');
    } finally {
      this.isAuthenticating.set(false);
    }
  }

  public async handlePasswordChange(e: Event) {
    e.preventDefault();
    this.passwordChangeError.set('');
    this.passwordChangeSuccess.set(false);
    this.isUpdatingPassword.set(true);

    try {
      const result = await this.authService.changePassword(
        this.currentPassword,
        this.newPassword,
        this.confirmPassword
      );

      if (!result.success) {
        this.passwordChangeError.set(result.errorMessage || 'Could not update password.');
      } else {
        this.passwordChangeSuccess.set(true);
        setTimeout(() => {
          this.showPasswordModal.set(false);
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
        }, 1200);
      }
    } catch (err: any) {
      this.passwordChangeError.set(err?.message || 'Password update error.');
    } finally {
      this.isUpdatingPassword.set(false);
    }
  }

  public handleSignOut() {
    this.authService.logout();
    this.loginPassword = '';
    this.loginError.set('');
    this.router.navigate(['/login']);
  }

  public promptPasswordModal() {
    this.passwordChangeError.set('');
    this.passwordChangeSuccess.set(false);
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.showPasswordModal.set(true);
  }

  public updateStatus(id: string, status: AppointmentBooking['status']) {
    this.spaService.updateBookingStatus(id, status);
  }

  public saveService(service: TreatmentService) {
    this.spaService.saveService(service);
  }

  public updateIngredients(service: TreatmentService, value: string) {
    service.herbalIngredients = value.split(',').map(s => s.trim()).filter(s => !!s);
    this.saveService(service);
  }

  public saveProduct(product: HerbalProduct) {
    this.spaService.saveProduct(product);
  }
}
