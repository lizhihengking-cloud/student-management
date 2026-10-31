import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { combineLatest, filter, map, startWith, switchMap } from 'rxjs';
import { ConfirmService } from '../core/confirm.service';
import { Student } from '../core/models';
import { NotificationService } from '../core/notification.service';
import { StudentService } from '../core/student.service';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [AsyncPipe, RouterLink, ReactiveFormsModule],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.css',
})
export class StudentListComponent implements OnInit {
  private readonly store = inject(StudentService);
  private readonly confirm = inject(ConfirmService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly search = new FormControl('', { nonNullable: true });
  loading = true;
  loadFailed = false;

  // state from the store combined with the search box
  readonly vm$ = combineLatest([this.store.students$, this.search.valueChanges.pipe(startWith(''))]).pipe(
    map(([students, q]) => {
      const term = q.trim().toLowerCase();
      return term
        ? students.filter(s => `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(term))
        : students;
    })
  );

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading = true;
    this.loadFailed = false;
    this.store.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => (this.loading = false),
      error: () => {
        this.loading = false;
        this.loadFailed = true;
      },
    });
  }

  remove(s: Student) {
    this.confirm
      .confirm({
        title: 'Delete student',
        message: `Delete ${s.firstName} ${s.lastName}? This also removes their ${s.courses.length} enrollment(s) and cannot be undone.`,
        confirmText: 'Delete',
        danger: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.store.delete(s.id))
      )
      .subscribe({
        next: () => this.notify.success(`Deleted ${s.firstName} ${s.lastName}`),
        error: () => {}, // already reported by the interceptor
      });
  }
}
