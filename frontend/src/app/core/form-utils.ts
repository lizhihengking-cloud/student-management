import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';
import { ApiError } from './models';

/** Copies backend field errors (400 validation response) onto the matching form controls. */
export function applyServerErrors(form: FormGroup, err: ApiError): boolean {
  if (!err.fieldErrors) return false;
  let applied = false;
  for (const [field, message] of Object.entries(err.fieldErrors)) {
    const control = form.get(field);
    if (control) {
      control.setErrors({ server: message });
      control.markAsTouched();
      applied = true;
    }
  }
  return applied;
}

/** Returns the first human-readable error for a control, or null. */
export function errorText(control: AbstractControl | null, label: string): string | null {
  if (!control || !control.touched || !control.errors) return null;
  const e = control.errors;
  if (e['server']) return e['server'];
  if (e['required']) return `${label} is required`;
  if (e['email']) return 'Enter a valid email address';
  if (e['minlength']) return `${label} must be at least ${e['minlength'].requiredLength} characters`;
  if (e['maxlength']) return `${label} must be at most ${e['maxlength'].requiredLength} characters`;
  if (e['min']) return `${label} must be at least ${e['min'].min}`;
  if (e['max']) return `${label} must be at most ${e['max'].max}`;
  if (e['mismatch']) return `${label} do not match`;
  if (e['pastDate']) return `${label} must be in the past`;
  return 'Invalid value';
}

export function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string;
  if (!v) return null;
  return new Date(v) < new Date() ? null : { pastDate: true };
}

/** Group validator: marks `confirm` as mismatched when it differs from `password`. */
export function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password');
  const confirm = group.get('confirmPassword');
  if (!password || !confirm) return null;
  const mismatch = !!confirm.value && password.value !== confirm.value;
  if (mismatch) confirm.setErrors({ ...confirm.errors, mismatch: true });
  else if (confirm.errors?.['mismatch']) {
    const { mismatch: _, ...rest } = confirm.errors;
    confirm.setErrors(Object.keys(rest).length ? rest : null);
  }
  return null;
}
