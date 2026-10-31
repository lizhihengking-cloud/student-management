package com.example.sms.controller;

import com.example.sms.dto.StudentRequest;
import com.example.sms.dto.StudentResponse;
import com.example.sms.exception.NotFoundException;
import com.example.sms.security.AppUserDetails;
import com.example.sms.service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/students")
public class StudentController {
    private final StudentService service;

    public StudentController(StudentService service) { this.service = service; }

    /** Admin only: every student with their enrollments. */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<StudentResponse> list() {
        return service.findAll().stream().map(StudentResponse::from).collect(Collectors.toList());
    }

    /** The signed-in user's own student record. */
    @GetMapping("/me")
    public StudentResponse me(@AuthenticationPrincipal AppUserDetails user) {
        if (user.getStudentId() == null) throw new NotFoundException("This account has no student profile");
        return StudentResponse.from(service.get(user.getStudentId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @access.isSelf(#id)")
    public StudentResponse get(@PathVariable Long id) { return StudentResponse.from(service.get(id)); }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponse create(@Valid @RequestBody StudentRequest req) {
        return StudentResponse.from(service.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @access.isSelf(#id)")
    public StudentResponse update(@PathVariable Long id, @Valid @RequestBody StudentRequest req) {
        return StudentResponse.from(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }

    @PutMapping("/{id}/courses/{courseId}")
    @PreAuthorize("hasRole('ADMIN') or @access.isSelf(#id)")
    public StudentResponse enroll(@PathVariable Long id, @PathVariable Long courseId) {
        return StudentResponse.from(service.enroll(id, courseId));
    }

    @DeleteMapping("/{id}/courses/{courseId}")
    @PreAuthorize("hasRole('ADMIN') or @access.isSelf(#id)")
    public StudentResponse unenroll(@PathVariable Long id, @PathVariable Long courseId) {
        return StudentResponse.from(service.unenroll(id, courseId));
    }

    @PutMapping("/{id}/courses")
    @PreAuthorize("hasRole('ADMIN') or @access.isSelf(#id)")
    public StudentResponse setCourses(@PathVariable Long id, @RequestBody List<Long> courseIds) {
        return StudentResponse.from(service.setCourses(id, courseIds));
    }
}
