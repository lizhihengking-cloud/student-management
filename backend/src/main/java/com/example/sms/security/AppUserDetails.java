package com.example.sms.security;

import com.example.sms.model.Role;
import com.example.sms.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/** Immutable principal stored in the HTTP session (no JPA entities, so no lazy-loading surprises). */
public class AppUserDetails implements UserDetails {
    private static final long serialVersionUID = 1L;

    private final Long userId;
    private final String username;
    private final String passwordHash;
    private final Role role;
    private final Long studentId;

    public AppUserDetails(User u) {
        this.userId = u.getId();
        this.username = u.getUsername();
        this.passwordHash = u.getPasswordHash();
        this.role = u.getRole();
        this.studentId = u.getStudent() == null ? null : u.getStudent().getId();
    }

    public Long getUserId() { return userId; }
    public Role getRole() { return role; }
    public Long getStudentId() { return studentId; }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
    @Override public String getPassword() { return passwordHash; }
    @Override public String getUsername() { return username; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
