import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { applyServerErrors, errorText, passwordsMatchValidator, pastDateValidator } from '../core/form-utils';
import { ApiError } from '../core/models';
import { NotificationService } from '../core/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  submitting = false;

  readonly form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      dateOfBirth: ['', [pastDateValidator]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator }
  );

  err(name: string, label: string) {
    return errorText(this.form.get(name), label);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { confirmPassword: _, dateOfBirth, ...rest } = this.form.getRawValue();
    this.submitting = true;
    this.auth.register({ ...rest, dateOfBirth: dateOfBirth || null }).subscribe({
      next: () => {
        this.notify.success('Account created. You can sign in now.');
        this.router.navigate(['/login']);
      },
      error: (e: ApiError) => {
        this.submitting = false;
        // field errors from validation; a 409 means the email is already registered
        if (!applyServerErrors(this.form, e) && e.status === 409) {
          this.form.controls.email.setErrors({ server: e.message });
          this.form.controls.email.markAsTouched();
        }
      },
    });
  }
}
