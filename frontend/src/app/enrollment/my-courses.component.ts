import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, forkJoin, switchMap } from 'rxjs';
import { ConfirmService } from '../core/confirm.service';
import { CourseService } from '../core/course.service';
import { Course, Student } from '../core/models';
import { NotificationService } from '../core/notification.service';
import { StudentService } from '../core/student.service';

/**
 * Course enrolment for the signed-in student. One student can enrol in any number of courses:
 * every course in the catalogue has an Enrol / Drop button, and the summary shows what is selected.
 */
@Component({
  selector: 'app-my-courses',
  standalone: true,
  templateUrl: './my-courses.component.html',
  styleUrl: './my-courses.component.css',
})
export class MyCoursesComponent implements OnInit {
  private readonly students = inject(StudentService);
  private readonly courseStore = inject(CourseService);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  student: Student | null = null;
  catalogue: Course[] = [];
  loading = true;
  loadFailed = false;
  /** course ids with a request in flight (disables their button) */
  readonly busy = new Set<number>();

  get enrolledIds(): Set<number> {
    return new Set((this.student?.courses ?? []).map(c => c.id));
  }

  get totalCredits(): number {
    return (this.student?.courses ?? []).reduce((sum, c) => sum + c.credits, 0);
  }

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading = true;
    this.loadFailed = false;
    forkJoin({ student: this.students.me(), courses: this.courseStore.load() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ student, courses }) => {
          this.student = student;
          this.catalogue = courses;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.loadFailed = true;
        },
      });
  }

  isEnrolled(c: Course): boolean {
    return this.enrolledIds.has(c.id);
  }

  enrol(c: Course) {
    if (!this.student) return;
    this.busy.add(c.id);
    this.students.enroll(this.student.id, c.id).subscribe({
      next: s => {
        this.student = s;
        this.busy.delete(c.id);
        this.notify.success(`Enrolled in ${c.code}`);
      },
      error: () => this.busy.delete(c.id), // already reported by the interceptor
    });
  }

  drop(c: Course) {
    const student = this.student;
    if (!student) return;
    this.confirm
      .confirm({
        title: 'Drop course',
        message: `Drop ${c.code} — ${c.title}?`,
        confirmText: 'Drop',
        danger: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.busy.add(c.id);
          return this.students.unenroll(student.id, c.id);
        })
      )
      .subscribe({
        next: s => {
          this.student = s;
          this.busy.delete(c.id);
          this.notify.success(`Dropped ${c.code}`);
        },
        error: () => this.busy.delete(c.id),
      });
  }
}
