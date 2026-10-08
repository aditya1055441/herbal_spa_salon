import { TestBed } from '@angular/core/testing';
import { RazorpayService } from './razorpay.service';
import { provideHttpClient } from '@angular/common/http';

describe('RazorpayService', () => {
  let service: RazorpayService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(RazorpayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get public config containing keyId without exposing secret', async () => {
    const config = await service.getPublicConfig();
    expect(config.keyId).toBe('rzp_test_TlHmBY5CY5RsrT');
    // Ensure secret is never present in config
    expect((config as any).keySecret).toBeUndefined();
  });

  it('should request order creation', async () => {
    const order = await service.createOrder(100, 'INR');
    expect(order).toBeTruthy();
    expect(order.amount).toBe(10000); // 100 * 100 paise
  });

  it('should verify payment with card details', async () => {
    const res = await service.verifyPayment({
      razorpay_order_id: 'order_test_101',
      razorpay_payment_id: 'pay_test_202',
      paymentMethod: 'credit_card',
      cardDetails: {
        cardholderName: 'Helena Vance',
        last4: '4242',
        expiry: '12/28'
      }
    });

    expect(res).toBeTruthy();
  });
});
