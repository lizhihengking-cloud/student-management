# Student Management

A small full-stack app for managing students and the courses they enrol in.
Students register themselves, sign in, and pick as many courses as they like; an administrator sees and manages everyone.

- **Backend:** Spring Boot 2.7 (Java 11), Spring Security, Spring Data JPA, H2 file database
- **Frontend:** Angular 18 (standalone components, lazy-loaded routes, reactive forms)

## Features

- Registration, login and logout
- Two roles, **ADMIN** and **USER**
- Course enrolment: one student can enrol in many courses
- Students and courses CRUD for admins, search, unsaved-changes and delete confirmations, toast notifications
- URLs protected by Spring Security; routes protected by Angular guards

| | ADMIN | USER (student) |
|---|---|---|
| How the account is created | Seeded at startup | Self-registration at `/register` (always USER) |
| Students | List, create, edit, delete **everyone**; sees **all** enrolments | Can read and edit **only their own** record |
| Courses | Full CRUD | Read-only catalogue |
| Enrolment | Can edit anyone's | Can enrol in / drop any number of courses, **only for themselves** (`/my-courses`) |

The login name is the student's email (kept in sync when the email is edited). Deleting a student also deletes their account.

## Prerequisites

- JDK 11+
- Maven 3.8+
- Node.js 18+ and npm

## Getting started

Run the backend and the frontend in two terminals.

```bash
# 1. Backend: http://localhost:8080  (H2 file database in backend/data, created on first run)
cd backend
mvn spring-boot:run

# 2. Frontend: http://localhost:4200  (proxies /api to :8080)
cd frontend
npm install
npm start
```

Open <http://localhost:4200>.

**Default admin account:** `admin` / `admin123`
(configured by `app.admin.username` and `app.admin.password` in `backend/src/main/resources/application.properties`; **change the password for anything other than local development**).

To try the student flow, click **Register**, create an account, sign in, then use **My courses** to enrol. Sign in as admin in another browser to see that student's enrolments under **Students**. Create courses first as admin (**Courses → New course**), otherwise the catalogue is empty.

## Tests

```bash
# Backend: unit tests (Mockito) + integration tests (real login/CSRF flow via TestRestTemplate)
cd backend
mvn verify          # also enforces 100% line and branch coverage with JaCoCo
                    # HTML report: backend/target/site/jacoco/index.html

# Frontend: Karma + Jasmine, headless
cd frontend
npx ng test --watch=false --browsers=ChromeHeadless
```

## Project layout

```
backend/src/main/java/com/example/sms
  config/        CORS, RestTemplate bean
  controller/    REST controllers (Auth, Student, Course)
  service/       business rules (enrolment, account sync, validation of duplicates)
  repository/    Spring Data JPA repositories
  model/         JPA entities (Student, Course, User, Role)
  dto/           request/response objects with Bean Validation
  security/      SecurityConfig, user details, CSRF cookie filter, admin seeding, @access checks
  exception/     one @RestControllerAdvice producing a uniform JSON error

frontend/src/app
  core/          services (auth, students, courses, notifications, confirm), guards, HTTP interceptor
  auth/          login and register pages
  enrollment/    "My courses" page for students
  students/      list, detail (tabs), profile form, courses panel (admin and self)
  courses/       list and form (admin)
  shared/        toast, confirm modal, not-found
```

Every Angular component uses the classic four files: `.ts`, `.html`, `.css`, `.spec.ts`.

## Security model

- Session cookie authentication (`JSESSIONID`, HttpOnly) plus CSRF protection: the server sets an `XSRF-TOKEN` cookie and Angular's `HttpClient` echoes it in the `X-XSRF-TOKEN` header.
- Passwords are stored with BCrypt (8-72 characters required).
- Not signed in → `401`; signed in but not allowed → `403`. The SPA sends a `401` back to the login page.
- Two layers on the server: URL rules in `security/SecurityConfig`, and per-record rules (`hasRole('ADMIN') or @access.isSelf(#id)`) as `@PreAuthorize` annotations on `StudentController`.
- Two layers in the browser: `canActivate` guards (`authGuard`, `adminGuard`, `selfOrAdminGuard`, `guestGuard`, `homeGuard`) and a role-aware navbar. The guards are a convenience; the API enforces the rules.

## API

All errors share one JSON shape: `{timestamp, status, error, message, fieldErrors}`.

| Method | Path | Who | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create a USER and their student profile (`firstName, lastName, email, password[, dateOfBirth]`) |
| POST | `/api/auth/login` | public | Body `{username, password}`; returns `{username, role, studentId}` |
| POST | `/api/auth/logout` | signed in | End the session (204) |
| GET | `/api/auth/me` | signed in | Current user |
| GET / POST | `/api/students` | admin | List (with enrolments) / create |
| GET | `/api/students/me` | signed in | My own student record |
| GET / PUT | `/api/students/{id}` | admin or that student | Read / update |
| DELETE | `/api/students/{id}` | admin | Delete (and their account) |
| PUT | `/api/students/{id}/courses` | admin or that student | Replace enrolled course ids (body `[1,2]`) |
| PUT / DELETE | `/api/students/{id}/courses/{courseId}` | admin or that student | Enrol / drop one course |
| GET | `/api/courses`, `/api/courses/{id}` | signed in | Catalogue |
| POST / PUT / DELETE | `/api/courses[/{id}]` | admin | Manage courses (deleting also unenrols students) |
| GET | `/api/courses/{id}/enrolled-count` | admin | Number of enrolled students |

## Notes

- The H2 web console is disabled because the API is now protected.
- Students created by an admin through `POST /api/students` have no login account; people who want to sign in should register themselves.
- Database settings, CORS origin and the admin seed are in `backend/src/main/resources/application.properties`.
