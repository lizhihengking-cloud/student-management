import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { StudentDetailComponent } from './student-detail.component';

describe('StudentDetailComponent', () => {
  let fixture: ComponentFixture<StudentDetailComponent>;
  let component: StudentDetailComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StudentDetailComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(StudentDetailComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should create in "new student" mode (no id in the route)', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('New student');
    http.match('/api/courses').forEach(r => r.flush([]));
  });

  it('has no unsaved changes initially and tracks dirty tabs', () => {
    expect(component.hasUnsavedChanges()).toBeFalse();
    component.dirty.profile = true;
    expect(component.hasUnsavedChanges()).toBeTrue();
  });

  it('links back to the student list for admins only', () => {
    // not signed in => not admin => the back link goes to the student's own page
    expect(fixture.nativeElement.querySelector('.page-header a').getAttribute('href')).toBe('/my-courses');
  });
});
