package com.smarttask.pro;

import com.smarttask.pro.dto.request.RegisterRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void registerRequest_WeakPassword_ViolatesConstraint() {
        RegisterRequest req = RegisterRequest.builder()
                .username("validuser")
                .email("user@test.com")
                .password("12345") // Only 5 chars
                .build();

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(req);
        assertFalse(violations.isEmpty(), "Password under 8 characters should fail validation");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("password")));
    }

    @Test
    void registerRequest_ValidPassword8Chars_Passes() {
        RegisterRequest req = RegisterRequest.builder()
                .username("validuser")
                .email("user@test.com")
                .password("12345678") // Exactly 8 chars
                .build();

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(req);
        assertTrue(violations.isEmpty(), "Valid 8-character password should pass validation");
    }

    @Test
    void registerRequest_InvalidEmail_ViolatesConstraint() {
        RegisterRequest req = RegisterRequest.builder()
                .username("validuser")
                .email("invalid-email")
                .password("Password123!")
                .build();

        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(req);
        assertFalse(violations.isEmpty(), "Invalid email format should fail validation");
    }
}
