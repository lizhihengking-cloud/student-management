import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { Course, Grade, GRADES, Student, ApiError } from '../core/models';
import { NotificationService } from '../core/notification.service';
import { StudentService } from '../core/student.service';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

/** "Courses" tab: choose which courses the student is enrolled in, then save in one request. */
@Component({
  selector: 'app-student-courses',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './student-courses.component.html',
  styleUrl: './student-courses.component.css',
})
export class StudentCoursesComponent implements OnChanges {
  private readonly store = inject(StudentService);
  private readonly notify = inject(NotificationService);
  readonly auth = inject(AuthService);
  readonly grades = GRADES;

  @Input({ required: true }) student!: Student;
  @Input() allCourses: Course[] = [];
  @Output() saved = new EventEmitter<Student>();
  @Output() dirtyChange = new EventEmitter<boolean>();

  selected = new Set<number>();
  saving = false;
  gradingId: number | null = null;

  get dirty(): boolean {
    const saved = this.student.courses.map(c => c.id);
    return saved.length !== this.selected.size || saved.some(id => !this.selected.has(id));
  }

  ngOnChanges(changes: SimpleChanges) {
    // re-sync only when the saved student changes (initial load / after save), not when the course list reloads
    if (changes['student']) this.sync();
  }

  /** Grade currently saved for a course ('' = not graded or not enrolled yet). */
  gradeOf(courseId: number): Grade | '' {
    return this.student.courses.find(c => c.id === courseId)?.grade ?? '';
  }

  /** Grading applies to saved enrolments only; a course ticked but not yet saved cannot be graded. */
  canGrade(courseId: number): boolean {
    return this.auth.isAdmin && this.student.courses.some(c => c.id === courseId);
  }

  setGrade(courseId: number, value: string) {
    this.gradingId = courseId;
    this.store.setGrade(this.student.id, courseId, (value || null) as Grade | null).subscribe({
      next: s => {
        this.gradingId = null;
        this.notify.success(value ? `Grade set to ${value}` : 'Grade cleared');
        this.saved.emit(s);
      },
      error: (_: ApiError) => (this.gradingId = null),
    });
  }

  private sync() {
    this.selected = new Set(this.student.courses.map(c => c.id));
  }

  toggle(id: number) {
    this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id);
    this.dirtyChange.emit(this.dirty);
  }

  reset() {
    this.sync();
    this.dirtyChange.emit(false);
  }

  save() {
    this.saving = true;
    this.store.setCourses(this.student.id, [...this.selected]).subscribe({
      next: s => {
        this.saving = false;
        this.notify.success('Enrollment updated');
        this.saved.emit(s);
        this.dirtyChange.emit(false);
      },
      error: (_: ApiError) => (this.saving = false),
    });
  }
}
