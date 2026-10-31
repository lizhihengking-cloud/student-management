import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CourseFormComponent } from './course-form.component';

describe('CourseFormComponent', () => {
  let fixture: ComponentFixture<CourseFormComponent>;
  let component: CourseFormComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CourseFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(CourseFormComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not submit an invalid form', () => {
    component.save();
    http.expectNone('/api/courses');
    expect(component.form.controls.code.touched).toBeTrue();
  });

  it('reports unsaved changes only once the form is dirty', () => {
    expect(component.hasUnsavedChanges()).toBeFalse();
    component.form.controls.title.markAsDirty();
    expect(component.hasUnsavedChanges()).toBeTrue();
  });
});
