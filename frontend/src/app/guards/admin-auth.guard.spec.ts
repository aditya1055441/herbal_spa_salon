import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { adminAuthGuard } from './admin-auth.guard';
import { AuthService } from '../services/auth.service';
import { provideHttpClient } from '@angular/common/http';

describe('adminAuthGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient()
      ]
    });

    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should block navigation to /admin and redirect to /login for unauthenticated visitors (e.g. in a different browser)', async () => {
    authService.isAuthenticated.set(false);
    authService.sessionToken.set(null);

    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/admin' } as RouterStateSnapshot;

    const result = await TestBed.runInInjectionContext(() => adminAuthGuard(route, state));

    expect(result instanceof UrlTree).toBeTrue();
    const tree = result as UrlTree;
    expect(tree.toString()).toContain('/login');
  });

  it('should block navigation to /admin if password change is still pending', async () => {
    authService.isAuthenticated.set(true);
    authService.sessionToken.set('test-token');
    authService.needsPasswordChange.set(true);

    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/admin' } as RouterStateSnapshot;

    const result = await TestBed.runInInjectionContext(() => adminAuthGuard(route, state));

    expect(result instanceof UrlTree).toBeTrue();
    const tree = result as UrlTree;
    expect(tree.toString()).toContain('/login');
  });

  it('should allow navigation to /admin when practitioner is authenticated with updated password', async () => {
    authService.isAuthenticated.set(true);
    authService.sessionToken.set('valid-active-token');
    authService.needsPasswordChange.set(false);

    // Spy on checkAuthentication to simulate successful verification
    spyOn(authService, 'checkAuthentication').and.returnValue(Promise.resolve(true));

    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/admin' } as RouterStateSnapshot;

    const result = await TestBed.runInInjectionContext(() => adminAuthGuard(route, state));

    expect(result).toBeTrue();
  });
});
