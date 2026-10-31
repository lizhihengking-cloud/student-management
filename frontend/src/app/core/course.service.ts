import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Course, CourseInput } from './models';
import { StudentService } from './student.service';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly http = inject(HttpClient);
  private readonly students = inject(StudentService);
  private readonly url = '/api/courses';
  private readonly _courses$ = new BehaviorSubject<Course[]>([]);
  readonly courses$ = this._courses$.asObservable();

  load(): Observable<Course[]> {
    return this.http.get<Course[]>(this.url).pipe(tap(list => this._courses$.next(list)));
  }

  clear() {
    this._courses$.next([]);
  }

  get(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.url}/${id}`);
  }

  enrolledCount(id: number): Observable<number> {
    return this.http.get<number>(`${this.url}/${id}/enrolled-count`);
  }

  create(input: CourseInput): Observable<Course> {
    return this.http.post<Course>(this.url, input).pipe(tap(c => this.upsert(c)));
  }

  update(id: number, input: CourseInput): Observable<Course> {
    return this.http.put<Course>(`${this.url}/${id}`, input).pipe(
      tap(c => {
        this.upsert(c);
        this.students.refreshCourse(c);
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(
      tap(() => {
        this._courses$.next(this._courses$.value.filter(c => c.id !== id));
        this.students.dropCourse(id); // cross-store communication
      })
    );
  }

  private upsert(c: Course) {
    const list = this._courses$.value;
    const next = list.some(x => x.id === c.id) ? list.map(x => (x.id === c.id ? c : x)) : [...list, c];
    this._courses$.next([...next].sort((a, b) => a.code.localeCompare(b.code)));
  }
}
