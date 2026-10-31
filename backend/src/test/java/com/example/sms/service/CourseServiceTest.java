package com.example.sms.service;

import com.example.sms.dto.CourseRequest;
import com.example.sms.exception.ConflictException;
import com.example.sms.exception.NotFoundException;
import com.example.sms.model.Course;
import com.example.sms.repository.CourseRepository;
import com.example.sms.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {
    @Mock CourseRepository courses;
    @Mock StudentRepository students;
    @InjectMocks CourseService service;

    private Course course;

    @BeforeEach
    void setUp() {
        course = new Course();
        course.setId(1L);
        course.setCode("CS101");
        course.setTitle("Intro");
        course.setCredits(3);
    }

    private CourseRequest request(String code, String description) {
        CourseRequest r = new CourseRequest();
        r.setCode(code);
        r.setTitle("  Title  ");
        r.setDescription(description);
        r.setCredits(4);
        return r;
    }

    @Test
    void findAllSortsByCode() {
        when(courses.findAll(Sort.by("code"))).thenReturn(Collections.singletonList(course));
        assertEquals(1, service.findAll().size());
    }

    @Test
    void getReturnsCourseOrThrows() {
        when(courses.findById(1L)).thenReturn(Optional.of(course));
        when(courses.findById(2L)).thenReturn(Optional.empty());
        assertSame(course, service.get(1L));
        NotFoundException e = assertThrows(NotFoundException.class, () -> service.get(2L));
        assertTrue(e.getMessage().contains("2"));
    }

    @Test
    void createTrimsAndSaves() {
        when(courses.existsByCodeIgnoreCase("NEW1")).thenReturn(false);
        when(courses.save(any(Course.class))).thenAnswer(i -> i.getArgument(0));
        Course saved = service.create(request(" NEW1 ", "  desc  "));
        assertEquals("NEW1", saved.getCode());
        assertEquals("Title", saved.getTitle());
        assertEquals("desc", saved.getDescription());
        assertEquals(4, saved.getCredits());
    }

    @Test
    void createAllowsMissingDescription() {
        when(courses.save(any(Course.class))).thenAnswer(i -> i.getArgument(0));
        assertNull(service.create(request("NEW2", null)).getDescription());
    }

    @Test
    void createRejectsDuplicateCode() {
        when(courses.existsByCodeIgnoreCase("CS101")).thenReturn(true);
        assertThrows(ConflictException.class, () -> service.create(request("CS101", null)));
        verify(courses, never()).save(any());
    }

    @Test
    void updateChangesFields() {
        when(courses.findById(1L)).thenReturn(Optional.of(course));
        when(courses.existsByCodeIgnoreCaseAndIdNot("CS200", 1L)).thenReturn(false);
        when(courses.save(course)).thenReturn(course);
        assertEquals("CS200", service.update(1L, request("CS200", "d")).getCode());
    }

    @Test
    void updateRejectsCodeOfAnotherCourse() {
        when(courses.findById(1L)).thenReturn(Optional.of(course));
        when(courses.existsByCodeIgnoreCaseAndIdNot("TAKEN", 1L)).thenReturn(true);
        assertThrows(ConflictException.class, () -> service.update(1L, request("TAKEN", null)));
    }

    @Test
    void deleteUnenrollsStudentsFirst() {
        when(courses.findById(1L)).thenReturn(Optional.of(course));
        service.delete(1L);
        verify(students).removeCourseEnrollments(1L);
        verify(courses).delete(course);
    }

    @Test
    void enrolledCountRequiresExistingCourse() {
        when(courses.findById(1L)).thenReturn(Optional.of(course));
        when(courses.findById(9L)).thenReturn(Optional.empty());
        when(students.countEnrolled(1L)).thenReturn(5L);
        assertEquals(5L, service.enrolledCount(1L));
        assertThrows(NotFoundException.class, () -> service.enrolledCount(9L));
    }

    @Test
    void findAllReturnsEmptyList() {
        when(courses.findAll(Sort.by("code"))).thenReturn(List.of());
        assertTrue(service.findAll().isEmpty());
    }
}
