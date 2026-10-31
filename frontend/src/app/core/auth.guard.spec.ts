import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { adminGuard, authGuard, guestGuard, homeGuard, selfOrAdminGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AuthUser } from './models';

describe('auth guards', () => {
  let router: Router;

  function signInAs(user: AuthUser | null) {
    const auth = TestBed.inject(AuthService);
    auth.restore().subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne('/api/auth/me');
    user ? req.flush(user) : req.flush({ message: 'Please sign in' }, { status: 401, statusText: 'Unauthorized' });
  }

  const state = (url: string) => ({ url }) as RouterStateSnapshot;
  const route = (id?: string) => ({ paramMap: { get: () => id ?? null } }) as unknown as ActivatedRouteSnapshot;
  const run = (guard: typeof authGuard, r: ActivatedRouteSnapshot, url = '/x') =>
    TestBed.runInInjectionContext(() => guard(r, state(url)));
  const path = (result: unknown) => router.serializeUrl(result as UrlTree);

  const admin: AuthUser = { username: 'admin', role: 'ADMIN', studentId: null };
  const ada: AuthUser = { username: 'ada@x.com', role: 'USER', studentId: 5 };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    router = TestBed.inject(Router);
  });

  it('authGuard sends anonymous visitors to /login and remembers where they wanted to go', () => {
    signInAs(null);
    expect(path(run(authGuard, route(), '/my-courses'))).toBe('/login?returnUrl=%2Fmy-courses');
  });

  it('authGuard lets signed-in users through', () => {
    signInAs(ada);
    expect(run(authGuard, route())).toBeTrue();
  });

  it('adminGuard admits admins and bounces users to their own page', () => {
    signInAs(ada);
    expect(path(run(adminGuard, route()))).toBe('/my-courses');
  });

  it('adminGuard admits admins', () => {
    signInAs(admin);
    expect(run(adminGuard, route())).toBeTrue();
  });

  it('selfOrAdminGuard lets a user open only their own student record', () => {
    signInAs(ada);
    expect(run(selfOrAdminGuard, route('5'))).toBeTrue();
    expect(path(run(selfOrAdminGuard, route('6')))).toBe('/my-courses');
  });

  it('selfOrAdminGuard lets the admin open any student', () => {
    signInAs(admin);
    expect(run(selfOrAdminGuard, route('6'))).toBeTrue();
  });

  it('guestGuard keeps signed-in users away from login/register', () => {
    signInAs(admin);
    expect(path(run(guestGuard, route()))).toBe('/students');
  });

  it('homeGuard redirects by role, or to login when signed out', () => {
    signInAs(null);
    expect(path(run(homeGuard, route()))).toBe('/login');
  });
});
