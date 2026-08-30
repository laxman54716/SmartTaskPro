package com.smarttask.pro.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    @Test
    @DisplayName("Valid Base64 secret key with >= 256 bits (32 bytes) passes validation")
    void validateSecretKey_Valid32ByteKey_Success() {
        JwtService jwtService = new JwtService();
        // 32 bytes encoded in Base64: 44 characters
        String validSecret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
        ReflectionTestUtils.setField(jwtService, "secretKey", validSecret);

        assertDoesNotThrow(jwtService::validateSecretKey);
    }

    @Test
    @DisplayName("Weak secret key with < 256 bits (32 bytes) throws IllegalStateException on startup")
    void validateSecretKey_WeakSecret_ThrowsException() {
        JwtService jwtService = new JwtService();
        // "weaksecret" is only 10 bytes long
        ReflectionTestUtils.setField(jwtService, "secretKey", "weaksecret");

        IllegalStateException ex = assertThrows(IllegalStateException.class, jwtService::validateSecretKey);
        assertTrue(ex.getMessage().contains("must be at least 256 bits"));
    }

    @Test
    @DisplayName("Null or empty secret key throws IllegalStateException on startup")
    void validateSecretKey_EmptySecret_ThrowsException() {
        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", "   ");

        IllegalStateException ex = assertThrows(IllegalStateException.class, jwtService::validateSecretKey);
        assertTrue(ex.getMessage().contains("missing or empty"));
    }
}
