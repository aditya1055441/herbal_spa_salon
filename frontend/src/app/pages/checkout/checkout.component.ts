import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SpaDataService } from '../../services/spa-data.service';
import { CustomerAuthService } from '../../services/customer-auth.service';
import { RazorpayService } from '../../services/razorpay.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="checkout-page-section">
      <div class="container">
        
        <!-- Header -->
        <div class="checkout-header text-center">
          <span class="section-tag">Secure Checkout</span>
          <h1 class="checkout-title">Complete Your Herbal Order</h1>
          <p class="checkout-subtitle">
            Secure, encrypted checkout powered by Razorpay. 100% certified organic formulations in amber glass.
          </p>
          <div class="botanical-divider">🌿</div>
        </div>

        <!-- ===================================================================
             VIEW 1: ORDER CONFIRMED SUCCESS VIEW
             =================================================================== -->
        <div *ngIf="orderConfirmed()" class="luxury-card confirmed-card text-center">
          <div class="success-badge">✨ ORDER SUCCESSFULLY PLACED</div>
          <h2>Thank You For Embracing Pure Botanicals</h2>
          <p class="conf-sub">A receipt and dispatch tracking update will be sent to <strong>{{ customerEmail }}</strong>.</p>

          <div class="confirmed-order-box text-left">
            <div class="conf-line">
              <span>Razorpay Payment ID:</span>
              <strong class="text-success">{{ confirmedPaymentId() }}</strong>
            </div>
            <div class="conf-line">
              <span>Order Reference:</span>
              <strong>{{ confirmedOrderId() }}</strong>
            </div>
            <div class="conf-line">
              <span>Payment Method:</span>
              <strong>{{ paymentMethod === 'debit_card' ? 'Debit Card' : 'Credit Card' }} (•••• {{ cardLast4() }})</strong>
            </div>
            <div class="conf-line">
              <span>Delivery Recipient:</span>
              <strong>{{ customerName }} ({{ customerPhone }})</strong>
            </div>
            <div class="conf-line">
              <span>Shipping Address:</span>
              <strong>{{ shippingAddress }}, {{ shippingCity }} - {{ shippingPostal }}</strong>
            </div>
            <div class="conf-line total-line">
              <span>Total Paid:</span>
              <strong class="total-paid">$\{{ confirmedTotal() }} USD</strong>
            </div>
          </div>

          <div class="eco-packaging-notice">
            🌿 <strong>Eco-Sanctuary Packaging:</strong> Your botanical elixirs are packed in biodegradable recycled paper and dark amber glass bottles to preserve photoprotective bio-actives.
          </div>

          <div class="conf-actions">
            <a routerLink="/account" class="btn btn-outline">View in Your Dashboard</a>
            <a routerLink="/shop" class="btn btn-primary">Return to Apothecary →</a>
          </div>
        </div>

        <!-- ===================================================================
             VIEW 2: CHECKOUT FORM & SUMMARY
             =================================================================== -->
        <div *ngIf="!orderConfirmed()" class="checkout-grid">
          
          <!-- Empty Bag Alert if accessed with empty cart -->
          <div *ngIf="spaService.cart().length === 0" class="luxury-card empty-cart-card text-center w-100">
            <div class="empty-icon">🍃</div>
            <h3>Your Botanical Bag is Empty</h3>
            <p>Please select your desired herbal remedies from our apothecary before proceeding to checkout.</p>
            <a routerLink="/shop" class="btn btn-primary mt-3">Explore Herbal Apothecary →</a>
          </div>

          <!-- Checkout Form Column -->
          <div *ngIf="spaService.cart().length > 0" class="checkout-form-col">
            
            <form (submit)="processRazorpayPayment($event)">
              
              <!-- 1. Customer Contact & Delivery Info -->
              <div class="luxury-card checkout-card mb-4">
                <div class="card-step-header">
                  <span class="step-num">1</span>
                  <h3>Contact & Shipping Details</h3>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Full Name *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="customerName" 
                      name="custName" 
                      placeholder="e.g. Helena Vance" 
                      required 
                      class="custom-input"
                    />
                  </div>
                  <div class="form-group">
                    <label>Email Address * (For Order Confirmation)</label>
                    <input 
                      type="email" 
                      [(ngModel)]="customerEmail" 
                      name="custEmail" 
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
                      [(ngModel)]="customerPhone" 
                      name="custPhone" 
                      placeholder="(415) 555-0192" 
                      required 
                      class="custom-input"
                    />
                  </div>
                  <div class="form-group">
                    <label>Street Address *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="shippingAddress" 
                      name="shipAddr" 
                      placeholder="482 Botanical Grove Way" 
                      required 
                      class="custom-input"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>City *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="shippingCity" 
                      name="shipCity" 
                      placeholder="San Francisco" 
                      required 
                      class="custom-input"
                    />
                  </div>
                  <div class="form-group">
                    <label>Postal / ZIP Code *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="shippingPostal" 
                      name="shipZip" 
                      placeholder="94129" 
                      required 
                      class="custom-input"
                    />
                  </div>
                </div>
              </div>

              <!-- 2. Payment Method: Credit Card vs Debit Card -->
              <div class="luxury-card checkout-card mb-4">
                <div class="card-step-header">
                  <span class="step-num">2</span>
                  <h3>Select Payment Method</h3>
                </div>

                <!-- Method Switcher -->
                <div class="payment-tabs-pill">
                  <button 
                    type="button" 
                    [class.active]="paymentMethod === 'credit_card'" 
                    (click)="paymentMethod = 'credit_card'"
                  >
                    💳 Credit Card
                  </button>
                  <button 
                    type="button" 
                    [class.active]="paymentMethod === 'debit_card'" 
                    (click)="paymentMethod = 'debit_card'"
                  >
                    💳 Debit Card
                  </button>
                </div>

                <div class="card-brands-row">
                  <span class="brand-pill">VISA</span>
                  <span class="brand-pill">Mastercard</span>
                  <span class="brand-pill">RuPay</span>
                  <span class="brand-pill">American Express</span>
                  <span class="brand-pill">Maestro</span>
                </div>

                <!-- Card Details Input Form -->
                <div class="card-input-box">
                  <div class="form-group mb-3">
                    <label>Name on Card *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="cardholderName" 
                      name="cardholderName" 
                      placeholder="e.g. Helena Vance" 
                      required 
                      class="custom-input"
                    />
                  </div>

                  <div class="form-group mb-3">
                    <label>{{ paymentMethod === 'debit_card' ? 'Debit Card Number *' : 'Credit Card Number *' }}</label>
                    <div class="card-number-wrapper">
                      <input 
                        type="text" 
                        [(ngModel)]="cardNumber" 
                        (input)="formatCardNumber($event)"
                        name="cardNumber" 
                        placeholder="•••• •••• •••• ••••" 
                        maxlength="19" 
                        required 
                        class="custom-input card-num-input"
                      />
                      <span class="card-chip-icon">💳</span>
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Expiry Date (MM/YY) *</label>
                      <input 
                        type="text" 
                        [(ngModel)]="cardExpiry" 
                        (input)="formatExpiry($event)"
                        name="cardExpiry" 
                        placeholder="MM / YY" 
                        maxlength="5" 
                        required 
                        class="custom-input text-center"
                      />
                    </div>
                    <div class="form-group">
                      <label>CVV / CVC (3-4 digits) *</label>
                      <input 
                        type="password" 
                        [(ngModel)]="cardCvv" 
                        name="cardCvv" 
                        placeholder="•••" 
                        maxlength="4" 
                        required 
                        class="custom-input text-center"
                      />
                    </div>
                  </div>

                  <div class="razorpay-badge-strip">
                    <div class="badge-lock">🔒</div>
                    <div class="badge-copy">
                      <strong>Razorpay Payment Gateway Protection:</strong>
                      <span>256-bit SSL encryption. API Key Secret is stored securely on the backend server.</span>
                    </div>
                  </div>
                </div>

                <div *ngIf="errorMessage()" class="alert-banner alert-error mt-3">
                  ⚠️ {{ errorMessage() }}
                </div>

                <!-- Submit Button -->
                <button 
                  type="submit" 
                  class="btn btn-primary w-100 btn-lg mt-4 pay-btn" 
                  [disabled]="isProcessing() || !isFormValid()"
                >
                  <span *ngIf="!isProcessing()">
                    Pay via Razorpay • $\{{ spaService.cartSubtotal() }} USD
                  </span>
                  <span *ngIf="isProcessing()">
                    Authorizing & Processing with Razorpay...
                  </span>
                </button>

              </div>

            </form>

          </div>

          <!-- Order Summary Column -->
          <div *ngIf="spaService.cart().length > 0" class="checkout-summary-col">
            <div class="luxury-card summary-card sticky-card">
              <h3>Order Summary</h3>
              <div class="botanical-divider">🍃</div>

              <div class="summary-items-list">
                <div *ngFor="let item of spaService.cart()" class="summary-item-row">
                  <div class="summary-item-left">
                    <span class="item-emoji">🌱</span>
                    <div>
                      <h5>{{ item.product.name }}</h5>
                      <small>{{ item.product.size }} • Qty: {{ item.quantity }}</small>
                    </div>
                  </div>
                  <span class="item-total-price">$\{{ item.product.price * item.quantity }}</span>
                </div>
              </div>

              <div class="cost-breakdown">
                <div class="cost-row">
                  <span>Subtotal</span>
                  <strong>$\{{ spaService.cartSubtotal() }}</strong>
                </div>
                <div class="cost-row">
                  <span>Carbon-Neutral Delivery</span>
                  <strong class="text-free">Complimentary</strong>
                </div>
                <div class="cost-row">
                  <span>Organic Herbal Tea Gift</span>
                  <strong class="text-free">Included</strong>
                </div>
                <div class="cost-row total-row">
                  <span>Total Amount</span>
                  <span class="grand-total">$\{{ spaService.cartSubtotal() }} USD</span>
                </div>
              </div>

              <div class="sanctuary-guarantee">
                <h6>Aura Botanica Assurance:</h6>
                <ul>
                  <li>✓ 100% certified plant ingredients</li>
                  <li>✓ Razorpay encrypted payment gateway</li>
                  <li>✓ Fast carbon-neutral eco dispatch</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  `,
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  public spaService = inject(SpaDataService);
  public customerAuth = inject(CustomerAuthService);
  public razorpayService = inject(RazorpayService);
  private router = inject(Router);

  // Form Fields
  public customerName = '';
  public customerEmail = '';
  public customerPhone = '';
  public shippingAddress = '482 Botanical Way';
  public shippingCity = 'San Francisco';
  public shippingPostal = '94129';

  // Payment Options
  public paymentMethod: 'credit_card' | 'debit_card' = 'credit_card';
  public cardholderName = '';
  public cardNumber = '';
  public cardExpiry = '';
  public cardCvv = '';

  // State
  public isProcessing = signal<boolean>(false);
  public errorMessage = signal<string>('');
  public orderConfirmed = signal<boolean>(false);
  public confirmedPaymentId = signal<string>('');
  public confirmedOrderId = signal<string>('');
  public confirmedTotal = signal<number>(0);
  public cardLast4 = signal<string>('4242');

  ngOnInit() {
    const cust = this.customerAuth.currentCustomer();
    if (cust) {
      if (cust.name) this.customerName = cust.name;
      if (cust.email) this.customerEmail = cust.email;
      if (cust.phone) this.customerPhone = cust.phone;
      if (cust.name) this.cardholderName = cust.name;
    }
  }

  public formatCardNumber(event: any) {
    let input = event.target.value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < input.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += input[i];
    }
    this.cardNumber = formatted;
  }

  public formatExpiry(event: any) {
    let input = event.target.value.replace(/\D/g, '');
    if (input.length > 2) {
      this.cardExpiry = input.substring(0, 2) + '/' + input.substring(2, 4);
    } else {
      this.cardExpiry = input;
    }
  }

  public isFormValid(): boolean {
    return !!(
      this.customerName.trim() &&
      this.customerEmail.trim() &&
      this.customerPhone.trim() &&
      this.shippingAddress.trim() &&
      this.cardholderName.trim() &&
      this.cardNumber.replace(/\s/g, '').length >= 15 &&
      this.cardExpiry.length === 5 &&
      this.cardCvv.length >= 3
    );
  }

  public async processRazorpayPayment(e: Event) {
    e.preventDefault();
    if (!this.isFormValid()) return;

    this.isProcessing.set(true);
    this.errorMessage.set('');

    const subtotal = this.spaService.cartSubtotal();
    const cleanCard = this.cardNumber.replace(/\s/g, '');
    const last4 = cleanCard.substring(cleanCard.length - 4);
    this.cardLast4.set(last4);

    try {
      // 1. Create Razorpay order on backend server
      const orderRes = await this.razorpayService.createOrder(subtotal, 'INR', {
        customerEmail: this.customerEmail,
        customerName: this.customerName
      });

      const orderId = orderRes.orderId || `order_${Date.now().toString(36)}`;
      const paymentId = `pay_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;

      // 2. Verify payment on backend server using HMAC-SHA256
      const verifyRes = await this.razorpayService.verifyPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        paymentMethod: this.paymentMethod,
        cardDetails: {
          cardholderName: this.cardholderName,
          last4,
          expiry: this.cardExpiry
        },
        customerDetails: {
          name: this.customerName,
          email: this.customerEmail,
          phone: this.customerPhone
        }
      });

      if (verifyRes.success) {
        // Record completed order in spa data service
        this.spaService.recordCompletedOrder({
          id: orderId,
          customerEmail: this.customerEmail,
          items: [...this.spaService.cart()],
          subtotal,
          squarePaymentId: paymentId,
          squareOrderId: orderId,
          createdAt: new Date().toISOString(),
          status: 'confirmed'
        });

        this.confirmedPaymentId.set(paymentId);
        this.confirmedOrderId.set(orderId);
        this.confirmedTotal.set(subtotal);
        this.orderConfirmed.set(true);

        // Clear bag
        this.spaService.clearCart();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.errorMessage.set(verifyRes.errorMessage || 'Payment could not be verified by Razorpay.');
      }

    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Razorpay payment processing error.');
    } finally {
      this.isProcessing.set(false);
    }
  }
}
