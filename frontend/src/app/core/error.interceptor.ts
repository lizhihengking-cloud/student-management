import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiError } from './models';
import { NotificationService } from './notification.service';

function normalise(e: HttpErrorResponse): ApiError {
  if (e.status === 0) {
    return { status: 0, message: 'Cannot reach the server. Please check that the backend is running.' };
  }
  const body = e.error;
  if (body && typeof body === 'object' && 'message' in body) {
    return { status: e.status, message: body.message, fieldErrors: body.fieldErrors ?? undefined };
  }
  return { status: e.status, message: `Request failed (${e.status})` };
}

/** Auth endpoints whose 401 is an expected answer ("not signed in" / "bad password"), not an incident. */
const isAuthProbe = (url: string) => url.endsWith('/api/auth/me') || url.endsWith('/api/auth/login');

/**
 * Central HTTP error handling: converts every failure into an ApiError and shows a toast,
 * except for field-level validation errors which the forms display next to the inputs.
 * A 401 on any other request means the session ended: send the user back to the login page.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((e: HttpErrorResponse) => {
      const apiError = normalise(e);
      if (apiError.status === 401 && !isAuthProbe(req.url)) {
        auth.sessionExpired();
      } else if (!apiError.fieldErrors && !(apiError.status === 401 && isAuthProbe(req.url))) {
        notify.error(apiError.message);
      }
      return throwError(() => apiError);
    })
  );
};
