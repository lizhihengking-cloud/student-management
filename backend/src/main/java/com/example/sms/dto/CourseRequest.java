package com.example.sms.dto;

import javax.validation.constraints.*;

public class CourseRequest {
    @NotBlank(message = "Code is required")
    @Size(max = 20, message = "Code must be at most 20 characters")
    private String code;
    @NotBlank(message = "Title is required")
    @Size(max = 100, message = "Title must be at most 100 characters")
    private String title;
    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;
    @Min(value = 1, message = "Credits must be at least 1")
    @Max(value = 10, message = "Credits must be at most 10")
    private int credits;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getCredits() { return credits; }
    public void setCredits(int credits) { this.credits = credits; }
}
