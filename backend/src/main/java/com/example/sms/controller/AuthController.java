package com.example.sms.controller;

import com.example.sms.dto.LoginRequest;
import com.example.sms.dto.RegisterRequest;
import com.example.sms.dto.UserResponse;
import com.example.sms.security.AppUserDetails;
import com.example.sms.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;

/** Register / login / current user. Logout is handled by Spring Security (POST /api/auth/logout). */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    private final AuthenticationManager authManager;
    private final SecurityContextRepository contextRepository;

    public AuthController(AuthService auth, AuthenticationManager authManager, SecurityContextRepository contextRepository) {
        this.auth = auth;
        this.authManager = authManager;
        this.contextRepository = contextRepository;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody RegisterRequest req) {
        auth.register(req);
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername().trim(), req.getPassword()));

        if (request.getSession(false) != null) request.changeSessionId(); // prevent session fixation
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);
        return UserResponse.from((AppUserDetails) authentication.getPrincipal());
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AppUserDetails user) {
        return UserResponse.from(user);
    }
}
