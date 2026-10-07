import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard that strictly prevents unauthorized browsers from directly accessing /admin.
 * If no verified session exists in this browser, navigation is blocked and redirected to /login.
 */
export const adminAuthGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuth = await authService.checkAuthentication();

  if (isAuth && !authService.needsPasswordChange()) {
    return true;
  }

  // Block navigation to /admin and redirect to /login
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
