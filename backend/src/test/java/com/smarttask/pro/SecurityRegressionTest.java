package com.smarttask.pro;

import com.smarttask.pro.dto.request.SubtaskRequest;
import com.smarttask.pro.dto.request.TaskRequest;
import com.smarttask.pro.dto.response.ProjectResponse;
import com.smarttask.pro.dto.response.TaskResponse;
import com.smarttask.pro.exception.ForbiddenException;
import com.smarttask.pro.exception.ResourceNotFoundException;
import com.smarttask.pro.model.entity.Project;
import com.smarttask.pro.model.entity.Subtask;
import com.smarttask.pro.model.entity.Task;
import com.smarttask.pro.model.entity.User;
import com.smarttask.pro.model.enums.Role;
import com.smarttask.pro.repository.ProjectRepository;
import com.smarttask.pro.repository.SubtaskRepository;
import com.smarttask.pro.repository.TaskRepository;
import com.smarttask.pro.repository.UserRepository;
import com.smarttask.pro.service.ProjectService;
import com.smarttask.pro.service.TaskService;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityRegressionTest {

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
    @InjectMocks
    private TaskService taskService;

    private User userA;
    private User userB;
    private User adminUser;
    private Project projectA;
    private Task taskA;
    private Task taskB;
    private Subtask subtaskA;
    private Subtask subtaskB;

    @BeforeEach
    void setUp() {
        userA = User.builder().id(101L).username("userA").email("userA@test.com").role(Role.ROLE_USER).build();
        userB = User.builder().id(102L).username("userB").email("userB@test.com").role(Role.ROLE_USER).build();
        adminUser = User.builder().id(999L).username("adminUser").email("admin@test.com").role(Role.ROLE_ADMIN).build();

        projectA = Project.builder().id(201L).name("Project A").owner(userA).build();
        taskA = Task.builder().id(301L).title("Task A").project(projectA).reporter(userA).build();
        taskB = Task.builder().id(302L).title("Task B").reporter(userB).build();
        subtaskA = Subtask.builder().id(401L).title("Subtask A").task(taskA).done(false).build();
        subtaskB = Subtask.builder().id(402L).title("Subtask B").task(taskB).done(false).build();
    }

    // ── PROJECT AUTHORIZATION ─────────────────────────────────────

    @Test
    @DisplayName("Project IDOR: User B cannot GET User A's private project by ID")
    void getProjectById_UserB_Forbidden() {
        when(projectRepository.findById(201L)).thenReturn(Optional.of(projectA));
        when(userRepository.findByUsername("userB")).thenReturn(Optional.of(userB));

        assertThrows(ForbiddenException.class, () -> projectService.getProjectById(201L, "userB"));
    }

    @Test
    @DisplayName("Project Isolation: GET all projects returns only projects owned by user")
    void getAllProjects_UserB_ReturnsOnlyUserBProjects() {
        Project projectB = Project.builder().id(202L).name("Project B").owner(userB).build();

        when(userRepository.findByUsername("userB")).thenReturn(Optional.of(userB));
        when(projectRepository.findByOwnerId(102L)).thenReturn(List.of(projectB));

        var results = projectService.getAllProjects("userB");
        assertEquals(1, results.size());
        assertEquals("Project B", results.get(0).getName());
    }

    @Test
    @DisplayName("Admin Authorization: Admin can view, list, and delete any user's project")
    void adminProjectAccess_Allowed() {
        when(userRepository.findByUsername("adminUser")).thenReturn(Optional.of(adminUser));
        when(projectRepository.findById(201L)).thenReturn(Optional.of(projectA));
        when(projectRepository.findAll()).thenReturn(List.of(projectA));

        // Get by ID
        ProjectResponse pResp = projectService.getProjectById(201L, "adminUser");
        assertNotNull(pResp);
        assertEquals(201L, pResp.getId());

        // Get all
        List<ProjectResponse> allProjects = projectService.getAllProjects("adminUser");
        assertEquals(1, allProjects.size());

        // Delete
        when(taskRepository.findByProjectId(201L)).thenReturn(List.of());
        assertDoesNotThrow(() -> projectService.deleteProject(201L, "adminUser"));
        verify(projectRepository).deleteById(201L);
    }

    // ── TASK AUTHORIZATION ────────────────────────────────────────

    @Test
    @DisplayName("Task IDOR: User B cannot GET User A's task by ID")
    void getTaskById_UserB_Forbidden() {
        when(taskRepository.findById(301L)).thenReturn(Optional.of(taskA));
        when(userRepository.findByUsername("userB")).thenReturn(Optional.of(userB));

        assertThrows(ForbiddenException.class, () -> taskService.getTaskById(301L, "userB"));
    }

    @Test
    @DisplayName("Admin Authorization: Admin can view, list, update, and delete any task")
    void adminTaskAccess_Allowed() {
        when(userRepository.findByUsername("adminUser")).thenReturn(Optional.of(adminUser));
        when(taskRepository.findById(301L)).thenReturn(Optional.of(taskA));
        when(taskRepository.findAll()).thenReturn(List.of(taskA));

        // Get by ID
        TaskResponse tResp = taskService.getTaskById(301L, "adminUser");
        assertNotNull(tResp);

        // Get all
        List<TaskResponse> allTasks = taskService.getAllTasks("adminUser");
        assertEquals(1, allTasks.size());

        // Delete task
        assertDoesNotThrow(() -> taskService.deleteTask(301L, "adminUser"));
        verify(taskRepository).deleteById(301L);
    }

    // ── SUBTASK MISMATCH ATTACK TESTS ─────────────────────────────

    @Test
    @DisplayName("Subtask Mismatch Attack 1: Updating Subtask A passing Task B's ID throws ResourceNotFoundException")
    void subtaskMismatch_updateSubtask_throwsResourceNotFoundException() {
        when(taskRepository.findById(302L)).thenReturn(Optional.of(taskB));
        when(userRepository.findByUsername("userB")).thenReturn(Optional.of(userB));
        when(subtaskRepository.findById(401L)).thenReturn(Optional.of(subtaskA));

        SubtaskRequest req = SubtaskRequest.builder().title("Updated").build();
        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> taskService.updateSubtask(302L, 401L, req, "userB"));

        assertTrue(ex.getMessage().contains("does not belong to Task"));
    }

    @Test
    @DisplayName("Subtask Mismatch Attack 2: Toggling Subtask A passing Task B's ID throws ResourceNotFoundException")
    void subtaskMismatch_toggleSubtask_throwsResourceNotFoundException() {
        when(taskRepository.findById(302L)).thenReturn(Optional.of(taskB));
        when(userRepository.findByUsername("userB")).thenReturn(Optional.of(userB));
        when(subtaskRepository.findById(401L)).thenReturn(Optional.of(subtaskA));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> taskService.toggleSubtask(302L, 401L, "userB"));

        assertTrue(ex.getMessage().contains("does not belong to Task"));
    }

    @Test
    @DisplayName("Subtask Mismatch Attack 3: Deleting Subtask A passing Task B's ID throws ResourceNotFoundException")
    void subtaskMismatch_deleteSubtask_throwsResourceNotFoundException() {
        when(taskRepository.findById(302L)).thenReturn(Optional.of(taskB));
        when(userRepository.findByUsername("userB")).thenReturn(Optional.of(userB));
        when(subtaskRepository.findById(401L)).thenReturn(Optional.of(subtaskA));

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> taskService.deleteSubtask(302L, 401L, "userB"));

        assertTrue(ex.getMessage().contains("does not belong to Task"));
    }

    @Test
    @DisplayName("Subtask Mismatch Attack 4: Non-owner User B accessing User A's task throws ForbiddenException before subtask lookup")
    void subtaskMismatch_nonOwner_throwsForbiddenException() {
        when(taskRepository.findById(301L)).thenReturn(Optional.of(taskA));
        when(userRepository.findByUsername("userB")).thenReturn(Optional.of(userB));

        assertThrows(ForbiddenException.class,
                () -> taskService.updateSubtask(301L, 402L, SubtaskRequest.builder().title("Injected").build(), "userB"));

        assertThrows(ForbiddenException.class,
                () -> taskService.toggleSubtask(301L, 402L, "userB"));

        assertThrows(ForbiddenException.class,
                () -> taskService.deleteSubtask(301L, 402L, "userB"));
    }

    // ── TASK QUERY SEMANTICS & CROSS-TENANT INTEGRITY ─────────────

    @Test
    @DisplayName("Cross-Tenant Injection: User B cannot attach a new task to User A's project")
    void createTask_UserBUsingUserAProject_Forbidden() {
        TaskRequest req = TaskRequest.builder().title("Injected Task").projectId(201L).build();

        when(userRepository.findByUsername("userB")).thenReturn(Optional.of(userB));
        when(projectRepository.findById(201L)).thenReturn(Optional.of(projectA));

        assertThrows(ForbiddenException.class, () -> taskService.createTask(req, "userB"));
        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("Task Query Semantics: findByUserId returns tasks where user is reporter, assignee, or project owner")
    void findByUserId_Semantics_ReturnsMatchingTasksOnly() {
        // User A is reporter of taskA
        Task taskAssignee = Task.builder().id(303L).title("Assigned Task").assignee(userA).reporter(userB).build();
        Task taskProjOwner = Task.builder().id(304L).title("Project Task").project(projectA).reporter(userB).build();

        when(userRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(taskRepository.findByUserId(101L)).thenReturn(List.of(taskA, taskAssignee, taskProjOwner));

        List<TaskResponse> tasks = taskService.getAllTasks("userA");
        assertEquals(3, tasks.size());
        verify(taskRepository).findByUserId(101L);
    }

    @Test
    @DisplayName("Cascade Delete Integrity: Deleting a project removes associated tasks and subtasks")
    void deleteProject_CascadesTasksAndSubtasks() {
        when(projectRepository.findById(201L)).thenReturn(Optional.of(projectA));
        when(userRepository.findByUsername("userA")).thenReturn(Optional.of(userA));
        when(taskRepository.findByProjectId(201L)).thenReturn(List.of(taskA));

        projectService.deleteProject(201L, "userA");

        verify(subtaskRepository, times(1)).deleteByTaskId(301L);
        verify(taskRepository, times(1)).deleteById(301L);
        verify(projectRepository, times(1)).deleteById(201L);
    }
}
