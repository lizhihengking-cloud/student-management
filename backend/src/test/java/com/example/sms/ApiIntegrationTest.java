package com.example.sms;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * End-to-end tests against an embedded server using TestRestTemplate. {@link Client} behaves like the
 * browser: it keeps the JSESSIONID / XSRF-TOKEN cookies and echoes the CSRF token in X-XSRF-TOKEN.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
                "app.admin.username=admin", "app.admin.password=admin-pass-1"})
class ApiIntegrationTest {
    @Autowired TestRestTemplate rest;

    class Client {
        private final Map<String, String> cookies = new HashMap<>();

        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> call(HttpMethod method, String url, Object body) {
            if (!cookies.containsKey("XSRF-TOKEN")) remember(rest.exchange("/api/auth/me", HttpMethod.GET, entity(null), Map.class));
            ResponseEntity<Map> res = rest.exchange(url, method, entity(body), Map.class);
            remember(res);
            return res;
        }

        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> get(String url) { return call(HttpMethod.GET, url, null); }
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> post(String url, Object body) { return call(HttpMethod.POST, url, body); }
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> put(String url, Object body) { return call(HttpMethod.PUT, url, body); }
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> delete(String url) { return call(HttpMethod.DELETE, url, null); }

        /** Body is a List on success but an error Map on 401/403, hence Object. */
        ResponseEntity<Object> list(String url) {
            return rest.exchange(url, HttpMethod.GET, entity(null), Object.class);
        }

        void login(String username, String password) {
            ResponseEntity<Map> res = post("/api/auth/login", Map.of("username", username, "password", password));
            assertEquals(HttpStatus.OK, res.getStatusCode(), "login should succeed for " + username);
        }

        private HttpEntity<Object> entity(Object body) {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            if (!cookies.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                cookies.forEach((k, v) -> sb.append(sb.length() == 0 ? "" : "; ").append(k).append('=').append(v));
                h.add(HttpHeaders.COOKIE, sb.toString());
            }
            if (cookies.containsKey("XSRF-TOKEN")) h.add("X-XSRF-TOKEN", cookies.get("XSRF-TOKEN"));
            return new HttpEntity<>(body, h);
        }

        private void remember(ResponseEntity<?> res) {
            List<String> set = res.getHeaders().get(HttpHeaders.SET_COOKIE);
            if (set == null) return;
            for (String c : set) {
                String pair = c.split(";", 2)[0];
                int eq = pair.indexOf('=');
                String name = pair.substring(0, eq), value = pair.substring(eq + 1);
                if (value.isEmpty() || c.contains("Max-Age=0")) cookies.remove(name); else cookies.put(name, value);
            }
        }
    }

    private Client admin() {
        Client c = new Client();
        c.login("admin", "admin-pass-1");
        return c;
    }

    private String email() { return "u" + UUID.randomUUID().toString().substring(0, 8) + "@x.com"; }

    private Map<String, Object> registration(String email) {
        return Map.of("firstName", "Ada", "lastName", "Lovelace", "email", email,
                "password", "password123", "dateOfBirth", "1990-01-01");
    }

    /** Registers a new user and returns a logged-in client; the student id is read from /me. */
    private Client newUser(String email) {
        Client c = new Client();
        assertEquals(HttpStatus.CREATED, c.post("/api/auth/register", registration(email)).getStatusCode());
        c.login(email, "password123");
        return c;
    }

    private Object createCourse(Client admin, String code) {
        Map<String, Object> course = Map.of("code", code, "title", "Course " + code, "credits", 3);
        ResponseEntity<Map> res = admin.post("/api/courses", course);
        assertEquals(HttpStatus.CREATED, res.getStatusCode());
        return res.getBody().get("id");
    }

    @Test
    void anonymousRequestsAreRejected() {
        Client anon = new Client();
        assertEquals(HttpStatus.UNAUTHORIZED, anon.get("/api/students").getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, anon.get("/api/courses").getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, anon.get("/api/auth/me").getStatusCode());
    }

    @Test
    void postWithoutCsrfTokenIsRejected() {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map> res = rest.exchange("/api/auth/register", HttpMethod.POST,
                new HttpEntity<>(registration(email()), h), Map.class);
        assertEquals(HttpStatus.FORBIDDEN, res.getStatusCode());
    }

    @Test
    void registerLoginMeLogout() {
        String email = email();
        Client c = newUser(email);

        ResponseEntity<Map> me = c.get("/api/auth/me");
        assertEquals(HttpStatus.OK, me.getStatusCode());
        assertEquals("USER", me.getBody().get("role"));
        assertEquals(email, me.getBody().get("username"));

        assertEquals(HttpStatus.NO_CONTENT, c.post("/api/auth/logout", null).getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, c.get("/api/auth/me").getStatusCode());
    }

    @Test
    void registerValidationAndDuplicates() {
        Client c = new Client();
        Map<String, Object> bad = Map.of("firstName", "", "lastName", "X", "email", "nope", "password", "short");
        ResponseEntity<Map> r = c.post("/api/auth/register", bad);
        assertEquals(HttpStatus.BAD_REQUEST, r.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, String> fields = (Map<String, String>) r.getBody().get("fieldErrors");
        assertTrue(fields.containsKey("firstName"));
        assertTrue(fields.containsKey("email"));
        assertTrue(fields.containsKey("password"));

        String email = email();
        assertEquals(HttpStatus.CREATED, c.post("/api/auth/register", registration(email)).getStatusCode());
        assertEquals(HttpStatus.CONFLICT, c.post("/api/auth/register", registration(email.toUpperCase())).getStatusCode());
    }

    @Test
    void wrongPasswordIsUnauthorized() {
        String email = email();
        Client c = new Client();
        c.post("/api/auth/register", registration(email));
        ResponseEntity<Map> res = c.post("/api/auth/login", Map.of("username", email, "password", "wrong-password"));
        assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
        assertEquals(HttpStatus.UNAUTHORIZED, c.get("/api/auth/me").getStatusCode());
    }

    @Test
    void adminSeesEveryoneUserSeesOnlySelf() {
        Client alice = newUser(email());
        Client bob = newUser(email());
        Object aliceId = alice.get("/api/auth/me").getBody().get("studentId");
        Object bobId = bob.get("/api/auth/me").getBody().get("studentId");

        Client admin = admin();
        ResponseEntity<Object> all = admin.list("/api/students");
        assertEquals(HttpStatus.OK, all.getStatusCode());
        assertTrue(((List<?>) all.getBody()).size() >= 2);

        // users cannot list students nor read / modify somebody else's record
        assertEquals(HttpStatus.FORBIDDEN, alice.list("/api/students").getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN, alice.get("/api/students/" + bobId).getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN, alice.put("/api/students/" + bobId + "/courses", List.of()).getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN, alice.delete("/api/students/" + aliceId).getStatusCode());

        // ...but can read their own
        assertEquals(HttpStatus.OK, alice.get("/api/students/" + aliceId).getStatusCode());
        assertEquals(aliceId, alice.get("/api/students/me").getBody().get("id"));
    }

    @Test
    void courseCatalogueWritesAreAdminOnly() {
        Client user = newUser(email());
        Map<String, Object> course = Map.of("code", "NO1", "title", "Nope", "credits", 3);
        assertEquals(HttpStatus.FORBIDDEN, user.post("/api/courses", course).getStatusCode());
        assertEquals(HttpStatus.OK, user.list("/api/courses").getStatusCode());
    }

    @Test
    @SuppressWarnings("unchecked")
    void studentCanEnrolInMultipleCoursesAndAdminSeesIt() {
        Client admin = admin();
        String suffix = UUID.randomUUID().toString().substring(0, 5);
        Object c1 = createCourse(admin, "A" + suffix);
        Object c2 = createCourse(admin, "B" + suffix);
        Object c3 = createCourse(admin, "C" + suffix);

        Client alice = newUser(email());
        Client bob = newUser(email());
        Object aliceId = alice.get("/api/auth/me").getBody().get("studentId");
        Object bobId = bob.get("/api/auth/me").getBody().get("studentId");

        assertEquals(HttpStatus.OK, alice.put("/api/students/" + aliceId + "/courses/" + c1, null).getStatusCode());
        assertEquals(HttpStatus.OK, alice.put("/api/students/" + aliceId + "/courses/" + c2, null).getStatusCode());
        assertEquals(2, ((List<?>) alice.get("/api/students/me").getBody().get("courses")).size());

        // replace the whole selection, drop one
        Map<String, Object> afterReplace = alice.put("/api/students/" + aliceId + "/courses", List.of(c2, c3)).getBody();
        assertEquals(2, ((List<?>) afterReplace.get("courses")).size());
        Map<String, Object> afterDrop = alice.delete("/api/students/" + aliceId + "/courses/" + c2).getBody();
        assertEquals(1, ((List<?>) afterDrop.get("courses")).size());

        // another user cannot enrol Alice, and Bob's own list is unaffected
        assertEquals(HttpStatus.FORBIDDEN, bob.put("/api/students/" + aliceId + "/courses/" + c1, null).getStatusCode());
        assertEquals(0, ((List<?>) bob.get("/api/students/" + bobId).getBody().get("courses")).size());

        // admin sees Alice's enrolment in the full list
        List<Map<String, Object>> all = (List<Map<String, Object>>) admin.list("/api/students").getBody();
        Map<String, Object> aliceRow = all.stream().filter(s -> s.get("id").equals(aliceId)).findFirst().get();
        assertEquals(1, ((List<?>) aliceRow.get("courses")).size());
    }

    @Test
    void deletingStudentRemovesLoginAndDeletingCourseUnenrols() {
        Client admin = admin();
        Object course = createCourse(admin, "D" + UUID.randomUUID().toString().substring(0, 5));
        String email = email();
        Client user = newUser(email);
        Object id = user.get("/api/auth/me").getBody().get("studentId");
        user.put("/api/students/" + id + "/courses/" + course, null);

        admin.delete("/api/courses/" + course);
        assertEquals(0, ((List<?>) admin.get("/api/students/" + id).getBody().get("courses")).size());

        assertEquals(HttpStatus.NO_CONTENT, admin.delete("/api/students/" + id).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, admin.get("/api/students/" + id).getStatusCode());
        Client again = new Client();
        assertEquals(HttpStatus.UNAUTHORIZED, again.post("/api/auth/login", Map.of("username", email, "password", "password123")).getStatusCode());
    }

    @Test
    void emailChangeKeepsLoginInSync() {
        String email = email();
        Client user = newUser(email);
        Object id = user.get("/api/auth/me").getBody().get("studentId");
        String newEmail = email();
        Map<String, Object> body = Map.of("firstName", "Ada", "lastName", "Lovelace", "email", newEmail);
        assertEquals(HttpStatus.OK, user.put("/api/students/" + id, body).getStatusCode());

        Client fresh = new Client();
        fresh.login(newEmail, "password123");
        assertEquals(HttpStatus.UNAUTHORIZED,
                new Client().post("/api/auth/login", Map.of("username", email, "password", "password123")).getStatusCode());
    }

    @Test
    void adminManagesCoursesAndStudentsDirectly() {
        Client admin = admin();
        String code = "E" + UUID.randomUUID().toString().substring(0, 5);
        Object courseId = createCourse(admin, code);

        assertEquals(code, admin.get("/api/courses/" + courseId).getBody().get("code"));
        Map<String, Object> change = Map.of("code", code, "title", "Renamed", "credits", 5);
        assertEquals("Renamed", admin.put("/api/courses/" + courseId, change).getBody().get("title"));
        assertEquals(HttpStatus.OK, admin.list("/api/courses/" + courseId + "/enrolled-count").getStatusCode());

        // admin creates a student record (no login account) and enrols / drops
        Map<String, Object> body = Map.of("firstName", "Grace", "lastName", "Hopper", "email", email());
        ResponseEntity<Map> created = admin.post("/api/students", body);
        assertEquals(HttpStatus.CREATED, created.getStatusCode());
        Object sid = created.getBody().get("id");
        assertEquals(1, ((List<?>) admin.put("/api/students/" + sid + "/courses/" + courseId, null).getBody().get("courses")).size());
        assertEquals(0, ((List<?>) admin.delete("/api/students/" + sid + "/courses/" + courseId).getBody().get("courses")).size());
        assertEquals(HttpStatus.OK, admin.put("/api/students/" + sid, body).getStatusCode());

        assertEquals(HttpStatus.NO_CONTENT, admin.delete("/api/courses/" + courseId).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, admin.get("/api/courses/" + courseId).getStatusCode());
        assertEquals(HttpStatus.NO_CONTENT, admin.delete("/api/students/" + sid).getStatusCode());
    }

    @Test
    void adminAccountHasNoStudentProfile() {
        assertEquals(HttpStatus.NOT_FOUND, admin().get("/api/students/me").getStatusCode());
    }

    @Test
    void loggingInAgainWhileHoldingASessionStillWorks() {
        Client c = admin();
        c.login("admin", "admin-pass-1"); // second login reuses (and rotates) the existing session
        assertEquals(HttpStatus.OK, c.get("/api/auth/me").getStatusCode());
    }
}
