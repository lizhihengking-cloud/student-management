import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, of, switchMap, tap } from 'rxjs';
import { AuthUser, LoginInput, RegisterInput } from './models';
import { CourseService } from './course.service';
import { NotificationService } from './notification.service';
import { StudentService } from './student.service';

/**
 * Authentication state + API client. The session lives in an HttpOnly cookie managed by the server;
 * the SPA only keeps the current user (`user$`) so guards, the navbar and components can react to it.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly students = inject(StudentService);
  private readonly courses = inject(CourseService);
  private readonly notify = inject(NotificationService);
  private readonly url = '/api/auth';

  private readonly _user$ = new BehaviorSubject<AuthUser | null>(null);
  readonly user$ = this._user$.asObservable();

  get user(): AuthUser | null { return this._user$.value; }
  get isLoggedIn(): boolean { return this.user !== null; }
  get isAdmin(): boolean { return this.user?.role === 'ADMIN'; }

  /** Where a signed-in user lands: admins manage students, users manage their own enrolment. */
  get homeUrl(): string { return this.isAdmin ? '/students' : '/my-courses'; }

  /**
   * Asks the server who we are (also makes the server set the XSRF-TOKEN cookie). Runs before the
   * first navigation so guards see the restored session after a page refresh. Never errors.
   */
  restore(): Observable<AuthUser | null> {
    return this.http.get<AuthUser>(`${this.url}/me`).pipe(
      catchError(() => of(null)),
      tap(u => this._user$.next(u))
    );
  }

  login(input: LoginInput): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.url}/login`, input).pipe(tap(u => this._user$.next(u)));
  }

  register(input: RegisterInput): Observable<void> {
    return this.http.post<void>(`${this.url}/register`, input);
  }

  logout() {
    this.http
      .post<void>(`${this.url}/logout`, null)
      .pipe(
        catchError(() => of(undefined)),
        tap(() => this.clearSession()),
        switchMap(() => this.restore()) // the server drops the XSRF cookie on logout; fetch a fresh one for the next login
      )
      .subscribe(() => this.router.navigate(['/login']));
  }

  /** Called by the HTTP interceptor when a request comes back 401 while we thought we were signed in. */
  sessionExpired() {
    if (!this.isLoggedIn) return;
    const returnUrl = this.router.url;
    this.clearSession();
    this.notify.info('Your session has expired. Please sign in again.');
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }

  private clearSession() {
    this._user$.next(null);
    this.students.clear();
    this.courses.clear();
  }
}
