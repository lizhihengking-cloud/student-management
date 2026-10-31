package com.example.sms.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/** Used from {@code @PreAuthorize("... or @access.isSelf(#id)")}: a user may only touch their own student record. */
@Component("access")
public class AccessChecker {
    public boolean isSelf(Long studentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AppUserDetails)) return false;
        Long mine = ((AppUserDetails) auth.getPrincipal()).getStudentId();
        return mine != null && mine.equals(studentId);
    }
}
