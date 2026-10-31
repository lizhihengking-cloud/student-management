import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Student, StudentInput } from './models';

/**
 * Student state store + API client. `students$` is the single source of truth for lists;
 * every mutation updates it so subscribed components refresh without refetching.
 */
@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/students';
  private readonly _students$ = new BehaviorSubject<Student[]>([]);
  readonly students$ = this._students$.asObservable();

  load(): Observable<Student[]> {
    return this.http.get<Student[]>(this.url).pipe(tap(list => this._students$.next(list)));
  }

  get(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.url}/${id}`);
  }

  /** The signed-in user's own student record. */
  me(): Observable<Student> {
    return this.http.get<Student>(`${this.url}/me`);
  }

  create(input: StudentInput): Observable<Student> {
    return this.http.post<Student>(this.url, input).pipe(tap(s => this.upsert(s)));
  }

  update(id: number, input: StudentInput): Observable<Student> {
    return this.http.put<Student>(`${this.url}/${id}`, input).pipe(tap(s => this.upsert(s)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(
      tap(() => this._students$.next(this._students$.value.filter(s => s.id !== id)))
    );
  }

  setCourses(id: number, courseIds: number[]): Observable<Student> {
    return this.http.put<Student>(`${this.url}/${id}/courses`, courseIds).pipe(tap(s => this.upsert(s)));
  }

  enroll(id: number, courseId: number): Observable<Student> {
    return this.http.put<Student>(`${this.url}/${id}/courses/${courseId}`, null).pipe(tap(s => this.upsert(s)));
  }

  unenroll(id: number, courseId: number): Observable<Student> {
    return this.http.delete<Student>(`${this.url}/${id}/courses/${courseId}`).pipe(tap(s => this.upsert(s)));
  }

  /** Forget cached data (on logout) so the next user never sees the previous user's students. */
  clear() {
    this._students$.next([]);
  }

  /** Called by CourseService when a course is deleted so enrollments vanish from cached students. */
  dropCourse(courseId: number) {
    this._students$.next(
      this._students$.value.map(s => ({ ...s, courses: s.courses.filter(c => c.id !== courseId) }))
    );
  }

  /** Called by CourseService when a course is edited so cached enrollments show the new details. */
  refreshCourse(course: { id: number }) {
    this._students$.next(
      this._students$.value.map(s => ({
        ...s,
        courses: s.courses.map(c => (c.id === course.id ? { ...c, ...course } : c)),
      }))
    );
  }

  private upsert(s: Student) {
    const list = this._students$.value;
    const exists = list.some(x => x.id === s.id);
    this._students$.next(exists ? list.map(x => (x.id === s.id ? s : x)) : [...list, s]);
  }
}
