import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from '../core/error.interceptor';
import { Router, provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not call the API while the form is invalid', () => {
    component.submit();
    http.expectNone('/api/auth/login');
    expect(component.form.touched).toBeTrue();
  });

  it('signs in and navigates to the role home page', () => {
    const nav = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    component.form.setValue({ username: 'ada@x.com', password: 'password123' });
    component.submit();
    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ username: 'ada@x.com', role: 'USER', studentId: 1 });
    expect(nav).toHaveBeenCalledWith('/my-courses');
  });

  it('shows an inline error on bad credentials', () => {
    component.form.setValue({ username: 'ada@x.com', password: 'nope' });
    component.submit();
    http.expectOne('/api/auth/login').flush({ status: 401, message: 'Invalid email or password' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect(component.submitting).toBeFalse();
    expect(fixture.nativeElement.querySelector('.alert')?.textContent).toContain('Invalid email or password');
  });
});
