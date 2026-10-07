import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { provideHttpClient } from '@angular/common/http';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(AuthService);
    await service.ensureInitialized();
  });

  it('should be created and initialize default admin credentials with hashed password', async () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBeFalse();

    const stored = localStorage.getItem('aura_botanica_admin_credentials');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.username).toBe('admin');
    expect(parsed.isDefaultPassword).toBeTrue();
    // Password must be a 64-character SHA-256 hex string, NOT plain text "system"
    expect(parsed.passwordHash).not.toBe('system');
    expect(parsed.passwordHash.length).toBe(64);
  });

  it('should reject invalid username or password', async () => {
    const wrongUser = await service.login('wrong_user', 'system');
    expect(wrongUser.success).toBeFalse();
    expect(wrongUser.errorMessage).toContain('Invalid username or password');

    const wrongPass = await service.login('admin', 'wrong_pass');
    expect(wrongPass.success).toBeFalse();
    expect(wrongPass.errorMessage).toContain('Invalid username or password');
  });

  it('should successfully login with default credentials and require password change', async () => {
    const loginResult = await service.login('admin', 'system');
    expect(loginResult.success).toBeTrue();
    expect(loginResult.mustChangePassword).toBeTrue();
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.needsPasswordChange()).toBeTrue();
  });

  it('should reject password change if new password is "system" or does not match confirmation', async () => {
    await service.login('admin', 'system');

    // Mismatched confirmation
    const mismatch = await service.changePassword('system', 'NewHerbPass2026', 'DifferentPass');
    expect(mismatch.success).toBeFalse();
    expect(mismatch.errorMessage).toContain('do not match');

    // Attempting to reuse "system"
    const reuseSystem = await service.changePassword('system', 'system', 'system');
    expect(reuseSystem.success).toBeFalse();
    expect(reuseSystem.errorMessage).toContain('cannot be the default "system"');

    // Too short
    const tooShort = await service.changePassword('system', '123', '123');
    expect(tooShort.success).toBeFalse();
    expect(tooShort.errorMessage).toContain('at least 6 characters');
  });

  it('should successfully change password to a new hashed password and grant access', async () => {
    await service.login('admin', 'system');

    const changeResult = await service.changePassword('system', 'BotanicalPurity2026!', 'BotanicalPurity2026!');
    expect(changeResult.success).toBeTrue();
    expect(service.needsPasswordChange()).toBeFalse();

    // Verify stored credentials are now updated with new hash and isDefaultPassword is false
    const stored = JSON.parse(localStorage.getItem('aura_botanica_admin_credentials')!);
    expect(stored.isDefaultPassword).toBeFalse();
    expect(stored.passwordHash).not.toBe('BotanicalPurity2026!');
    expect(stored.passwordHash.length).toBe(64);

    // Logout and verify new password works while old password "system" fails
    service.logout();
    expect(service.isAuthenticated()).toBeFalse();

    const oldLogin = await service.login('admin', 'system');
    expect(oldLogin.success).toBeFalse();

    const newLogin = await service.login('admin', 'BotanicalPurity2026!');
    expect(newLogin.success).toBeTrue();
    expect(newLogin.mustChangePassword).toBeFalse();
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.needsPasswordChange()).toBeFalse();
  });

  it('should clear session upon logout', async () => {
    await service.login('admin', 'system');
    expect(service.isAuthenticated()).toBeTrue();

    service.logout();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUsername()).toBeNull();
  });
});
