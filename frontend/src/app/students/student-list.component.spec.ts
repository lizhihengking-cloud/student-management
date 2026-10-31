import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { StudentListComponent } from './student-list.component';

describe('StudentListComponent', () => {
  let fixture: ComponentFixture<StudentListComponent>;
  let http: HttpTestingController;

  const students = [
    { id: 1, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@x.com', courses: [{ id: 1, code: 'CS101', title: 'Intro', credits: 3 }] },
    { id: 2, firstName: 'Alan', lastName: 'Turing', email: 'alan@x.com', courses: [] },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StudentListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(StudentListComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows every student with their enrolments (admin view) and filters by search', () => {
    http.expectOne('/api/students').flush(students);
    fixture.detectChanges();
    const rows = () => fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('CS101');

    fixture.componentInstance.search.setValue('turing');
    fixture.detectChanges();
    expect(rows().length).toBe(1);
  });
});
