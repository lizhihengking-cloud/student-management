import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from '../core/error.interceptor';
import { Router, provideRouter } from '@angular/router';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let http: HttpTestingController;

  const valid = {
    firstName: 'Ada', lastName: 'Lovelace', email: 'ada@x.com',
    dateOfBirth: '', password: 'password123', confirmPassword: 'password123',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideHttpClient(withInterceptors([errorInterceptor])), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rejects mismatching passwords and short passwords', () => {
    component.form.setValue({ ...valid, confirmPassword: 'different' });
    expect(component.form.controls.confirmPassword.errors?.['mismatch']).toBeTrue();
    component.form.setValue({ ...valid, password: 'short', confirmPassword: 'short' });
    expect(component.form.controls.password.errors?.['minlength']).toBeTruthy();
    component.submit();
    http.expectNone('/api/auth/register');
  });

  it('posts the registration (without the confirmation field) and goes to the login page', () => {
    const nav = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    component.form.setValue(valid);
    component.submit();
    const req = http.expectOne('/api/auth/register');
    expect(req.request.body).toEqual({
      firstName: 'Ada', lastName: 'Lovelace', email: 'ada@x.com', password: 'password123', dateOfBirth: null,
    });
    req.flush(null, { status: 201, statusText: 'Created' });
    expect(nav).toHaveBeenCalledWith(['/login']);
  });

  it('shows a duplicate email (409) on the email field', () => {
    component.form.setValue(valid);
    component.submit();
    http.expectOne('/api/auth/register').flush({ status: 409, message: 'An account with email already exists' }, { status: 409, statusText: 'Conflict' });
    expect(component.form.controls.email.errors?.['server']).toContain('already exists');
  });
});
