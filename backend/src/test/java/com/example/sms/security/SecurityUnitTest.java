package com.example.sms.security;

import com.example.sms.model.Role;
import com.example.sms.model.Student;
import com.example.sms.model.User;
import com.example.sms.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.csrf.CsrfToken;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SecurityUnitTest {
    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private User user(Role role, Long studentId) {
        User u = new User();
        u.setUsername("who@x.com");
        u.setPasswordHash("HASH");
        u.setRole(role);
        if (studentId != null) {
            Student s = new Student();
            s.setId(studentId);
            u.setStudent(s);
        }
        return u;
    }

    private void signIn(Object principal) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal, null));
    }

    // ---- AppUserDetails ----------------------------------------------------------------------

    @Test
    void userDetailsExposeAccountData() {
        AppUserDetails d = new AppUserDetails(user(Role.USER, 5L));
        assertEquals("who@x.com", d.getUsername());
        assertEquals("HASH", d.getPassword());
        assertEquals(Role.USER, d.getRole());
        assertEquals(5L, d.getStudentId());
        assertNull(d.getUserId());
        assertEquals("ROLE_USER", d.getAuthorities().iterator().next().getAuthority());
        assertTrue(d.isAccountNonExpired() && d.isAccountNonLocked() && d.isCredentialsNonExpired() && d.isEnabled());
    }

    @Test
    void adminHasNoStudentId() {
        AppUserDetails d = new AppUserDetails(user(Role.ADMIN, null));
        assertNull(d.getStudentId());
        assertEquals("ROLE_ADMIN", d.getAuthorities().iterator().next().getAuthority());
    }

    // ---- AppUserDetailsService ---------------------------------------------------------------

    @Test
    void serviceLoadsUserByTrimmedUsername() {
        UserRepository users = mock(UserRepository.class);
        when(users.findByUsernameIgnoreCase("who@x.com")).thenReturn(Optional.of(user(Role.USER, 1L)));
        UserDetails d = new AppUserDetailsService(users).loadUserByUsername("  who@x.com ");
        assertEquals("who@x.com", d.getUsername());
    }

    @Test
    void serviceRejectsUnknownUser() {
        UserRepository users = mock(UserRepository.class);
        when(users.findByUsernameIgnoreCase("nobody")).thenReturn(Optional.empty());
        assertThrows(UsernameNotFoundException.class, () -> new AppUserDetailsService(users).loadUserByUsername("nobody"));
    }

    // ---- AccessChecker -----------------------------------------------------------------------

    @Test
    void isSelfIsFalseWhenNobodyIsSignedIn() {
        assertFalse(new AccessChecker().isSelf(1L));
    }

    @Test
    void isSelfIsFalseForForeignPrincipalTypes() {
        signIn("anonymousUser");
        assertFalse(new AccessChecker().isSelf(1L));
    }

    @Test
    void isSelfIsFalseForAccountWithoutStudent() {
        signIn(new AppUserDetails(user(Role.ADMIN, null)));
        assertFalse(new AccessChecker().isSelf(1L));
    }

    @Test
    void isSelfComparesStudentIds() {
        signIn(new AppUserDetails(user(Role.USER, 1L)));
        assertTrue(new AccessChecker().isSelf(1L));
        assertFalse(new AccessChecker().isSelf(2L));
    }

    // ---- DataInitializer ---------------------------------------------------------------------

    @Test
    void initializerCreatesAdminOnce() {
        UserRepository users = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(encoder.encode("pw")).thenReturn("HASH");
        when(users.existsByUsernameIgnoreCase(" Admin ")).thenReturn(false);
        new DataInitializer(users, encoder, " Admin ", "pw").run();

        org.mockito.ArgumentCaptor<User> saved = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertEquals("admin", saved.getValue().getUsername());
        assertEquals("HASH", saved.getValue().getPasswordHash());
        assertEquals(Role.ADMIN, saved.getValue().getRole());
        assertNull(saved.getValue().getStudent());
    }

    @Test
    void initializerSkipsWhenAdminExists() {
        UserRepository users = mock(UserRepository.class);
        when(users.existsByUsernameIgnoreCase("admin")).thenReturn(true);
        new DataInitializer(users, mock(PasswordEncoder.class), "admin", "pw").run();
        verify(users, never()).save(any());
    }

    // ---- CsrfCookieFilter --------------------------------------------------------------------

    @Test
    void csrfFilterTouchesTheTokenAndContinues() throws Exception {
        CsrfToken token = mock(CsrfToken.class);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute(CsrfToken.class.getName(), token);
        MockFilterChain chain = new MockFilterChain();
        new CsrfCookieFilter().doFilter(request, new MockHttpServletResponse(), chain);
        verify(token).getToken();
        assertNotNull(chain.getRequest());
    }

    @Test
    void csrfFilterToleratesMissingToken() throws Exception {
        MockFilterChain chain = new MockFilterChain();
        new CsrfCookieFilter().doFilter(new MockHttpServletRequest(), new MockHttpServletResponse(), chain);
        assertNotNull(chain.getRequest());
    }
}
