package com.example.sms.controller;

import com.example.sms.dto.CourseRequest;
import com.example.sms.dto.CourseResponse;
import com.example.sms.service.CourseService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
public class CourseController {
    private final CourseService service;

    public CourseController(CourseService service) { this.service = service; }

    @GetMapping
    public List<CourseResponse> list() {
        return service.findAll().stream().map(CourseResponse::from).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public CourseResponse get(@PathVariable Long id) { return CourseResponse.from(service.get(id)); }

    @GetMapping("/{id}/enrolled-count")
    @PreAuthorize("hasRole('ADMIN')")
    public long enrolledCount(@PathVariable Long id) { return service.enrolledCount(id); }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseResponse create(@Valid @RequestBody CourseRequest req) {
        return CourseResponse.from(service.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CourseResponse update(@PathVariable Long id, @Valid @RequestBody CourseRequest req) {
        return CourseResponse.from(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
}
