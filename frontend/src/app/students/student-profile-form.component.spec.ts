import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { StudentProfileFormComponent } from './student-profile-form.component';

describe('StudentProfileFormComponent', () => {
  let fixture: ComponentFixture<StudentProfileFormComponent>;
  let component: StudentProfileFormComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StudentProfileFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(StudentProfileFormComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('student', { id: 5, firstName: 'Ada', lastName: 'L', email: 'ada@x.com', courses: [] });
    fixture.detectChanges();
  });

  it('should create and fill the form from the student', () => {
    expect(component).toBeTruthy();
    expect(component.form.getRawValue().email).toBe('ada@x.com');
  });

  it('updates the existing student on save', () => {
    component.form.controls.firstName.setValue('Augusta');
    component.save();
    const req = http.expectOne('/api/students/5');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.firstName).toBe('Augusta');
  });

  it('does not save an invalid form', () => {
    component.form.controls.email.setValue('not-an-email');
    component.save();
    http.expectNone('/api/students/5');
    expect(component.form.controls.email.touched).toBeTrue();
  });
});
