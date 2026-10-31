package com.example.sms.service;

import com.example.sms.dto.CourseRequest;
import com.example.sms.exception.ConflictException;
import com.example.sms.exception.NotFoundException;
import com.example.sms.model.Course;
import com.example.sms.repository.CourseRepository;
import com.example.sms.repository.StudentRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CourseService {
    private final CourseRepository courses;
    private final StudentRepository students;

    public CourseService(CourseRepository courses, StudentRepository students) {
        this.courses = courses;
        this.students = students;
    }

    @Transactional(readOnly = true)
    public List<Course> findAll() { return courses.findAll(Sort.by("code")); }

    @Transactional(readOnly = true)
    public Course get(Long id) {
        return courses.findById(id).orElseThrow(() -> new NotFoundException("Course " + id + " not found"));
    }

    public Course create(CourseRequest req) {
        String code = req.getCode().trim();
        if (courses.existsByCodeIgnoreCase(code))
            throw new ConflictException("A course with code '" + code + "' already exists");
        return courses.save(apply(new Course(), req));
    }

    public Course update(Long id, CourseRequest req) {
        Course c = get(id);
        String code = req.getCode().trim();
        if (courses.existsByCodeIgnoreCaseAndIdNot(code, id))
            throw new ConflictException("A course with code '" + code + "' already exists");
        return courses.save(apply(c, req));
    }

    /** Deleting a course also removes it from every student's enrollment. */
    public void delete(Long id) {
        Course c = get(id);
        students.removeCourseEnrollments(id);
        courses.delete(c);
    }

    @Transactional(readOnly = true)
    public long enrolledCount(Long id) {
        get(id);
        return students.countEnrolled(id);
    }

    private Course apply(Course c, CourseRequest req) {
        c.setCode(req.getCode().trim());
        c.setTitle(req.getTitle().trim());
        c.setDescription(req.getDescription() == null ? null : req.getDescription().trim());
        c.setCredits(req.getCredits());
        return c;
    }
}
