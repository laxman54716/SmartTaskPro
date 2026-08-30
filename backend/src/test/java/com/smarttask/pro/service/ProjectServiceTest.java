package com.smarttask.pro.service;

import com.smarttask.pro.model.entity.Project;
import com.smarttask.pro.model.entity.Task;
import com.smarttask.pro.model.entity.User;
import com.smarttask.pro.model.enums.Role;
import com.smarttask.pro.repository.ProjectRepository;
import com.smarttask.pro.repository.SubtaskRepository;
import com.smarttask.pro.repository.TaskRepository;
import com.smarttask.pro.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private SubtaskRepository subtaskRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProjectService projectService;

    private User userA;
    private Project projectA;
    private Task taskA;

    @BeforeEach
    void setUp() {
        userA = User.builder().id(101L).username("userA").role(Role.ROLE_USER).build();
        projectA = Project.builder().id(201L).name("Project A").owner(userA).build();
        taskA = Task.builder().id(301L).title("Task A").project(projectA).reporter(userA).build();
    }

    @Test
    @DisplayName("Project Deletion Transactionality: Failure during subtask deletion throws exception and prevents project deletion")
    void deleteProject_FailureDuringCascade_ThrowsExceptionAndAborts() {
        when(projectRepository.findById(201L)).thenReturn(Optional.of(projectA));
        when(userRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(taskRepository.findByProjectId(201L)).thenReturn(List.of(taskA));

        // Mock failure during subtask deletion
        doThrow(new RuntimeException("Database error during subtask deletion"))
                .when(subtaskRepository).deleteByTaskId(301L);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> projectService.deleteProject(201L, "userA"));
        assertEquals("Database error during subtask deletion", ex.getMessage());

        // Verify projectRepository.deleteById was NEVER called because cascade failed halfway
        verify(projectRepository, never()).deleteById(201L);
    }
}
