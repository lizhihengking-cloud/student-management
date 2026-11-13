package com.example.sms.service;

import com.example.sms.dto.StudentRequest;
import com.example.sms.exception.ConflictException;
import com.example.sms.exception.NotFoundException;
import com.example.sms.model.Course;
import com.example.sms.model.Grade;
import com.example.sms.model.Student;
import com.example.sms.model.User;
import com.example.sms.repository.StudentRepository;
import com.example.sms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {
    @Mock StudentRepository students;
    @Mock CourseService courseService;
    @Mock UserRepository users;
    @InjectMocks StudentService service;

    private Student student;
    private Course c1;
    private Course c2;

    @BeforeEach
    void setUp() {
        student = new Student();
        student.setId(1L);
        student.setFirstName("Ada");
        student.setLastName("Lovelace");
        student.setEmail("ada@x.com");
        c1 = new Course();
        c1.setId(10L);
        c2 = new Course();
        c2.setId(11L);
    }

    private StudentRequest request(String email) {
        StudentRequest r = new StudentRequest();
        r.setFirstName(" Grace ");
        r.setLastName(" Hopper ");
        r.setEmail(email);
        r.setDateOfBirth(LocalDate.of(1990, 1, 1));
        return r;
    }

    @Test
    void findAllLoadsCourses() {
        when(students.findAll(Sort.by("lastName", "firstName"))).thenReturn(new ArrayList<>(List.of(student)));
        assertEquals(1, service.findAll().size());
    }

    @Test
    void getReturnsStudentOrThrows() {
        when(students.findById(1L)).thenReturn(Optional.of(student));
        when(students.findById(2L)).thenReturn(Optional.empty());
        assertSame(student, service.get(1L));
        assertThrows(NotFoundException.class, () -> service.get(2L));
    }

    @Test
    void createTrimsAndSaves() {
        when(students.existsByEmailIgnoreCase("g@x.com")).thenReturn(false);
        when(students.save(any(Student.class))).thenAnswer(i -> i.getArgument(0));
        Student s = service.create(request(" g@x.com "));
        assertEquals("Grace", s.getFirstName());
        assertEquals("Hopper", s.getLastName());
        assertEquals("g@x.com", s.getEmail());
        assertEquals(LocalDate.of(1990, 1, 1), s.getDateOfBirth());
    }

    @Test
    void createRejectsDuplicateEmail() {
        when(students.existsByEmailIgnoreCase("ada@x.com")).thenReturn(true);
        assertThrows(ConflictException.class, () -> service.create(request("ada@x.com")));
    }

    @Test
    void updateSyncsLoginNameOfLinkedAccount() {
        User account = new User();
        account.setUsername("ada@x.com");
        when(students.findById(1L)).thenReturn(Optional.of(student));
        when(students.existsByEmailIgnoreCaseAndIdNot("New@X.com", 1L)).thenReturn(false);
        when(users.findByStudentId(1L)).thenReturn(Optional.of(account));
        when(students.save(student)).thenReturn(student);
        service.update(1L, request("New@X.com"));
        assertEquals("new@x.com", account.getUsername());
        assertEquals("New@X.com", student.getEmail());
    }

    @Test
    void updateWithoutAccountJustSaves() {
        when(students.findById(1L)).thenReturn(Optional.of(student));
        when(users.findByStudentId(1L)).thenReturn(Optional.empty());
        when(students.save(student)).thenReturn(student);
        assertSame(student, service.update(1L, request("same@x.com")));
    }

    @Test
    void updateRejectsEmailOfAnotherStudent() {
        when(students.findById(1L)).thenReturn(Optional.of(student));
        when(students.existsByEmailIgnoreCaseAndIdNot("taken@x.com", 1L)).thenReturn(true);
        assertThrows(ConflictException.class, () -> service.update(1L, request("taken@x.com")));
    }

    @Test
    void deleteRemovesAccountToo() {
        User account = new User();
        when(students.findById(1L)).thenReturn(Optional.of(student));
        when(users.findByStudentId(1L)).thenReturn(Optional.of(account));
        service.delete(1L);
        verify(users).delete(account);
        verify(students).delete(student);
    }

    @Test
    void deleteWithoutAccount() {
        when(students.findById(1L)).thenReturn(Optional.of(student));
        when(users.findByStudentId(1L)).thenReturn(Optional.empty());
        service.delete(1L);
        verify(users, never()).delete(any());
        verify(students).delete(student);
    }

    @Test
    void enrollAndUnenrollSupportSeveralCourses() {
        when(students.findById(1L)).thenReturn(Optional.of(student));
        when(courseService.get(10L)).thenReturn(c1);
        when(courseService.get(11L)).thenReturn(c2);

        service.enroll(1L, 10L);
        service.enroll(1L, 11L);
        assertEquals(2, student.getCourses().size());

        service.unenroll(1L, 10L);
        assertEquals(Collections.singleton(c2), student.getCourses());
    }

    @Test
    void setCoursesReplacesSelection() {
        student.getCourses().add(c1);
        when(students.findById(1L)).thenReturn(Optional.of(student));
        when(courseService.get(11L)).thenReturn(c2);
        Student s = service.setCourses(1L, Arrays.asList(11L));
        assertEquals(Collections.singleton(c2), s.getCourses());
    }

    @Test
    void gradeSetsAndClearsOnlyForEnrolledCourses() {
        student.getCourses().add(c1);
        when(students.findById(1L)).thenReturn(Optional.of(student));

        service.grade(1L, c1.getId(), Grade.B);
        assertEquals(Grade.B, student.getGrades().get(c1.getId()));
        service.grade(1L, c1.getId(), null);
        assertTrue(student.getGrades().isEmpty());

        assertThrows(ConflictException.class, () -> service.grade(1L, 999L, Grade.A));
    }

    @Test
    void droppingACourseDropsItsGrade() {
        student.getCourses().add(c1);
        student.getCourses().add(c2);
        student.getGrades().put(c1.getId(), Grade.A);
        student.getGrades().put(c2.getId(), Grade.C);
        when(students.findById(1L)).thenReturn(Optional.of(student));

        service.unenroll(1L, c1.getId());
        assertEquals(Collections.singletonMap(c2.getId(), Grade.C), student.getGrades());

        // replacing the selection keeps grades of retained courses and drops the rest
        student.getCourses().add(c1);
        student.getGrades().put(c1.getId(), Grade.A);
        when(courseService.get(c1.getId())).thenReturn(c1);
        service.setCourses(1L, Arrays.asList(c1.getId()));
        assertEquals(Collections.singletonMap(c1.getId(), Grade.A), student.getGrades());
    }
}
