package com.example.sms.dto;

import com.example.sms.model.Grade;

/** Body of the grading call. A {@code null} grade clears the existing grade. */
public class GradeRequest {
    private Grade grade;

    public Grade getGrade() { return grade; }
    public void setGrade(Grade grade) { this.grade = grade; }
}
