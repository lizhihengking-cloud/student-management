package com.example.sms.service;

import com.example.sms.dto.RegisterRequest;
import com.example.sms.dto.StudentRequest;
import com.example.sms.exception.ConflictException;
import com.example.sms.model.Role;
import com.example.sms.model.Student;
import com.example.sms.model.User;
import com.example.sms.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {
    private final UserRepository users;
    private final StudentService students;
    private final PasswordEncoder encoder;

    public AuthService(UserRepository users, StudentService students, PasswordEncoder encoder) {
        this.users = users;
        this.students = students;
        this.encoder = encoder;
    }

    /** Self-registration: always creates a plain USER together with their own student profile. */
    public User register(RegisterRequest req) {
        String username = req.getEmail().trim().toLowerCase();
        if (users.existsByUsernameIgnoreCase(username))
            throw new ConflictException("An account with email '" + username + "' already exists");

        StudentRequest profile = new StudentRequest();
        profile.setFirstName(req.getFirstName());
        profile.setLastName(req.getLastName());
        profile.setEmail(req.getEmail());
        profile.setDateOfBirth(req.getDateOfBirth());
        Student student = students.create(profile); // also rejects an email that already has a student record

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(encoder.encode(req.getPassword()));
        user.setRole(Role.USER);
        user.setStudent(student);
        return users.save(user);
    }
}
