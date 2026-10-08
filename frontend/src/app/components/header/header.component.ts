import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SpaDataService } from '../../services/spa-data.service';
import { CustomerAuthService } from '../../services/customer-auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="spa-header" [class.scrolled]="isScrolled()">
      <div class="top-banner">
        <span>✨ 100% Pure Plant Ingredients • Zero Synthetic Chemicals, Parabens, Sulfates, or PPD • Pure Botanical Alchemy</span>
      </div>

      <div class="main-nav-container">
        <!-- Logo -->
        <a routerLink="/" class="brand-logo" (click)="closeMobileMenu()">
          <span class="brand-title">AURA BOTANICA</span>
          <span class="brand-sub">PURE HERBAL SANCTUARY & SALON</span>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="desktop-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-highlight">
            <span class="sparkle-dot"></span>Philosophy
          </a>
          <a routerLink="/services" routerLinkActive="active" class="nav-highlight">
            <span class="sparkle-dot"></span>Treatments
          </a>
          <a routerLink="/diagnostic" routerLinkActive="active" class="nav-highlight">
            <span class="sparkle-dot"></span> Herbal Diagnostic
          </a>
          <a routerLink="/shop" routerLinkActive="active" class="nav-highlight">
            <span class="sparkle-dot"></span> Shop
          </a>
          <a routerLink="/admin" routerLinkActive="active" class="nav-highlight" title="Admin Panel">
            <span class="sparkle-dot"></span> CMS Login
          </a>
        </nav>

        <!-- Right Action Items -->
        <div class="nav-actions">

          <!-- Customer Account / Sign In Pill -->
          <a
            *ngIf="customerAuth.isCustomerLoggedIn()"
            routerLink="/account"
            class="customer-nav-pill"
            title="My Sanctuary Account"
          >
            <span class="avatar-dot">🌸</span>
            <span class="cust-first-name">{{ getFirstName() }}</span>
          </a>

          <a
            *ngIf="!customerAuth.isCustomerLoggedIn()"
            routerLink="/customer/auth"
            class="guest-signin-link"
          >
            Guest Sign In
          </a>

          <!-- Shopping Cart Indicator -->
          <button class="cart-trigger-btn" (click)="toggleCart()" aria-label="View herbal apothecary bag">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span *ngIf="spaService.cartItemCount() > 0" class="cart-count-badge">
              {{ spaService.cartItemCount() }}
            </span>
          </button>

          <!-- Book Appointment Primary CTA -->
          <a routerLink="/booking" class="btn btn-primary btn-sm book-cta">
            Book Appointment
          </a>

          <!-- Mobile Hamburger -->
          <button class="mobile-toggle" (click)="toggleMobileMenu()" [attr.aria-expanded]="mobileMenuOpen()" aria-label="Toggle Navigation">
            <span class="hamburger-bar" [class.open]="mobileMenuOpen()"></span>
            <span class="hamburger-bar" [class.open]="mobileMenuOpen()"></span>
            <span class="hamburger-bar" [class.open]="mobileMenuOpen()"></span>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div class="mobile-drawer" [class.open]="mobileMenuOpen()">
        <nav class="mobile-nav-links">
          <a routerLink="/" (click)="closeMobileMenu()">Philosophy & Story</a>
          <a routerLink="/services" (click)="closeMobileMenu()">Rituals & Treatments</a>
          <a routerLink="/diagnostic" (click)="closeMobileMenu()" class="mobile-highlight">
            ✨ Take Diagnostic Questionnaire
          </a>
          <a routerLink="/shop" (click)="closeMobileMenu()">Take-Home Apothecary</a>

          <a
            *ngIf="customerAuth.isCustomerLoggedIn()"
            routerLink="/account"
            (click)="closeMobileMenu()"
            class="mobile-cust-link"
          >
            🌸 My Sanctuary Profile ({{ customerAuth.currentCustomer()?.name }})
          </a>
          <a
            *ngIf="!customerAuth.isCustomerLoggedIn()"
            routerLink="/customer/auth"
            (click)="closeMobileMenu()"
            class="mobile-cust-link"
          >
            🌿 Guest Sign In / Register
          </a>

          <a routerLink="/booking" (click)="closeMobileMenu()" class="btn btn-primary w-100">
            Book Appointment
          </a>
          <a routerLink="/admin" (click)="closeMobileMenu()" class="mobile-admin-link">Practitioner Admin Portal</a>
        </nav>
      </div>
    </header>
  `,
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  public spaService = inject(SpaDataService);
  public customerAuth = inject(CustomerAuthService);

  public isScrolled = signal<boolean>(false);
  public mobileMenuOpen = signal<boolean>(false);
  public isCartOpen = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolled.set(window.scrollY > 20);
      });
    }
  }

  public getFirstName(): string {
    const name = this.customerAuth.currentCustomer()?.name;
    if (!name) return 'Account';
    return name.split(' ')[0];
  }

  public toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

  public closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  public toggleCart() {
    const event = new CustomEvent('toggle-apothecary-cart');
    window.dispatchEvent(event);
  }
}
