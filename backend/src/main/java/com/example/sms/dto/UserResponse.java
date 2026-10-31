package com.example.sms.dto;

import com.example.sms.security.AppUserDetails;

/** The signed-in user as seen by the SPA. {@code studentId} is null for the admin. */
public class UserResponse {
    private String username;
    private String role;
    private Long studentId;

    public static UserResponse from(AppUserDetails u) {
        UserResponse r = new UserResponse();
        r.username = u.getUsername();
        r.role = u.getRole().name();
        r.studentId = u.getStudentId();
        return r;
    }

    public String getUsername() { return username; }
    public String getRole() { return role; }
    public Long getStudentId() { return studentId; }
}
