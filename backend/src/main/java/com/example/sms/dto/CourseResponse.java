package com.example.sms.dto;

import com.example.sms.model.Course;
import com.example.sms.model.Grade;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class CourseResponse {
    private Long id;
    private String code;
    private String title;
    private String description;
    private int credits;
    /** Only set when the course is shown as part of a student's enrollment and has been graded. */
    private Grade grade;

    public static CourseResponse from(Course c) {
        CourseResponse r = new CourseResponse();
        r.id = c.getId();
        r.code = c.getCode();
        r.title = c.getTitle();
        r.description = c.getDescription();
        r.credits = c.getCredits();
        return r;
    }

    public static CourseResponse from(Course c, Grade grade) {
        CourseResponse r = from(c);
        r.grade = grade;
        return r;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public int getCredits() { return credits; }
    public Grade getGrade() { return grade; }
}
