package com.smarttask.pro;

import com.smarttask.pro.dto.request.LoginRequest;
import com.smarttask.pro.dto.request.RegisterRequest;
import com.smarttask.pro.dto.response.AuthResponse;
import com.smarttask.pro.exception.ConflictException;
import com.smarttask.pro.model.entity.Project;
import com.smarttask.pro.model.entity.User;
import com.smarttask.pro.model.enums.Role;
import com.smarttask.pro.repository.UserRepository;
import com.smarttask.pro.security.JwtService;
import com.smarttask.pro.service.AuthService;
import com.smarttask.pro.service.ProjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private ProjectService projectService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
                .username("testuser")
                .email("test@example.com")
                .password("Password123!")
                .build();
    }

    @Test
    void register_Success() {
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        
        User savedUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .password("hashedPassword")
                .role(Role.ROLE_USER)
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(projectService.getOrCreateDefaultProject(any(User.class)))
                .thenReturn(Project.builder().id(1L).name("Default Project").owner(savedUser).build());
        when(jwtService.generateToken(any(User.class))).thenReturn("fake-jwt-token");

        AuthResponse response = authService.register(registerRequest);

        assertNotNull(response);
        assertEquals("testuser", response.getUsername());
        assertEquals("fake-jwt-token", response.getToken());
        verify(userRepository, times(1)).save(any(User.class));
        verify(projectService, times(1)).getOrCreateDefaultProject(any(User.class));
    }

    @Test
    void register_DuplicateUsername_ThrowsConflictException() {
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        assertThrows(ConflictException.class, () -> authService.register(registerRequest));
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_Success() {
        LoginRequest loginRequest = new LoginRequest("testuser", "Password123!");
        User user = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .role(Role.ROLE_USER)
                .build();

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("valid-jwt");

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("valid-jwt", response.getToken());
        assertEquals("testuser", response.getUsername());
    }
}
