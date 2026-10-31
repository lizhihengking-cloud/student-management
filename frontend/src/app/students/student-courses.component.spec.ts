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
});
