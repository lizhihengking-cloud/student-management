import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { Course, Student, ApiError } from '../core/models';
import { NotificationService } from '../core/notification.service';
import { StudentService } from '../core/student.service';
import { RouterLink } from '@angular/router';

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

  @Input({ required: true }) student!: Student;
  @Input() allCourses: Course[] = [];
  @Output() saved = new EventEmitter<Student>();
  @Output() dirtyChange = new EventEmitter<boolean>();

  selected = new Set<number>();
  saving = false;

  get dirty(): boolean {
    const saved = this.student.courses.map(c => c.id);
    return saved.length !== this.selected.size || saved.some(id => !this.selected.has(id));
  }

  ngOnChanges(changes: SimpleChanges) {
    // re-sync only when the saved student changes (initial load / after save), not when the course list reloads
    if (changes['student']) this.sync();
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
