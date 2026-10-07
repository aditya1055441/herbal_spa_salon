import { TestBed } from '@angular/core/testing';
import { SpaDataService } from './spa-data.service';
import { HerbalProduct } from '../models/spa.model';

describe('SpaDataService', () => {
  let service: SpaDataService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpaDataService);
  });

  it('should be created and load initial services', () => {
    expect(service).toBeTruthy();
    expect(service.services().length).toBeGreaterThan(0);
  });

  it('should correctly evaluate hair-focused diagnostic questionnaire answers', () => {
    const answers = {
      q1: 'hair',
      q2: 'dry_hair',
      q3: 'sensitive_red',
      q4: 'upper_tension'
    };

    const result = service.evaluateDiagnostic(answers);
    expect(result.primaryConcern).toBe('HAIR');
    expect(result.recommendedServices.length).toBeGreaterThanOrEqual(1);
    expect(result.recommendedServices[0].category).toBe('hair');
    expect(result.botanicalPrescriptionNotes.length).toBeGreaterThan(0);
  });

  it('should correctly manage cart state and compute subtotal', () => {
    const testProduct: HerbalProduct = {
      id: 'prod-test-1',
      name: 'Organic Herb Oil',
      botanicalCategory: 'elixir',
      price: 50,
      size: '50ml',
      description: 'Test description',
      keyHerbs: ['Lavender'],
      directions: 'Apply gently',
      rating: 5,
      inStock: true
    };

    expect(service.cart().length).toBe(0);
    expect(service.cartSubtotal()).toBe(0);

    service.addToCart(testProduct, 2);
    expect(service.cartItemCount()).toBe(2);
    expect(service.cartSubtotal()).toBe(100);

    // Verify localStorage persistence
    const savedCart = JSON.parse(localStorage.getItem('aura_botanica_cart') || '[]');
    expect(savedCart.length).toBe(1);
    expect(savedCart[0].quantity).toBe(2);

    service.updateCartQuantity('prod-test-1', 3);
    expect(service.cartItemCount()).toBe(3);
    expect(service.cartSubtotal()).toBe(150);

    service.removeFromCart('prod-test-1');
    expect(service.cart().length).toBe(0);
    expect(service.cartSubtotal()).toBe(0);
  });

  it('should record completed customer orders', () => {
    service.recordCompletedOrder({
      id: 'sq-ord-test-101',
      customerEmail: 'helena.vance@example.com',
      items: [],
      subtotal: 100,
      squarePaymentId: 'sq-pay-test',
      createdAt: new Date().toISOString(),
      status: 'confirmed'
    });

    expect(service.customerOrders().length).toBe(1);
    expect(service.customerOrders()[0].id).toBe('sq-ord-test-101');
  });

  it('should create an appointment booking with confirmed status', () => {
    const newBooking = service.createBooking({
      serviceId: 'srv-scalp-restoration',
      serviceName: 'Ayurvedic Scalp & Follicle Restoration',
      price: 165,
      durationMinutes: 75,
      date: '2026-10-20',
      timeSlot: '11:00 AM',
      specialistName: 'Elowen Reed (Herbal Trichologist)',
      guestName: 'Eleanor Vance',
      guestEmail: 'eleanor@example.com',
      guestPhone: '(415) 555-0199',
      status: 'confirmed'
    });

    expect(newBooking.id).toBeTruthy();
    expect(service.bookings().some(b => b.id === newBooking.id)).toBeTrue();

    service.updateBookingStatus(newBooking.id, 'completed');
    const updated = service.bookings().find(b => b.id === newBooking.id);
    expect(updated?.status).toBe('completed');
  });
});
