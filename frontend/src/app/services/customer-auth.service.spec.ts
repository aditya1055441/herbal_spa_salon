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
    const email = `test.user.${Date.now()}.${Math.random().toString(36).substring(2, 6)}@example.com`;
    const res = await service.sendVerificationCode(email);

    expect(res.success).toBeTrue();
    expect(service.pendingVerificationEmail()).toBe(email);
    expect(service.lastSentDemoCode()).toBeTruthy();
    expect(service.lastSentDemoCode()?.length).toBe(6);
  });

  it('should verify the code and register the customer account', async () => {
    const email = `test.reg.${Date.now()}.${Math.random().toString(36).substring(2, 6)}@example.com`;
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

  it('should notify "user already registerd, please sign-in to continue" if email is already registered', async () => {
    const email = `test.dup.${Date.now()}.${Math.random().toString(36).substring(2, 6)}@example.com`;
    // 1. Register first
    await service.sendVerificationCode(email);
    const code = service.lastSentDemoCode()!;
    await service.verifyCodeAndRegister(email, code, 'Claire', 'Pass1234');

    // 2. Attempt to register again with the same email
    const duplicateRes = await service.sendVerificationCode(email);
    expect(duplicateRes.success).toBeFalse();
    expect(duplicateRes.alreadyRegistered).toBeTrue();
    expect(duplicateRes.message).toContain('user already registerd, please sign-in to continue');
  });

  it('should allow user to log out and successfully sign in again with the same email and password', async () => {
    const email = `test.login.${Date.now()}.${Math.random().toString(36).substring(2, 6)}@example.com`;
    const password = 'MyHerbalPass2026!';

    // 1. Register
    await service.sendVerificationCode(email);
    const code = service.lastSentDemoCode()!;
    const regRes = await service.verifyCodeAndRegister(email, code, 'Eleanor Vance', password);
    expect(regRes.success).toBeTrue();

    // 2. Log out
    service.logout();
    expect(service.isCustomerLoggedIn()).toBeFalse();
    expect(service.currentCustomer()).toBeNull();

    // 3. Sign in with same email and password
    const loginRes = await service.loginWithPassword(email, password);
    expect(loginRes.success).toBeTrue();
    expect(service.isCustomerLoggedIn()).toBeTrue();
    expect(service.currentCustomer()?.email).toBe(email);
    expect(service.currentCustomer()?.name).toBe('Eleanor Vance');

    // 4. Reject invalid password
    service.logout();
    const badLogin = await service.loginWithPassword(email, 'WrongPassword123');
    expect(badLogin.success).toBeFalse();
    expect(badLogin.errorMessage).toContain('Invalid email or password');
  });

  it('should reject invalid verification code', async () => {
    const email = `test.invalid.${Date.now()}.${Math.random().toString(36).substring(2, 6)}@example.com`;
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
});
