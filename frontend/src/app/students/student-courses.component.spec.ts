import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { StudentCoursesComponent } from './student-courses.component';

describe('StudentCoursesComponent', () => {
  let fixture: ComponentFixture<StudentCoursesComponent>;
  let component: StudentCoursesComponent;
  let http: HttpTestingController;

  const c1 = { id: 1, code: 'CS101', title: 'Intro', credits: 3 };
  const c2 = { id: 2, code: 'CS102', title: 'Algorithms', credits: 4 };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StudentCoursesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(StudentCoursesComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('student', { id: 9, firstName: 'A', lastName: 'B', email: 'a@x.com', courses: [c1] });
    fixture.componentRef.setInput('allCourses', [c1, c2]);
    fixture.detectChanges();
  });

  it('should create with the enrolled course pre-selected', () => {
    expect(component).toBeTruthy();
    expect(component.dirty).toBeFalse();
    expect(fixture.nativeElement.querySelectorAll('input[type=checkbox]').length).toBe(2);
  });

  it('saves a multi-course selection in one request', () => {
    component.toggle(2);
    expect(component.dirty).toBeTrue();
    component.save();
    const req = http.expectOne('/api/students/9/courses');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual([1, 2]);
  });

  it('lets an admin grade only a saved enrolment', () => {
    (component.auth as any)._user$.next({ username: 'admin', role: 'ADMIN', studentId: null });
    expect(component.canGrade(1)).toBeTrue();
    expect(component.canGrade(2)).toBeFalse();

    component.setGrade(1, 'B');
    const req = http.expectOne('/api/students/9/courses/1/grade');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ grade: 'B' });
    req.flush({ id: 9, firstName: 'A', lastName: 'B', email: 'a@x.com', courses: [{ ...c1, grade: 'B' }] });
    expect(component.gradingId).toBeNull();
  });

  it('renders a grade dropdown for admins and a read-only pill for students', () => {
    const auth = component.auth as any;
    auth._user$.next({ username: 'admin', role: 'ADMIN', studentId: null });
    fixture.detectChanges();
    const selects = fixture.nativeElement.querySelectorAll('select');
    expect(selects.length).toBe(1); // only the enrolled course (c1) can be graded
    expect(selects[0].options.length).toBe(5); // none + A-D

    selects[0].value = 'C';
    selects[0].dispatchEvent(new Event('change'));
    http.expectOne('/api/students/9/courses/1/grade').flush(
      { id: 9, firstName: 'A', lastName: 'B', email: 'a@x.com', courses: [{ ...c1, grade: 'C' }] });

    auth._user$.next({ username: 'a@x.com', role: 'USER', studentId: 9 });
    fixture.componentRef.setInput('student', { id: 9, firstName: 'A', lastName: 'B', email: 'a@x.com', courses: [{ ...c1, grade: 'C' }] });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
    expect(fixture.nativeElement.querySelector('.grade-C').textContent.trim()).toBe('C');
  });

  it('does not offer grading to students', () => {
    (component.auth as any)._user$.next({ username: 'a@x.com', role: 'USER', studentId: 9 });
    expect(component.canGrade(1)).toBeFalse();
  });
});
