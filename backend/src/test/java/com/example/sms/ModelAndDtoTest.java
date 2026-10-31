package com.example.sms;

import com.example.sms.dto.*;
import com.example.sms.model.*;
import com.example.sms.security.AppUserDetails;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/** Plain accessors / mapping code of entities and DTOs. */
class ModelAndDtoTest {

    private Course course(long id, String code) {
        Course c = new Course();
        c.setId(id);
        c.setCode(code);
        c.setTitle("Title " + code);
        c.setDescription("Desc " + code);
        c.setCredits(3);
        return c;
    }

    @Test
    void courseAccessors() {
        Course c = course(1, "CS101");
        assertEquals(1L, c.getId());
        assertEquals("CS101", c.getCode());
        assertEquals("Title CS101", c.getTitle());
        assertEquals("Desc CS101", c.getDescription());
        assertEquals(3, c.getCredits());
    }

    @Test
    void studentAccessors() {
        Student s = new Student();
        s.setId(2L);
        s.setFirstName("Ada");
        s.setLastName("Lovelace");
        s.setEmail("ada@x.com");
        s.setDateOfBirth(LocalDate.of(1990, 1, 1));
        Set<Course> courses = new HashSet<>();
        courses.add(course(1, "CS101"));
        s.setCourses(courses);
        assertEquals(2L, s.getId());
        assertEquals("Ada", s.getFirstName());
        assertEquals("Lovelace", s.getLastName());
        assertEquals("ada@x.com", s.getEmail());
        assertEquals(LocalDate.of(1990, 1, 1), s.getDateOfBirth());
        assertSame(courses, s.getCourses());
    }

    @Test
    void userAccessors() {
        Student s = new Student();
        User u = new User();
        u.setUsername("a@x.com");
        u.setPasswordHash("HASH");
        u.setRole(Role.USER);
        u.setStudent(s);
        assertNull(u.getId());
        assertEquals("a@x.com", u.getUsername());
        assertEquals("HASH", u.getPasswordHash());
        assertEquals(Role.USER, u.getRole());
        assertSame(s, u.getStudent());
        assertEquals(Role.ADMIN, Role.valueOf("ADMIN"));
        assertEquals(2, Role.values().length);
    }

    @Test
    void requestDtos() {
        CourseRequest cr = new CourseRequest();
        cr.setCode("C");
        cr.setTitle("T");
        cr.setDescription("D");
        cr.setCredits(2);
        assertEquals("C", cr.getCode());
        assertEquals("T", cr.getTitle());
        assertEquals("D", cr.getDescription());
        assertEquals(2, cr.getCredits());

        StudentRequest sr = new StudentRequest();
        sr.setFirstName("F");
        sr.setLastName("L");
        sr.setEmail("e@x.com");
        sr.setDateOfBirth(LocalDate.of(2000, 1, 1));
        assertEquals("F", sr.getFirstName());
        assertEquals("L", sr.getLastName());
        assertEquals("e@x.com", sr.getEmail());
        assertEquals(LocalDate.of(2000, 1, 1), sr.getDateOfBirth());

        LoginRequest lr = new LoginRequest();
        lr.setUsername("u");
        lr.setPassword("p");
        assertEquals("u", lr.getUsername());
        assertEquals("p", lr.getPassword());

        RegisterRequest rr = new RegisterRequest();
        rr.setFirstName("F");
        rr.setLastName("L");
        rr.setEmail("e@x.com");
        rr.setPassword("password123");
        rr.setDateOfBirth(LocalDate.of(2000, 1, 1));
        assertEquals("F", rr.getFirstName());
        assertEquals("L", rr.getLastName());
        assertEquals("e@x.com", rr.getEmail());
        assertEquals("password123", rr.getPassword());
        assertEquals(LocalDate.of(2000, 1, 1), rr.getDateOfBirth());
    }

    @Test
    void responseDtosMapEntitiesAndSortCoursesByCode() {
        Student s = new Student();
        s.setId(9L);
        s.setFirstName("Ada");
        s.setLastName("Lovelace");
        s.setEmail("ada@x.com");
        s.setDateOfBirth(LocalDate.of(1990, 1, 1));
        s.getCourses().add(course(2, "CS200"));
        s.getCourses().add(course(1, "CS100"));

        StudentResponse r = StudentResponse.from(s);
        assertEquals(9L, r.getId());
        assertEquals("Ada", r.getFirstName());
        assertEquals("Lovelace", r.getLastName());
        assertEquals("ada@x.com", r.getEmail());
        assertEquals(LocalDate.of(1990, 1, 1), r.getDateOfBirth());
        assertEquals("CS100", r.getCourses().get(0).getCode());
        assertEquals("CS200", r.getCourses().get(1).getCode());

        CourseResponse c = r.getCourses().get(0);
        assertEquals(1L, c.getId());
        assertEquals("Title CS100", c.getTitle());
        assertEquals("Desc CS100", c.getDescription());
        assertEquals(3, c.getCredits());
    }

    @Test
    void userResponseMapsPrincipal() {
        Student s = new Student();
        s.setId(4L);
        User u = new User();
        u.setUsername("a@x.com");
        u.setPasswordHash("H");
        u.setRole(Role.USER);
        u.setStudent(s);
        UserResponse r = UserResponse.from(new AppUserDetails(u));
        assertEquals("a@x.com", r.getUsername());
        assertEquals("USER", r.getRole());
        assertEquals(4L, r.getStudentId());
    }
}
