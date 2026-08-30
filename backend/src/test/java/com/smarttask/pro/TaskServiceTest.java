package com.smarttask.pro;

import com.smarttask.pro.dto.request.TaskRequest;
import com.smarttask.pro.dto.response.TaskResponse;
import com.smarttask.pro.exception.ForbiddenException;
import com.smarttask.pro.exception.ResourceNotFoundException;
import com.smarttask.pro.model.entity.Project;
import com.smarttask.pro.model.entity.Task;
import com.smarttask.pro.model.entity.User;
import com.smarttask.pro.model.enums.Role;
import com.smarttask.pro.model.enums.TaskPriority;
import com.smarttask.pro.model.enums.TaskStatus;
import com.smarttask.pro.repository.ProjectRepository;
import com.smarttask.pro.repository.SubtaskRepository;
import com.smarttask.pro.repository.TaskRepository;
import com.smarttask.pro.repository.UserRepository;
import com.smarttask.pro.service.ProjectService;
import com.smarttask.pro.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SubtaskRepository subtaskRepository;
    @Mock
    private ProjectService projectService;

    @InjectMocks
    private TaskService taskService;

    private User user;
    private Project project;
    private Task task;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).username("owner").email("owner@test.com").role(Role.ROLE_USER).build();
        project = Project.builder().id(1L).name("Test Project").owner(user).build();
        task = Task.builder()
                .id(100L)
                .title("Test Task")
                .description("Desc")
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .project(project)
                .reporter(user)
                .build();
    }

    @Test
    void createTask_Success() {
        TaskRequest request = TaskRequest.builder()
                .title("New Task")
                .projectId(1L)
                .priority(TaskPriority.MEDIUM)
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        TaskResponse response = taskService.createTask(request, "owner");

        assertNotNull(response);
        assertEquals("Test Task", response.getTitle());
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    void getTaskById_NotFound_ThrowsResourceNotFoundException() {
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> taskService.getTaskById(999L, "owner"));
    }

    @Test
    void deleteTask_ForbiddenUser_ThrowsForbiddenException() {
        User stranger = User.builder().id(2L).username("stranger").role(Role.ROLE_USER).build();

        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(userRepository.findByUsername("stranger")).thenReturn(Optional.of(stranger));

        assertThrows(ForbiddenException.class, () -> taskService.deleteTask(100L, "stranger"));
    }

    @Test
    void deleteTask_Owner_Success() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(user));

        taskService.deleteTask(100L, "owner");

        verify(taskRepository, times(1)).deleteById(100L);
    }
}
