package com.example.sms.service;

import com.example.sms.dto.StudentRequest;
import com.example.sms.exception.ConflictException;
import com.example.sms.exception.NotFoundException;
import com.example.sms.model.Student;
import com.example.sms.repository.StudentRepository;
import com.example.sms.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class StudentService {
    private final StudentRepository students;
    private final CourseService courseService;
    private final UserRepository users;

    public StudentService(StudentRepository students, CourseService courseService, UserRepository users) {
        this.students = students;
        this.courseService = courseService;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<Student> findAll() {
        List<Student> all = students.findAll(Sort.by("lastName", "firstName"));
        all.forEach(s -> s.getCourses().size()); // initialise lazy collection inside the transaction
        return all;
    }

    @Transactional(readOnly = true)
    public Student get(Long id) {
        Student s = students.findById(id).orElseThrow(() -> new NotFoundException("Student " + id + " not found"));
        s.getCourses().size();
        return s;
    }

    public Student create(StudentRequest req) {
        String email = req.getEmail().trim();
        if (students.existsByEmailIgnoreCase(email))
            throw new ConflictException("A student with email '" + email + "' already exists");
        return students.save(apply(new Student(), req));
    }

    public Student update(Long id, StudentRequest req) {
        Student s = get(id);
        String email = req.getEmail().trim();
        if (students.existsByEmailIgnoreCaseAndIdNot(email, id))
            throw new ConflictException("A student with email '" + email + "' already exists");
        apply(s, req);
        // the login name is the student's email, keep the two in sync
        users.findByStudentId(id).ifPresent(u -> u.setUsername(email.toLowerCase()));
        return students.save(s);
    }

    /** Deleting a student also deletes their login account. */
    public void delete(Long id) {
        Student s = get(id);
        users.findByStudentId(id).ifPresent(users::delete);
        students.delete(s);
    }

    public Student enroll(Long studentId, Long courseId) {
        Student s = get(studentId);
        s.getCourses().add(courseService.get(courseId));
        return s;
    }

    public Student unenroll(Long studentId, Long courseId) {
        Student s = get(studentId);
        s.getCourses().removeIf(c -> c.getId().equals(courseId));
        return s;
    }

    /** Replaces the whole set of enrolled courses (used by the UI's "Save changes"). */
    public Student setCourses(Long studentId, List<Long> courseIds) {
        Student s = get(studentId);
        s.getCourses().clear();
        for (Long id : courseIds) s.getCourses().add(courseService.get(id));
        return s;
    }

    private Student apply(Student s, StudentRequest req) {
        s.setFirstName(req.getFirstName().trim());
        s.setLastName(req.getLastName().trim());
        s.setEmail(req.getEmail().trim());
        s.setDateOfBirth(req.getDateOfBirth());
        return s;
    }
}
