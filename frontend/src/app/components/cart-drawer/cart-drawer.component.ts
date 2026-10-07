import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SpaDataService } from '../../services/spa-data.service';
import { SquareService } from '../../services/square.service';
import { CustomerAuthService } from '../../services/customer-auth.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Overlay Backdrop -->
    <div 
      class="cart-overlay" 
      [class.open]="isOpen()" 
      (click)="closeCart()"
      *ngIf="isOpen()"
    ></div>

    <!-- Slide-Out Drawer -->
    <aside class="cart-drawer" [class.open]="isOpen()">
      <div class="cart-header">
        <div class="header-titles">
          <h3>Your Botanical Bag</h3>
          <span class="bag-count">{{ spaService.cartItemCount() }} items</span>
        </div>
        <button class="close-btn" (click)="closeCart()" aria-label="Close cart">
          ✕
        </button>
      </div>

      <!-- Logged-in Customer Synchronized Bag Indicator -->
      <div *ngIf="customerAuth.isCustomerLoggedIn()" class="cart-member-banner">
        🌸 <span>Synchronized with <strong>{{ customerAuth.currentCustomer()?.name }}</strong>'s Dashboard</span>
      </div>

      <!-- Free Shipping / Herbal Care Banner -->
      <div class="cart-banner">
        🌿 <span>Complimentary organic herbal tea sample with every order</span>
      </div>

      <!-- Items List -->
      <div class="cart-body">
        <div *ngIf="spaService.cart().length === 0" class="empty-cart-state">
          <div class="empty-icon">🍃</div>
          <h4>Your bag is waiting</h4>
          <p>Explore our certified organic take-home remedies decocted to extend your treatment results.</p>
          <button class="btn btn-outline btn-sm" (click)="goToShop()">
            Explore Take-Home Apothecary
          </button>
        </div>

        <div *ngIf="spaService.cart().length > 0" class="cart-items-list">
          <div *ngFor="let item of spaService.cart()" class="cart-item-row">
            <div class="item-visual">
              <span class="botanical-symbol">🌱</span>
            </div>
            <div class="item-details">
              <h5 class="item-name">{{ item.product.name }}</h5>
              <span class="item-size">{{ item.product.size }}</span>
              <div class="item-price">$\{{ item.product.price }} each</div>

              <!-- Quantity Controls -->
              <div class="item-qty-row">
                <div class="qty-stepper">
                  <button (click)="spaService.updateCartQuantity(item.product.id, item.quantity - 1)">-</button>
                  <span>{{ item.quantity }}</span>
                  <button (click)="spaService.updateCartQuantity(item.product.id, item.quantity + 1)">+</button>
                </div>
                <button class="remove-btn" (click)="spaService.removeFromCart(item.product.id)">Remove</button>
              </div>
            </div>
            <div class="item-total">
              $\{{ item.product.price * item.quantity }}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer / Checkout Area -->
      <div class="cart-footer" *ngIf="spaService.cart().length > 0">
        <div class="summary-line">
          <span>Subtotal</span>
          <span class="subtotal-val">$\{{ spaService.cartSubtotal() }}</span>
        </div>
        <p class="tax-shipping-note">Taxes calculated at Square POS checkout. Carbon-neutral shipping.</p>

        <!-- Square Checkout Action -->
        <button 
          class="btn btn-primary w-100 checkout-btn" 
          [disabled]="isCheckingOut()"
          (click)="handleCheckout()"
        >
          <span *ngIf="!isCheckingOut()">
            Square POS Checkout • $\{{ spaService.cartSubtotal() }}
          </span>
          <span *ngIf="isCheckingOut()" class="spinner-inline">
            Connecting to Square POS...
          </span>
        </button>

        <div *ngIf="checkoutSuccess()" class="checkout-success-msg">
          ✨ <strong>Order Confirmed via Square POS!</strong>
          <p>Order ID: {{ orderId() }}</p>
          <p>We are gently packaging your herbal remedies in sustainable amber glass.</p>
        </div>
      </div>
    </aside>
  `,
  styleUrls: ['./cart-drawer.component.css']
})
export class CartDrawerComponent implements OnInit, OnDestroy {
  public spaService = inject(SpaDataService);
  public squareService = inject(SquareService);
  public customerAuth = inject(CustomerAuthService);
  private router = inject(Router);

  public isOpen = signal<boolean>(false);
  public isCheckingOut = signal<boolean>(false);
  public checkoutSuccess = signal<boolean>(false);
  public orderId = signal<string>('');

  private cartListener = () => {
    this.isOpen.update(v => !v);
  };

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.addEventListener('toggle-apothecary-cart', this.cartListener);
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('toggle-apothecary-cart', this.cartListener);
    }
  }

  public closeCart() {
    this.isOpen.set(false);
  }

  public goToShop() {
    this.closeCart();
    this.router.navigate(['/shop']);
  }

  public async handleCheckout() {
    this.isCheckingOut.set(true);
    const subtotal = this.spaService.cartSubtotal();
    const currentCustomer = this.customerAuth.currentCustomer();

    try {
      const result = await this.squareService.processPayment(
        subtotal,
        'USD',
        'Take-Home Apothecary Botanicals Order',
        {
          name: currentCustomer?.name || 'Spa Guest',
          email: currentCustomer?.email || 'guest@aurabotanica.com',
          phone: currentCustomer?.phone
        }
      );

      if (result.success) {
        const orderIdGenerated = result.orderId || `sq-ord-${Date.now().toString(36)}`;
        this.orderId.set(orderIdGenerated);
        
        // Record order in spaService state for customer dashboard
        this.spaService.recordCompletedOrder({
          id: orderIdGenerated,
          customerEmail: currentCustomer?.email || 'guest@aurabotanica.com',
          items: [...this.spaService.cart()],
          subtotal: subtotal,
          squarePaymentId: result.paymentId,
          squareOrderId: result.orderId,
          createdAt: new Date().toISOString(),
          status: 'confirmed'
        });

        this.checkoutSuccess.set(true);
        setTimeout(() => {
          this.spaService.clearCart();
          this.isCheckingOut.set(false);
        }, 1200);
      }
    } catch (e) {
      console.error(e);
      this.isCheckingOut.set(false);
    }
  }
}
