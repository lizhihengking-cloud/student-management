import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap, of, filter } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ConfirmService } from '../core/confirm.service';
import { CourseService } from '../core/course.service';
import { Student } from '../core/models';
import { HasUnsavedChanges } from '../core/unsaved-changes.guard';
import { StudentService } from '../core/student.service';
import { StudentCoursesComponent } from './student-courses.component';
import { StudentProfileFormComponent } from './student-profile-form.component';

type Tab = 'profile' | 'courses';

/**
 * Parent container for the two tabs. Children report "dirty" state upward through @Output;
 * switching tabs or leaving the page with unsaved edits opens a confirmation modal.
 */
@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [AsyncPipe, RouterLink, StudentProfileFormComponent, StudentCoursesComponent],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.css',
})
export class StudentDetailComponent implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly students = inject(StudentService);
  private readonly confirm = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);
  readonly courses = inject(CourseService);
  readonly auth = inject(AuthService);

  student: Student | null = null;
  tab: Tab = 'profile';
  loading = false;
  dirty = { profile: false, courses: false };

  ngOnInit() {
    this.courses.load().pipe(catchError(() => of([])), takeUntilDestroyed(this.destroyRef)).subscribe();

    this.route.paramMap
      .pipe(
        switchMap(params => {
          const id = Number(params.get('id'));
          if (!params.has('id')) return of(null); // /students/new
          this.loading = true;
          return this.students.get(id).pipe(
            catchError(() => {
              this.router.navigate(['/students']); // e.g. 404, already toasted
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(s => {
        this.student = s;
        this.loading = false;
      });
  }

  hasUnsavedChanges() {
    return this.dirty.profile || this.dirty.courses;
  }

  selectTab(next: Tab) {
    if (next === this.tab || (next === 'courses' && !this.student)) return;
    if (!this.dirty[this.tab]) {
      this.tab = next;
      return;
    }
    this.confirm
      .confirm({
        title: 'Unsaved changes',
        message: `You have unsaved changes on the ${this.tab} tab. Switching tabs will discard them.`,
        confirmText: 'Discard and switch',
        cancelText: 'Stay here',
        danger: true,
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.dirty[this.tab] = false; // child is destroyed on switch, discarding its edits
        this.tab = next;
      });
  }

  onProfileSaved(s: Student) {
    this.dirty.profile = false;
    if (!this.student) {
      this.router.navigate(['/students', s.id]); // newly created -> open its detail page
    } else {
      this.student = s;
      if (!this.auth.isAdmin) this.auth.restore().subscribe(); // email = login name, so refresh the displayed account
    }
  }

  onCoursesSaved(s: Student) {
    this.dirty.courses = false;
    this.student = s;
  }
}
