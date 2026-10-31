import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Any signed-in user; anonymous visitors are sent to /login and come back afterwards (returnUrl). */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.isLoggedIn || inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Admin-only routes. Regular users are bounced to their own home page. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  return auth.isAdmin || router.createUrlTree([auth.homeUrl]);
};

/** Admin, or a user opening their own student record (`/students/:id`). */
export const selfOrAdminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  const id = Number(route.paramMap.get('id'));
  return auth.isAdmin || auth.user?.studentId === id || router.createUrlTree([auth.homeUrl]);
};

/** Login / register pages: pointless once signed in. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.isLoggedIn || inject(Router).createUrlTree([auth.homeUrl]);
};

/** `/` -> the right landing page for whoever is (or is not) signed in. */
export const homeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return inject(Router).createUrlTree([auth.isLoggedIn ? auth.homeUrl : '/login']);
};
