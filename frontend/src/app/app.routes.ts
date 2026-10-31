import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard, homeGuard, selfOrAdminGuard } from './core/auth.guard';
import { unsavedChangesGuard } from './core/unsaved-changes.guard';

export const routes: Routes = [
  // `/` has no page of its own: the guard redirects to the login page or the user's home.
  { path: '', pathMatch: 'full', canActivate: [homeGuard], children: [] },

  // --- public (signed-out only) ---
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent),
    title: 'Sign in',
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/register.component').then(m => m.RegisterComponent),
    title: 'Create account',
  },

  // --- any signed-in user ---
  {
    path: 'my-courses',
    canActivate: [authGuard],
    loadComponent: () => import('./enrollment/my-courses.component').then(m => m.MyCoursesComponent),
    title: 'My courses',
  },
  // --- admin only ---
  {
    path: 'students',
    canActivate: [adminGuard],
    loadComponent: () => import('./students/student-list.component').then(m => m.StudentListComponent),
    title: 'Students',
  },
  {
    path: 'students/new',
    canActivate: [adminGuard],
    loadComponent: () => import('./students/student-detail.component').then(m => m.StudentDetailComponent),
    canDeactivate: [unsavedChangesGuard],
    title: 'New student',
  },
  {
    // NOT admin-only: admin may open any student, a user only their own record (also enforced by the API)
    path: 'students/:id',
    canActivate: [selfOrAdminGuard],
    loadComponent: () => import('./students/student-detail.component').then(m => m.StudentDetailComponent),
    canDeactivate: [unsavedChangesGuard],
    title: 'Student',
  },

  {
    path: 'courses',
    canActivate: [adminGuard],
    loadComponent: () => import('./courses/course-list.component').then(m => m.CourseListComponent),
    title: 'Courses',
  },
  {
    path: 'courses/new',
    canActivate: [adminGuard],
    loadComponent: () => import('./courses/course-form.component').then(m => m.CourseFormComponent),
    canDeactivate: [unsavedChangesGuard],
    title: 'New course',
  },
  {
    path: 'courses/:id/edit',
    canActivate: [adminGuard],
    loadComponent: () => import('./courses/course-form.component').then(m => m.CourseFormComponent),
    canDeactivate: [unsavedChangesGuard],
    title: 'Edit course',
  },
  {
    path: '**',
    loadComponent: () => import('./shared/not-found.component').then(m => m.NotFoundComponent),
    title: 'Not found',
  },
];
