import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('starts signed out', () => {
    expect(auth.isLoggedIn).toBeFalse();
    expect(auth.isAdmin).toBeFalse();
  });

  it('restore() adopts the server session, and treats 401 as signed out', () => {
    auth.restore().subscribe();
    http.expectOne('/api/auth/me').flush({ username: 'admin', role: 'ADMIN', studentId: null });
    expect(auth.isAdmin).toBeTrue();
    expect(auth.homeUrl).toBe('/students');

    auth.restore().subscribe();
    http.expectOne('/api/auth/me').flush({ message: 'Please sign in' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isLoggedIn).toBeFalse();
  });

  it('login() stores the user; regular users land on my courses', () => {
    auth.login({ username: 'ada@x.com', password: 'password123' }).subscribe();
    http.expectOne('/api/auth/login').flush({ username: 'ada@x.com', role: 'USER', studentId: 4 });
    expect(auth.user?.studentId).toBe(4);
    expect(auth.homeUrl).toBe('/my-courses');
  });

  it('logout() ends the session, clears it locally and goes to the login page', () => {
    const nav = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    auth.login({ username: 'a@x.com', password: 'password123' }).subscribe();
    http.expectOne('/api/auth/login').flush({ username: 'a@x.com', role: 'USER', studentId: 1 });

    auth.logout();
    http.expectOne('/api/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    http.expectOne('/api/auth/me').flush({ message: 'Please sign in' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isLoggedIn).toBeFalse();
    expect(nav).toHaveBeenCalledWith(['/login']);
  });
});
