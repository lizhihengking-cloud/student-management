package com.example.sms.security;

import com.example.sms.model.Role;
import com.example.sms.model.User;
import com.example.sms.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Seeds the administrator account on first start. */
@Component
public class DataInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String adminUsername;
    private final String adminPassword;

    public DataInitializer(UserRepository users, PasswordEncoder encoder,
                           @Value("${app.admin.username}") String adminUsername,
                           @Value("${app.admin.password}") String adminPassword) {
        this.users = users;
        this.encoder = encoder;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        if (users.existsByUsernameIgnoreCase(adminUsername)) return;
        User admin = new User();
        admin.setUsername(adminUsername.trim().toLowerCase());
        admin.setPasswordHash(encoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        users.save(admin);
        log.warn("Created admin account '{}'. Change app.admin.password for any non-local deployment.", adminUsername);
    }
}
