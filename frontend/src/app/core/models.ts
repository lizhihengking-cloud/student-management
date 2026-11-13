export type Grade = 'A' | 'B' | 'C' | 'D';
export const GRADES: Grade[] = ['A', 'B', 'C', 'D'];

export interface Course {
  id: number;
  code: string;
  title: string;
  description?: string | null;
  credits: number;
  /** Set by an admin; only present on a student's enrolled courses once graded. */
  grade?: Grade | null;
}
export type CourseInput = Omit<Course, 'id' | 'grade'>;

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string | null;
  courses: Course[];
}
export type StudentInput = Omit<Student, 'id' | 'courses'>;

/** Normalised error shape produced by the error interceptor. */
export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
}

export type Role = 'ADMIN' | 'USER';

/** The signed-in user as returned by /api/auth/me. `studentId` is null for the admin. */
export interface AuthUser {
  username: string;
  role: Role;
  studentId: number | null;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string | null;
}
