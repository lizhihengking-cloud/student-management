import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { ConfirmService } from '../core/confirm.service';
import { CourseService } from '../core/course.service';
import { Course } from '../core/models';
import { NotificationService } from '../core/notification.service';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: './course-list.component.html',
  styleUrl: './course-list.component.css',
})
export class CourseListComponent implements OnInit {
  readonly courses = inject(CourseService);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  loadFailed = false;

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading = true;
    this.loadFailed = false;
    this.courses.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => (this.loading = false),
      error: () => {
        this.loading = false;
        this.loadFailed = true;
      },
    });
  }

  remove(c: Course) {
    this.courses
      .enrolledCount(c.id)
      .pipe(
        switchMap(n =>
          this.confirm.confirm({
            title: 'Delete course',
            message:
              n > 0
                ? `${c.code} has ${n} enrolled student(s). Deleting it will unenroll them. Continue?`
                : `Delete course ${c.code} — ${c.title}?`,
            confirmText: 'Delete',
            danger: true,
          })
        ),
        filter(Boolean),
        switchMap(() => this.courses.delete(c.id))
      )
      .subscribe({
        next: () => this.notify.success(`Deleted ${c.code}`),
        error: () => {}, // already reported by the interceptor
      });
  }
}
