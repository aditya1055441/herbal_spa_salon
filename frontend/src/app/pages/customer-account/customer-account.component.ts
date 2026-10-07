import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CustomerAuthService } from '../../services/customer-auth.service';
import { SpaDataService } from '../../services/spa-data.service';

@Component({
  selector: 'app-customer-account',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="customer-account-section">
      <div class="container">
        
        <!-- Customer Not Logged In State -->
        <div *ngIf="!customerAuth.isCustomerLoggedIn()" class="luxury-card login-prompt-card text-center">
          <div class="lock-icon">🌿</div>
          <h2>Sanctuary Member Portal</h2>
          <p>Please sign in or register with your email to view your appointments and herbal prescriptions.</p>
          <div class="mt-3">
            <a routerLink="/customer/auth" class="btn btn-primary">Sign In / Register with Email →</a>
          </div>
        </div>

        <!-- Authenticated Customer Dashboard -->
        <div *ngIf="customerAuth.isCustomerLoggedIn()" class="account-dashboard">
          
          <!-- Top Profile Banner -->
          <div class="luxury-card profile-banner">
            <div class="profile-info-row">
              <div class="avatar-circle">
                {{ customerInitial() }}
              </div>
              <div class="profile-text">
                <div class="badge-row">
                  <span class="badge badge-sage">Verified Sanctuary Member</span>
                  <span class="badge badge-gold">Botanical Circle Tier</span>
                </div>
                <h2>{{ customerAuth.currentCustomer()?.name }}</h2>
                <p class="email-tag">
                  ✉️ {{ customerAuth.currentCustomer()?.email }} 
                  <span class="verified-dot">✓ Email Verified</span>
                </p>
                <p *ngIf="customerAuth.currentCustomer()?.phone" class="phone-tag">
                  📞 {{ customerAuth.currentCustomer()?.phone }}
                </p>
              </div>
              <div class="profile-actions">
                <button class="btn btn-outline btn-sm" (click)="handleLogout()">
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          <!-- Dashboard Content Grid -->
          <div class="dashboard-grid">
            
            <!-- Left Column: My Appointments -->
            <div class="grid-col main-col">
              <div class="luxury-card">
                <div class="col-header flex-between">
                  <div>
                    <h3>Your Reserved Herbal Rituals</h3>
                    <p>Appointments synchronized with our master herbalists' schedule.</p>
                  </div>
                  <a routerLink="/booking" class="btn btn-primary btn-sm">
                    Book New Ritual →
                  </a>
                </div>

                <!-- Empty Appointments State -->
                <div *ngIf="customerBookings().length === 0" class="empty-bookings-state text-center">
                  <div class="empty-icon">🍃</div>
                  <h4>No upcoming appointments</h4>
                  <p>Ready to experience our chemical-free scalp, skin, or body therapies?</p>
                  <a routerLink="/services" class="btn btn-outline btn-sm">
                    Explore Herbal Rituals
                  </a>
                </div>

                <!-- Bookings List -->
                <div *ngIf="customerBookings().length > 0" class="bookings-list">
                  <div *ngFor="let b of customerBookings()" class="booking-item-card">
                    <div class="booking-item-top flex-between">
                      <div>
                        <span class="status-badge" [class]="'status-' + b.status">{{ b.status | uppercase }}</span>
                        <h4 class="booking-svc-title">{{ b.serviceName }}</h4>
                      </div>
                      <span class="booking-price">$\{{ b.price }} USD</span>
                    </div>

                    <div class="booking-specs-row">
                      <span>📅 <strong>{{ b.date }}</strong></span>
                      <span>⏱️ <strong>{{ b.timeSlot }}</strong> ({{ b.durationMinutes }} mins)</span>
                      <span>🌿 <strong>{{ b.specialistName.split('—')[0] }}</strong></span>
                    </div>

                    <div *ngIf="b.healthNotes" class="booking-notes">
                      <strong>Consultation Notes:</strong> {{ b.healthNotes }}
                    </div>

                    <div class="booking-footer flex-between">
                      <small class="pos-ref">Square POS Ref: {{ b.squarePaymentId || b.id }}</small>
                      <span class="prep-hint">🌿 Arrive 15 mins early for welcome tea</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- Right Column: Holistic Wellness Profile -->
            <div class="grid-col side-col">
              
              <!-- Diagnostic Prescription Quick Link -->
              <div class="luxury-card wellness-card mb-4">
                <h4>Holistic Diagnostic Assessment</h4>
                <div class="botanical-divider">🌿</div>
                <p>Have your hair or skin conditions shifted with the changing seasons?</p>
                <a routerLink="/diagnostic" class="btn btn-outline btn-sm w-100 mb-2">
                  Take Herbal Diagnostic Quiz →
                </a>
                <small class="text-muted">Generates instant personalized plant prescriptions.</small>
              </div>

              <!-- Take-Home Apothecary Loyalty Banner -->
              <div class="luxury-card apothecary-perk-card">
                <span class="perk-badge">Member Benefit</span>
                <h4>Sanctuary Apothecary</h4>
                <p>Enjoy complimentary organic herbal tea infusions with every take-home order.</p>
                <a routerLink="/shop" class="btn btn-secondary btn-sm w-100">
                  Shop Take-Home Botanicals →
                </a>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  `,
  styleUrls: ['./customer-account.component.css']
})
export class CustomerAccountComponent {
  public customerAuth = inject(CustomerAuthService);
  public spaService = inject(SpaDataService);
  private router = inject(Router);

  public customerInitial = computed(() => {
    const cust = this.customerAuth.currentCustomer();
    if (!cust || !cust.name) return 'G';
    return cust.name.charAt(0).toUpperCase();
  });

  public customerBookings = computed(() => {
    const cust = this.customerAuth.currentCustomer();
    if (!cust) return [];
    const custEmail = cust.email.toLowerCase();
    const allBookings = this.spaService.bookings();

    // Filter bookings matching this customer's email or phone
    const matched = allBookings.filter(b => 
      b.guestEmail.toLowerCase() === custEmail || 
      (cust.phone && b.guestPhone === cust.phone)
    );

    // If user is Helena Vance (our sample customer) and has no bookings yet, show sample
    if (matched.length === 0 && custEmail.includes('helena')) {
      return allBookings;
    }
    return matched;
  });

  public handleLogout() {
    this.customerAuth.logout();
    this.router.navigate(['/']);
  }
}
