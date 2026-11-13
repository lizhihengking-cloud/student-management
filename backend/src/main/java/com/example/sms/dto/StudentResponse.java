package com.example.sms.dto;

import com.example.sms.model.Course;
import com.example.sms.model.Student;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class StudentResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private LocalDate dateOfBirth;
    private List<CourseResponse> courses;

    public static StudentResponse from(Student s) {
        StudentResponse r = new StudentResponse();
        r.id = s.getId();
        r.firstName = s.getFirstName();
        r.lastName = s.getLastName();
        r.email = s.getEmail();
        r.dateOfBirth = s.getDateOfBirth();
        r.courses = s.getCourses().stream()
                .sorted(Comparator.comparing(Course::getCode))
                .map(c -> CourseResponse.from(c, s.getGrades().get(c.getId())))
                .collect(Collectors.toList());
        return r;
    }

    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public List<CourseResponse> getCourses() { return courses; }
}
