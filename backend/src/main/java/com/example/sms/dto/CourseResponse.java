package com.example.sms.dto;

import com.example.sms.model.Course;

public class CourseResponse {
    private Long id;
    private String code;
    private String title;
    private String description;
    private int credits;

    public static CourseResponse from(Course c) {
        CourseResponse r = new CourseResponse();
        r.id = c.getId();
        r.code = c.getCode();
        r.title = c.getTitle();
        r.description = c.getDescription();
        r.credits = c.getCredits();
        return r;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public int getCredits() { return credits; }
}
