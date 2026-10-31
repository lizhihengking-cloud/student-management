import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError, Course } from '../core/models';
import { CourseService } from '../core/course.service';
import { applyServerErrors, errorText } from '../core/form-utils';
import { NotificationService } from '../core/notification.service';
import { HasUnsavedChanges } from '../core/unsaved-changes.guard';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './course-form.component.html',
  styleUrl: './course-form.component.css',
})
export class CourseFormComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly courses = inject(CourseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  id: number | null = null;
  saving = false;

  readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(20)]],
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    credits: [3 as number | null, [Validators.required, Validators.min(1), Validators.max(10)]],
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = Number(idParam);
      this.courses.get(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (c: Course) => this.form.reset({ code: c.code, title: c.title, description: c.description ?? '', credits: c.credits }),
        error: () => this.router.navigate(['/courses']),
      });
    }
  }

  err(name: string, label: string) {
    return errorText(this.form.get(name), label);
  }

  hasUnsavedChanges() {
    return this.form.dirty;
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const input = { code: v.code!, title: v.title!, description: v.description || null, credits: Number(v.credits) };
    this.saving = true;
    const request$ = this.id ? this.courses.update(this.id, input) : this.courses.create(input);
    request$.subscribe({
      next: () => {
        this.form.markAsPristine(); // so the unsaved-changes guard lets us leave
        this.notify.success(this.id ? 'Course updated' : 'Course created');
        this.router.navigate(['/courses']);
      },
      error: (e: ApiError) => {
        this.saving = false;
        if (!applyServerErrors(this.form, e) && e.status === 409) {
          this.form.get('code')?.setErrors({ server: e.message });
          this.form.get('code')?.markAsTouched();
        }
      },
    });
  }
}
