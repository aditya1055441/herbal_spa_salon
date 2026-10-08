import { Routes } from '@angular/router';
import { adminAuthGuard } from './guards/admin-auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'Aura Botanica | Pure Herbal & Chemical-Free Luxury Spa'
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services.component').then(m => m.ServicesComponent),
    title: 'Treatment Rituals & Holistic Therapies | Aura Botanica'
  },
  {
    path: 'diagnostic',
    loadComponent: () => import('./pages/diagnostic/diagnostic.component').then(m => m.DiagnosticComponent),
    title: 'Interactive Herbal Diagnostic Assessment | Aura Botanica'
  },
  {
    path: 'booking',
    loadComponent: () => import('./pages/booking/booking.component').then(m => m.BookingComponent),
    title: 'Reserve an Herbal Ritual | Square POS Sync | Aura Botanica'
  },
  {
    path: 'shop',
    loadComponent: () => import('./pages/shop/shop.component').then(m => m.ShopComponent),
    title: 'Take-Home Herbal Apothecary | Aura Botanica'
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent),
    title: 'Secure Checkout | Razorpay Card Payment | Aura Botanica'
  },
  {
    path: 'customer/auth',
    loadComponent: () => import('./pages/customer-auth/customer-auth.component').then(m => m.CustomerAuthComponent),
    title: 'Sanctuary Circle Member Portal | Aura Botanica'
  },
  {
    path: 'account',
    loadComponent: () => import('./pages/customer-account/customer-account.component').then(m => m.CustomerAccountComponent),
    title: 'My Sanctuary Profile & Rituals | Aura Botanica'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'Practitioner Portal Sign In | Aura Botanica'
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [adminAuthGuard],
    title: 'Sanctuary Practitioner CMS & Square Operations | Aura Botanica'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
