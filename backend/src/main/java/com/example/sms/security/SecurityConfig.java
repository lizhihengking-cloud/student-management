package com.example.sms.security;

import com.example.sms.exception.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * URL protection. Session-cookie authentication (JSESSIONID, HttpOnly) with CSRF protection via the
 * XSRF-TOKEN cookie / X-XSRF-TOKEN header pair that Angular's HttpClient uses out of the box.
 * Finer per-record rules (a user may only touch their own student) live in {@code @PreAuthorize} on the controllers.
 */
@Configuration
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() { return new HttpSessionSecurityContextRepository(); }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, ObjectMapper mapper) throws Exception {
        http
            .cors().and()
            .csrf().csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()).and()
            .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED).and()
            .securityContext().requireExplicitSave(true).and()
            .authorizeRequests()
                .mvcMatchers("/api/auth/register", "/api/auth/login").permitAll()
                .mvcMatchers(HttpMethod.GET, "/api/courses", "/api/courses/*").authenticated()
                .mvcMatchers("/api/courses/**").hasRole("ADMIN")
                .mvcMatchers("/api/students").hasRole("ADMIN")
                .mvcMatchers(HttpMethod.DELETE, "/api/students/*").hasRole("ADMIN")
                .mvcMatchers("/api/**").authenticated()
                .anyRequest().denyAll()
                .and()
            .logout()
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT))
                .deleteCookies("JSESSIONID")
                .and()
            .exceptionHandling()
                .authenticationEntryPoint((req, res, e) -> writeError(mapper, res, HttpStatus.UNAUTHORIZED, "Please sign in"))
                .accessDeniedHandler((req, res, e) -> writeError(mapper, res, HttpStatus.FORBIDDEN, "You do not have permission to do that"));
        return http.build();
    }

    private static void writeError(ObjectMapper mapper, HttpServletResponse res, HttpStatus status, String message) throws IOException {
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(res.getOutputStream(), new ApiError(status.value(), status.getReasonPhrase(), message, null));
    }
}
