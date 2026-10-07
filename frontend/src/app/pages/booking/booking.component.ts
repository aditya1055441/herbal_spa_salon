import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SpaDataService } from '../../services/spa-data.service';
import { SquareService } from '../../services/square.service';
import { CustomerAuthService } from '../../services/customer-auth.service';
import { TreatmentService, AppointmentBooking } from '../../models/spa.model';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="booking-page-section">
      <div class="container">
        
        <!-- Header -->
        <div class="booking-header text-center">
          <span class="section-tag">Sanctuary Schedule</span>
          <h1 class="booking-title">Reserve Your Herbal Ritual</h1>
          <p class="booking-subtitle">
            Synchronized with our master herbalists' in-house calendar. Friction-free, secure reservation powered by Square POS.
          </p>
          <div class="botanical-divider">🌿</div>
        </div>

        <!-- Success Booking Confirmation View -->
        <div *ngIf="confirmedBooking()" class="booking-confirmation-card luxury-card text-center">
          <div class="success-badge">✨ RESERVATION CONFIRMED</div>
          <h2>We Look Forward To Welcoming You</h2>
          <p class="conf-sub">A confirmation has been sent to <strong>{{ confirmedBooking()!.guestEmail }}</strong>.</p>

          <div class="confirmed-summary-box">
            <div class="conf-item">
              <span>Appointment ID:</span>
              <strong>{{ confirmedBooking()!.id }}</strong>
            </div>
            <div class="conf-item">
              <span>Treatment Ritual:</span>
              <strong>{{ confirmedBooking()!.serviceName }}</strong>
            </div>
            <div class="conf-item">
              <span>Reserved Date & Time:</span>
              <strong>{{ confirmedBooking()!.date }} at {{ confirmedBooking()!.timeSlot }}</strong>
            </div>
            <div class="conf-item">
              <span>Dedicated Practitioner:</span>
              <strong>{{ confirmedBooking()!.specialistName }}</strong>
            </div>
            <div class="conf-item">
              <span>Square POS Authorization:</span>
              <strong class="text-success">{{ confirmedBooking()!.squarePaymentId }} (Verified)</strong>
            </div>
          </div>

          <div class="arrival-guidelines">
            <h4>Preparing For Your Herbal Ritual:</h4>
            <p>🌿 Please arrive 15 minutes before your time slot to enjoy a warm botanical foot soak and seasonal welcome tea.</p>
            <p>🚫 Please refrain from applying synthetic hair gels, silicones, or perfume prior to arrival.</p>
          </div>

          <div class="confirmation-actions">
            <a routerLink="/" class="btn btn-outline">Return to Sanctuary Home</a>
            <a routerLink="/shop" class="btn btn-primary">Explore Take-Home Botanicals →</a>
          </div>
        </div>

        <!-- Multi-Step Booking Form -->
        <div *ngIf="!confirmedBooking()" class="booking-form-grid">
          
          <!-- Left Column: Interactive Booking Wizard -->
          <div class="booking-wizard-pane luxury-card">
            
            <!-- Step Indicators -->
            <div class="steps-nav">
              <button 
                class="step-nav-btn" 
                [class.active]="step() === 1" 
                [class.done]="step() > 1" 
                (click)="setStep(1)"
              >
                1. Ritual
              </button>
              <button 
                class="step-nav-btn" 
                [class.active]="step() === 2" 
                [class.done]="step() > 2" 
                [disabled]="!selectedService()" 
                (click)="setStep(2)"
              >
                2. Date & Time
              </button>
              <button 
                class="step-nav-btn" 
                [class.active]="step() === 3" 
                [class.done]="step() > 3" 
                [disabled]="!selectedTimeSlot()" 
                (click)="setStep(3)"
              >
                3. Guest Details
              </button>
              <button 
                class="step-nav-btn" 
                [class.active]="step() === 4" 
                [disabled]="!isGuestFormValid()" 
                (click)="setStep(4)"
              >
                4. Square POS
              </button>
            </div>

            <!-- STEP 1: Select Ritual -->
            <div *ngIf="step() === 1" class="step-content">
              <h3>Select Your Chemical-Free Ritual</h3>
              <p class="step-desc">Choose from our certified plant-based hair, skin, and body therapies.</p>

              <div class="services-picker-list">
                <div 
                  *ngFor="let s of spaService.services()" 
                  class="service-select-card"
                  [class.selected]="selectedService()?.id === s.id"
                  (click)="selectService(s)"
                >
                  <div class="svc-select-info">
                    <span class="badge badge-sage">{{ s.category | uppercase }}</span>
                    <h4>{{ s.name }}</h4>
                    <p class="svc-sub">{{ s.subtitle }}</p>
                    <div class="svc-specs">
                      <span>⏱️ {{ s.durationMinutes }} mins</span>
                      <span class="price">$\{{ s.price }}</span>
                    </div>
                  </div>
                  <div class="radio-indicator">
                    <span *ngIf="selectedService()?.id === s.id">✓</span>
                  </div>
                </div>
              </div>

              <div class="wizard-footer-nav text-right">
                <button 
                  class="btn btn-primary" 
                  [disabled]="!selectedService()" 
                  (click)="setStep(2)"
                >
                  Select Date & Time →
                </button>
              </div>
            </div>

            <!-- STEP 2: Calendar & In-House Schedule Picker -->
            <div *ngIf="step() === 2" class="step-content">
              <h3>Choose Date & Time Slot</h3>
              <p class="step-desc">Our calendar syncs directly with salon practitioners to prevent double-booking.</p>

              <!-- Practitioner Selection -->
              <div class="practitioner-picker">
                <label>Select Dedicated Herbal Specialist:</label>
                <select [(ngModel)]="selectedSpecialist" class="custom-select">
                  <option value="Elowen Reed (Herbal Trichologist)">Elowen Reed — Master Trichologist & Scalp Specialist</option>
                  <option value="Kaelen Thorne (Medicinal Herbalist)">Kaelen Thorne — Clinical Herbalist & Bodywork</option>
                  <option value="Anya Lin (Botanical Esthetician)">Anya Lin — Holisic Dermal Alchemist</option>
                  <option value="Any Available Master Herbalist">First Available Sanctuary Specialist</option>
                </select>
              </div>

              <!-- Date Picker Row -->
              <div class="date-selector-row">
                <label>Select Preferred Date:</label>
                <div class="dates-carousel">
                  <button 
                    *ngFor="let d of availableDates" 
                    class="date-pill"
                    [class.selected]="selectedDate() === d.iso"
                    (click)="selectDate(d.iso)"
                  >
                    <span class="date-weekday">{{ d.weekday }}</span>
                    <strong class="date-day">{{ d.day }}</strong>
                    <span class="date-month">{{ d.month }}</span>
                  </button>
                </div>
              </div>

              <!-- Available Time Slots Grid -->
              <div class="slots-container" *ngIf="selectedDate()">
                <label>Available Slots for {{ selectedDate() }}:</label>
                <div class="slots-grid">
                  <button 
                    *ngFor="let slot of availableTimeSlots" 
                    class="time-slot-btn"
                    [class.selected]="selectedTimeSlot() === slot"
                    [class.booked]="isSlotBooked(slot)"
                    [disabled]="isSlotBooked(slot)"
                    (click)="selectTimeSlot(slot)"
                  >
                    <span>{{ slot }}</span>
                    <small *ngIf="isSlotBooked(slot)" class="booked-tag">Reserved</small>
                    <small *ngIf="!isSlotBooked(slot)" class="avail-tag">Open</small>
                  </button>
                </div>
              </div>

              <div class="wizard-footer-nav between">
                <button class="btn btn-outline btn-sm" (click)="setStep(1)">← Back to Rituals</button>
                <button 
                  class="btn btn-primary" 
                  [disabled]="!selectedDate() || !selectedTimeSlot()" 
                  (click)="setStep(3)"
                >
                  Guest Details →
                </button>
              </div>
            </div>

            <!-- STEP 3: Guest Consultation Information -->
            <div *ngIf="step() === 3" class="step-content">
              <h3>Guest Information & Consultation Notes</h3>
              <p class="step-desc">Please share your details so our team can prepare fresh herbal infusions for your visit.</p>

              <form class="guest-details-form">
                <div class="form-row">
                  <div class="form-group">
                    <label>Full Name *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="guestName" 
                      name="guestName" 
                      placeholder="e.g. Helena Vance" 
                      required 
                      class="custom-input"
                    />
                  </div>
                  <div class="form-group">
                    <label>Email Address * (For Confirmation & Square Receipt)</label>
                    <input 
                      type="email" 
                      [(ngModel)]="guestEmail" 
                      name="guestEmail" 
                      placeholder="e.g. helena@example.com" 
                      required 
                      class="custom-input"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Phone Number *</label>
                    <input 
                      type="tel" 
                      [(ngModel)]="guestPhone" 
                      name="guestPhone" 
                      placeholder="e.g. (415) 555-0199" 
                      required 
                      class="custom-input"
                    />
                  </div>
                  <div class="form-group">
                    <label>Plant Allergies / Dermal Sensitivities</label>
                    <input 
                      type="text" 
                      [(ngModel)]="plantSensitivities" 
                      name="plantSensitivities" 
                      placeholder="e.g. Ragweed, Lavender, or None" 
                      class="custom-input"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label>Wellness Intentions or Specific Stress Areas (Optional)</label>
                  <textarea 
                    rows="3" 
                    [(ngModel)]="healthNotes" 
                    name="healthNotes" 
                    placeholder="Tell us what you are hoping to restore (e.g. dry tight scalp, heavy shoulder tension, wedding prep...)" 
                    class="custom-textarea"
                  ></textarea>
                </div>
              </form>

              <div class="wizard-footer-nav between">
                <button class="btn btn-outline btn-sm" (click)="setStep(2)">← Back to Calendar</button>
                <button 
                  class="btn btn-primary" 
                  [disabled]="!isGuestFormValid()" 
                  (click)="setStep(4)"
                >
                  Proceed to Square POS Authorization →
                </button>
              </div>
            </div>

            <!-- STEP 4: Square POS Payment & Authorization -->
            <div *ngIf="step() === 4" class="step-content">
              <h3>Square POS Secure Payment & Hold</h3>
              <p class="step-desc">
                Your appointment is securely confirmed through Square POS. Zero cancellation fees up to 24 hours prior.
              </p>

              <div class="square-pos-terminal-box">
                <div class="square-header-bar">
                  <span class="square-logo">■ Square POS</span>
                  <span class="secure-badge">🔒 256-Bit Encrypted</span>
                </div>

                <!-- Mount Container for Square Web Payments SDK -->
                <div id="card-container" class="square-card-container">
                  <!-- Fallback card simulation if SDK in sandbox offline mode -->
                  <div class="simulated-card-entry" *ngIf="!isSquareReady">
                    <label>Payment Card (Square Sandbox Test Entry)</label>
                    <div class="card-inputs-mock">
                      <input type="text" value="•••• •••• •••• 4242" readonly class="mock-card-num">
                      <div class="mock-row">
                        <input type="text" value="MM/YY: 12/28" readonly>
                        <input type="text" value="CVV: 123" readonly>
                        <input type="text" value="ZIP: 94129" readonly>
                      </div>
                    </div>
                    <small class="text-muted">✨ Square Web Payments SDK ready for Sandbox & Live transactions.</small>
                  </div>
                </div>

                <div class="price-breakdown">
                  <div class="breakdown-row">
                    <span>Ritual Service</span>
                    <span>$\{{ selectedService()?.price }}</span>
                  </div>
                  <div class="breakdown-row">
                    <span>Botanical Decoction Prep</span>
                    <span class="text-free">Included</span>
                  </div>
                  <div class="breakdown-row total">
                    <span>Total Due / Authorized</span>
                    <span class="total-amount">$\{{ selectedService()?.price }} USD</span>
                  </div>
                </div>

                <div *ngIf="paymentError()" class="payment-error-alert">
                  ⚠️ {{ paymentError() }}
                </div>

                <button 
                  class="btn btn-primary w-100 authorize-btn" 
                  [disabled]="isProcessingPayment()"
                  (click)="completeBookingWithSquare()"
                >
                  <span *ngIf="!isProcessingPayment()">
                    Confirm & Authorize with Square POS • $\{{ selectedService()?.price }}
                  </span>
                  <span *ngIf="isProcessingPayment()">
                    Processing through Square POS Gateway...
                  </span>
                </button>
              </div>

              <div class="wizard-footer-nav between">
                <button class="btn btn-outline btn-sm" (click)="setStep(3)">← Back to Details</button>
              </div>
            </div>

          </div>

          <!-- Right Column: Live Booking Summary Drawer -->
          <div class="booking-sidebar">
            <div class="luxury-card booking-summary-card">
              <h4>Sanctuary Reservation</h4>
              <div class="botanical-divider">🌿</div>

              <div *ngIf="selectedService()" class="summary-service-info">
                <span class="badge badge-sage">{{ selectedService()!.category | uppercase }}</span>
                <h5>{{ selectedService()!.name }}</h5>
                <p>{{ selectedService()!.subtitle }}</p>
                <div class="duration-badge">⏱️ {{ selectedService()!.durationMinutes }} minutes</div>
              </div>

              <div *ngIf="!selectedService()" class="no-selection-prompt">
                <p>Select a treatment ritual from the left to view summary details.</p>
              </div>

              <div class="summary-details-list" *ngIf="selectedService()">
                <div class="sum-row">
                  <span>Specialist:</span>
                  <strong>{{ selectedSpecialist.split('—')[0] }}</strong>
                </div>
                <div class="sum-row" *ngIf="selectedDate()">
                  <span>Date:</span>
                  <strong>{{ selectedDate() }}</strong>
                </div>
                <div class="sum-row" *ngIf="selectedTimeSlot()">
                  <span>Time:</span>
                  <strong>{{ selectedTimeSlot() }}</strong>
                </div>
                <div class="sum-row total-row">
                  <span>Investment:</span>
                  <span class="price-val">$\{{ selectedService()!.price }}</span>
                </div>
              </div>

              <div class="sanctuary-promise">
                <h6>Aura Botanica Promise:</h6>
                <ul>
                  <li>✓ 100% Chemical-free pure plant ingredients</li>
                  <li>✓ In-house calendar sync guarantee</li>
                  <li>✓ Frictionless Square POS checkout</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  `,
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit, OnDestroy {
  public spaService = inject(SpaDataService);
  public squareService = inject(SquareService);
  public customerAuth = inject(CustomerAuthService);

  public step = signal<number>(1);
  public selectedService = signal<TreatmentService | null>(null);
  public selectedDate = signal<string>('');
  public selectedTimeSlot = signal<string>('');
  public selectedSpecialist = 'Elowen Reed (Herbal Trichologist)';

  // Guest Information Form
  public guestName = '';
  public guestEmail = '';
  public guestPhone = '';
  public plantSensitivities = '';
  public healthNotes = '';

  // Payment & Status
  public isSquareReady = false;
  public isProcessingPayment = signal<boolean>(false);
  public paymentError = signal<string>('');
  public confirmedBooking = signal<AppointmentBooking | null>(null);

  // Dynamic Dates (Next 7 days)
  public availableDates: { iso: string; weekday: string; day: string; month: string }[] = [];

  // Standard Available Time Slots
  public availableTimeSlots: string[] = [
    '09:30 AM', '11:00 AM', '12:30 PM', '02:00 PM', '03:30 PM', '05:00 PM'
  ];

  ngOnInit() {
    this.generateUpcomingDates();

    // Auto-populate customer info if logged in
    const currentCustomer = this.customerAuth.currentCustomer();
    if (currentCustomer) {
      if (currentCustomer.name) this.guestName = currentCustomer.name;
      if (currentCustomer.email) this.guestEmail = currentCustomer.email;
      if (currentCustomer.phone) this.guestPhone = currentCustomer.phone;
    }

    // Check if a service was pre-selected from services or diagnostic page
    const preselected = this.spaService.activeBookingService();
    if (preselected) {
      this.selectedService.set(preselected);
      this.step.set(2);
    }
  }

  ngOnDestroy() {
    this.squareService.teardownCard();
  }

  private generateUpcomingDates() {
    const today = new Date();
    const days: typeof this.availableDates = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      // Skip Mondays (sanctuary closed)
      if (d.getDay() === 1) continue;

      const iso = d.toISOString().split('T')[0];
      days.push({
        iso,
        weekday: weekdays[d.getDay()],
        day: d.getDate().toString(),
        month: months[d.getMonth()]
      });
    }
    this.availableDates = days;
    if (days.length > 0) {
      this.selectedDate.set(days[0].iso);
    }
  }

  public setStep(s: number) {
    this.step.set(s);
    if (s === 4) {
      setTimeout(async () => {
        this.isSquareReady = await this.squareService.initializeCardPayment('card-container');
      }, 100);
    }
  }

  public selectService(service: TreatmentService) {
    this.selectedService.set(service);
    this.spaService.activeBookingService.set(service);
  }

  public selectDate(isoDate: string) {
    this.selectedDate.set(isoDate);
  }

  public selectTimeSlot(slot: string) {
    this.selectedTimeSlot.set(slot);
  }

  public isSlotBooked(slot: string): boolean {
    const date = this.selectedDate();
    return this.spaService.bookings().some(
      b => b.date === date && b.timeSlot === slot && b.status !== 'cancelled'
    );
  }

  public isGuestFormValid(): boolean {
    return !!(this.guestName.trim() && this.guestEmail.trim() && this.guestPhone.trim());
  }

  public async completeBookingWithSquare() {
    const svc = this.selectedService();
    if (!svc) return;

    this.isProcessingPayment.set(true);
    this.paymentError.set('');

    try {
      // Process through Square POS
      const paymentResult = await this.squareService.processPayment(
        svc.price,
        'USD',
        `Sanctuary Ritual: ${svc.name}`,
        {
          name: this.guestName,
          email: this.guestEmail,
          phone: this.guestPhone
        }
      );

      if (paymentResult.success) {
        // Create appointment in calendar
        const booking = this.spaService.createBooking({
          serviceId: svc.id,
          serviceName: svc.name,
          price: svc.price,
          durationMinutes: svc.durationMinutes,
          date: this.selectedDate(),
          timeSlot: this.selectedTimeSlot(),
          specialistName: this.selectedSpecialist,
          guestName: this.guestName,
          guestEmail: this.guestEmail,
          guestPhone: this.guestPhone,
          healthNotes: `${this.plantSensitivities ? 'Allergies: ' + this.plantSensitivities + '. ' : ''}${this.healthNotes}`,
          status: 'confirmed',
          squarePaymentId: paymentResult.paymentId,
          squareOrderId: paymentResult.orderId
        });

        this.confirmedBooking.set(booking);
        this.spaService.activeBookingService.set(null);
      } else {
        this.paymentError.set(paymentResult.errorMessage || 'Square POS transaction could not be authorized.');
      }
    } catch (e: any) {
      this.paymentError.set(e?.message || 'Square gateway error occurred.');
    } finally {
      this.isProcessingPayment.set(false);
    }
  }
}
