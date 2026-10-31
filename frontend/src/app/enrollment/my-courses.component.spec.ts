import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MyCoursesComponent } from './my-courses.component';

describe('MyCoursesComponent', () => {
  let fixture: ComponentFixture<MyCoursesComponent>;
  let component: MyCoursesComponent;
  let http: HttpTestingController;

  const c1 = { id: 1, code: 'CS101', title: 'Intro', credits: 3 };
  const c2 = { id: 2, code: 'CS102', title: 'Data structures', credits: 4 };
  const student = (courses: unknown[]) => ({ id: 7, firstName: 'Ada', lastName: 'L', email: 'a@x.com', courses });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MyCoursesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(MyCoursesComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges(); // ngOnInit -> loads my student + catalogue
    http.expectOne('/api/students/me').flush(student([c1]));
    http.expectOne('/api/courses').flush([c1, c2]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists the whole catalogue and marks the enrolled course', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Enrolled');
    expect(rows[1].textContent).toContain('Enrol');
    expect(component.totalCredits).toBe(3);
  });

  it('can enrol in a second course (many courses per student)', () => {
    component.enrol(c2);
    const req = http.expectOne('/api/students/7/courses/2');
    expect(req.request.method).toBe('PUT');
    req.flush(student([c1, c2]));
    expect(component.student!.courses.length).toBe(2);
    expect(component.totalCredits).toBe(7);
  });
});
