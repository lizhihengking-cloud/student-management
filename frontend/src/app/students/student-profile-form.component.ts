import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { applyServerErrors, errorText, pastDateValidator } from '../core/form-utils';
import { ApiError, Student } from '../core/models';
import { NotificationService } from '../core/notification.service';
import { StudentService } from '../core/student.service';

/** "Profile" tab. Child of StudentDetailComponent: gets the student via @Input, reports via @Output. */
@Component({
  selector: 'app-student-profile-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './student-profile-form.component.html',
  styleUrl: './student-profile-form.component.css',
})
export class StudentProfileFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(StudentService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() student: Student | null = null;
  @Output() saved = new EventEmitter<Student>();
  @Output() dirtyChange = new EventEmitter<boolean>();

  saving = false;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    dateOfBirth: ['', [pastDateValidator]],
  });

  ngOnInit() {
    this.reset();
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.dirtyChange.emit(this.form.dirty));
  }

  err(name: string, label: string) {
    return errorText(this.form.get(name), label);
  }

  reset() {
    this.form.reset({
      firstName: this.student?.firstName ?? '',
      lastName: this.student?.lastName ?? '',
      email: this.student?.email ?? '',
      dateOfBirth: this.student?.dateOfBirth ?? '',
    });
    this.dirtyChange.emit(false);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const input = { ...v, dateOfBirth: v.dateOfBirth || null };
    this.saving = true;
    const request$ = this.student ? this.store.update(this.student.id, input) : this.store.create(input);
    request$.subscribe({
      next: s => {
        this.saving = false;
        this.form.markAsPristine();
        this.dirtyChange.emit(false);
        this.notify.success(this.student ? 'Student updated' : 'Student created');
        this.saved.emit(s);
      },
      error: (e: ApiError) => {
        this.saving = false;
        applyServerErrors(this.form, e); // field errors shown inline; others toasted by interceptor
      },
    });
  }
}
