import { TestBed } from '@angular/core/testing';
import { CustomerAuthService } from './customer-auth.service';
import { provideHttpClient } from '@angular/common/http';

describe('CustomerAuthService', () => {
  let service: CustomerAuthService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });

    service = TestBed.inject(CustomerAuthService);
  });

  it('should be created and initialize with no logged-in customer by default', () => {
    expect(service).toBeTruthy();
    expect(service.isCustomerLoggedIn()).toBeFalse();
    expect(service.currentCustomer()).toBeNull();
  });

  it('should dispatch an email verification code and store pending email', async () => {
    const email = 'claire.dubois@example.com';
    const res = await service.sendVerificationCode(email);

    expect(res.success).toBeTrue();
    expect(service.pendingVerificationEmail()).toBe(email);
    expect(service.lastSentDemoCode()).toBeTruthy();
    expect(service.lastSentDemoCode()?.length).toBe(6);
  });

  it('should verify the code and register the customer account', async () => {
    const email = 'claire.dubois@example.com';
    const codeRes = await service.sendVerificationCode(email);
    const code = service.lastSentDemoCode()!;

    const verifyRes = await service.verifyCodeAndRegister(
      email,
      code,
      'Claire Dubois',
      'SanctuaryPass2026!',
      '(415) 555-0199'
    );

    expect(verifyRes.success).toBeTrue();
    expect(service.isCustomerLoggedIn()).toBeTrue();
    expect(service.currentCustomer()?.email).toBe(email);
    expect(service.currentCustomer()?.name).toBe('Claire Dubois');
    expect(service.currentCustomer()?.verified).toBeTrue();
  });

  it('should reject invalid verification code', async () => {
    const email = 'soraya@example.com';
    await service.sendVerificationCode(email);

    const invalidRes = await service.verifyCodeAndRegister(
      email,
      '000000', // incorrect code
      'Soraya',
      'SecretPass123!'
    );

    expect(invalidRes.success).toBeFalse();
    expect(service.isCustomerLoggedIn()).toBeFalse();
  });

  it('should log out customer and clear stored session', async () => {
    const email = 'claire@example.com';
    await service.sendVerificationCode(email);
    const code = service.lastSentDemoCode()!;
    await service.verifyCodeAndRegister(email, code, 'Claire', 'Pass1234');

    expect(service.isCustomerLoggedIn()).toBeTrue();

    service.logout();
    expect(service.isCustomerLoggedIn()).toBeFalse();
    expect(service.currentCustomer()).toBeNull();
    expect(service.customerToken()).toBeNull();
  });
});
