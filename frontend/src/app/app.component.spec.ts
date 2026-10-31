import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthService } from './core/auth.service';

describe('AppComponent', () => {
  function setup(user: unknown | null) {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(AppComponent);
    TestBed.inject(AuthService).restore().subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne('/api/auth/me');
    user ? req.flush(user) : req.flush({ message: 'Please sign in' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows sign in / register when signed out', () => {
    const el = setup(null);
    expect(el.textContent).toContain('Sign in');
    expect(el.textContent).toContain('Register');
    expect(el.textContent).not.toContain('Sign out');
  });

  it('shows the admin menu for admins', () => {
    const el = setup({ username: 'admin', role: 'ADMIN', studentId: null });
    expect(el.textContent).toContain('Students');
    expect(el.textContent).toContain('Courses');
    expect(el.textContent).toContain('Sign out');
    expect(el.textContent).not.toContain('My courses');
  });

  it('shows only the student menu for regular users', () => {
    const el = setup({ username: 'ada@x.com', role: 'USER', studentId: 3 });
    expect(el.textContent).toContain('My courses');
    expect(el.textContent).toContain('My profile');
    expect(el.textContent).not.toContain('Students');
  });
});
