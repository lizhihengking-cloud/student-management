package com.example.sms.exception;

import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    private void check(ResponseEntity<ApiError> r, HttpStatus status, String message) {
        assertEquals(status, r.getStatusCode());
        ApiError body = r.getBody();
        assertNotNull(body);
        assertEquals(status.value(), body.getStatus());
        assertEquals(status.getReasonPhrase(), body.getError());
        assertEquals(message, body.getMessage());
        assertNotNull(body.getTimestamp());
    }

    @Test
    void notFound() {
        check(handler.notFound(new NotFoundException("gone")), HttpStatus.NOT_FOUND, "gone");
    }

    @Test
    void conflict() {
        check(handler.conflict(new ConflictException("dup")), HttpStatus.CONFLICT, "dup");
    }

    @Test
    void integrityViolation() {
        check(handler.integrity(new DataIntegrityViolationException("x")), HttpStatus.CONFLICT,
                "The request conflicts with existing data");
    }

    @Test
    void validationCollectsFirstMessagePerField() throws Exception {
        BeanPropertyBindingResult result = new BeanPropertyBindingResult(new Object(), "obj");
        result.rejectValue(null, "x", "global ignored"); // object-level error is not a field error
        result.addError(new org.springframework.validation.FieldError("obj", "email", "Email must be valid"));
        result.addError(new org.springframework.validation.FieldError("obj", "email", "second message"));
        result.addError(new org.springframework.validation.FieldError("obj", "name", "Name is required"));
        MethodParameter param = new MethodParameter(GlobalExceptionHandlerTest.class.getDeclaredMethod("notFound"), -1);

        ResponseEntity<ApiError> r = handler.validation(new MethodArgumentNotValidException(param, result));

        check(r, HttpStatus.BAD_REQUEST, "Validation failed");
        assertEquals(2, r.getBody().getFieldErrors().size());
        assertEquals("Email must be valid", r.getBody().getFieldErrors().get("email"));
        assertEquals("Name is required", r.getBody().getFieldErrors().get("name"));
    }

    @Test
    void malformedRequests() {
        check(handler.badRequest(new HttpMessageNotReadableException("bad", (HttpInputMessage) null)),
                HttpStatus.BAD_REQUEST, "Malformed request");
        check(handler.badRequest(new MethodArgumentTypeMismatchException("x", Long.class, "id", null, null)),
                HttpStatus.BAD_REQUEST, "Malformed request");
    }

    @Test
    void methodNotAllowed() {
        HttpRequestMethodNotSupportedException e = new HttpRequestMethodNotSupportedException("PATCH");
        check(handler.methodNotAllowed(e), HttpStatus.METHOD_NOT_ALLOWED, e.getMessage());
    }

    @Test
    void noHandler() {
        check(handler.noHandler(new NoHandlerFoundException("GET", "/nope", null)), HttpStatus.NOT_FOUND, "Resource not found");
    }

    @Test
    void authenticationFailureIsUnauthorizedWithGenericMessage() {
        check(handler.badCredentials(new BadCredentialsException("secret detail")), HttpStatus.UNAUTHORIZED,
                "Invalid email or password");
    }

    @Test
    void accessDeniedIsForbidden() {
        check(handler.forbidden(new AccessDeniedException("no")), HttpStatus.FORBIDDEN,
                "You do not have permission to do that");
    }

    @Test
    void unexpectedErrorsDoNotLeakDetails() {
        check(handler.unexpected(new IllegalStateException("db password is hunter2")),
                HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    }
}
