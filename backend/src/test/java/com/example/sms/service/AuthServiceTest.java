package com.example.sms.service;

import com.example.sms.dto.RegisterRequest;
import com.example.sms.dto.StudentRequest;
import com.example.sms.exception.ConflictException;
import com.example.sms.model.Role;
import com.example.sms.model.Student;
import com.example.sms.model.User;
import com.example.sms.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UserRepository users;
    @Mock StudentService students;
    @Mock PasswordEncoder encoder;
    @InjectMocks AuthService service;

    private RegisterRequest request() {
        RegisterRequest r = new RegisterRequest();
        r.setFirstName("Ada");
        r.setLastName("Lovelace");
        r.setEmail("  Ada@Example.com ");
        r.setPassword("password123");
        r.setDateOfBirth(LocalDate.of(1990, 1, 1));
        return r;
    }

    @Test
    void registerCreatesStudentAndUserAccount() {
        Student student = new Student();
        when(users.existsByUsernameIgnoreCase("ada@example.com")).thenReturn(false);
        when(students.create(any(StudentRequest.class))).thenReturn(student);
        when(encoder.encode("password123")).thenReturn("HASH");
        when(users.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User user = service.register(request());

        assertEquals("ada@example.com", user.getUsername());
        assertEquals("HASH", user.getPasswordHash());
        assertEquals(Role.USER, user.getRole());
        assertSame(student, user.getStudent());

        ArgumentCaptor<StudentRequest> profile = ArgumentCaptor.forClass(StudentRequest.class);
        verify(students).create(profile.capture());
        assertEquals("Ada", profile.getValue().getFirstName());
        assertEquals("Lovelace", profile.getValue().getLastName());
        assertEquals("  Ada@Example.com ", profile.getValue().getEmail());
        assertEquals(LocalDate.of(1990, 1, 1), profile.getValue().getDateOfBirth());
    }

    @Test
    void registerRejectsExistingUsername() {
        when(users.existsByUsernameIgnoreCase("ada@example.com")).thenReturn(true);
        assertThrows(ConflictException.class, () -> service.register(request()));
        verify(students, never()).create(any());
        verify(users, never()).save(any());
    }
}
