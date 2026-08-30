package com.smarttask.pro.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RateLimitFilterTest {

    private RateLimitFilter rateLimitFilter;

    @BeforeEach
    void setUp() {
        rateLimitFilter = new RateLimitFilter();
        ReflectionTestUtils.setField(rateLimitFilter, "authLimit", 5);
        ReflectionTestUtils.setField(rateLimitFilter, "apiLimit", 50);
    }

    @Test
    @DisplayName("getClientIP extracts client IP from X-Forwarded-For header when present")
    void getClientIP_XForwardedFor() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("X-Forwarded-For", "203.0.113.195, 70.41.3.18, 150.172.238.178");
        req.setRemoteAddr("10.0.0.1");

        String ip = rateLimitFilter.getClientIP(req);
        assertEquals("203.0.113.195", ip);
    }

    @Test
    @DisplayName("getClientIP extracts client IP from X-Real-IP header when X-Forwarded-For is absent")
    void getClientIP_XRealIP() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("X-Real-IP", "198.51.100.42");
        req.setRemoteAddr("10.0.0.1");

        String ip = rateLimitFilter.getClientIP(req);
        assertEquals("198.51.100.42", ip);
    }

    @Test
    @DisplayName("getClientIP falls back to remoteAddr when no proxy headers exist")
    void getClientIP_FallbackRemoteAddr() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRemoteAddr("192.168.1.100");

        String ip = rateLimitFilter.getClientIP(req);
        assertEquals("192.168.1.100", ip);
    }

    @Test
    @DisplayName("Proxy IP separation: Different X-Forwarded-For IPs behind same proxy maintain separate buckets")
    void proxyIP_Separation() throws ServletException, IOException {
        FilterChain filterChain = mock(FilterChain.class);

        // Client A makes 5 auth requests
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest reqA = new MockHttpServletRequest();
            reqA.setRequestURI("/api/v1/auth/login");
            reqA.addHeader("X-Forwarded-For", "1.1.1.1");
            reqA.setRemoteAddr("10.0.0.1"); // Proxy IP
            MockHttpServletResponse resA = new MockHttpServletResponse();

            rateLimitFilter.doFilterInternal(reqA, resA, filterChain);
            assertEquals(200, resA.getStatus());
        }

        // 6th auth request for Client A is rate limited (429)
        MockHttpServletRequest reqA6 = new MockHttpServletRequest();
        reqA6.setRequestURI("/api/v1/auth/login");
        reqA6.addHeader("X-Forwarded-For", "1.1.1.1");
        reqA6.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse resA6 = new MockHttpServletResponse();
        rateLimitFilter.doFilterInternal(reqA6, resA6, filterChain);
        assertEquals(429, resA6.getStatus());

        // Client B behind SAME proxy IP (10.0.0.1) can still make requests because of X-Forwarded-For isolation
        MockHttpServletRequest reqB = new MockHttpServletRequest();
        reqB.setRequestURI("/api/v1/auth/login");
        reqB.addHeader("X-Forwarded-For", "2.2.2.2");
        reqB.setRemoteAddr("10.0.0.1"); // Proxy IP
        MockHttpServletResponse resB = new MockHttpServletResponse();

        rateLimitFilter.doFilterInternal(reqB, resB, filterChain);
        assertEquals(200, resB.getStatus());
    }
}
