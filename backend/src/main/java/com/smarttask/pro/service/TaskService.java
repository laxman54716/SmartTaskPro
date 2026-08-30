package com.smarttask.pro.service;

import com.smarttask.pro.dto.request.SubtaskRequest;
import com.smarttask.pro.dto.request.TaskRequest;
import com.smarttask.pro.dto.response.SubtaskResponse;
import com.smarttask.pro.dto.response.TaskResponse;
import com.smarttask.pro.exception.ForbiddenException;
import com.smarttask.pro.exception.ResourceNotFoundException;
import com.smarttask.pro.model.entity.Project;
import com.smarttask.pro.model.entity.Subtask;
import com.smarttask.pro.model.entity.Task;
import com.smarttask.pro.model.entity.User;
import com.smarttask.pro.model.enums.Role;
import com.smarttask.pro.model.enums.TaskPriority;
import com.smarttask.pro.model.enums.TaskStatus;
import com.smarttask.pro.repository.ProjectRepository;
import com.smarttask.pro.repository.SubtaskRepository;
import com.smarttask.pro.repository.TaskRepository;
import com.smarttask.pro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final SubtaskRepository subtaskRepository;
    private final ProjectService projectService;

    @Transactional
    public TaskResponse createTask(TaskRequest request, String reporterUsername) {
        User reporter = userRepository.findByUsername(reporterUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Reporter not found: " + reporterUsername));

        Project project = null;
        if (request.getProjectId() != null) {
            project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));
            if (reporter.getRole() != Role.ROLE_ADMIN && !project.getOwner().getId().equals(reporter.getId())) {
                throw new ForbiddenException("You do not have permission to attach tasks to this project");
            }
        }
        if (project == null) {
            project = projectService.getOrCreateDefaultProject(reporter);
        }

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found with id: " + request.getAssigneeId()));
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.BACKLOG)
                .category(request.getCategory())
                .dueDate(request.getDueDate())
                .estimatedHours(request.getEstimatedHours())
                .tags(request.getTags())
                .project(project)
                .assignee(assignee)
                .reporter(reporter)
                .build();

        task = taskRepository.save(task);

        if (request.getSubtasks() != null && !request.getSubtasks().isEmpty()) {
            for (SubtaskRequest stReq : request.getSubtasks()) {
                Subtask subtask = Subtask.builder()
                        .title(stReq.getTitle())
                        .done(Boolean.TRUE.equals(stReq.getDone()))
                        .task(task)
                        .build();
                subtaskRepository.save(subtask);
            }
        }

        return mapToResponse(task);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasks(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getRole() == Role.ROLE_ADMIN) {
            return taskRepository.findAll().stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }

        return taskRepository.findByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TaskResponse getTaskById(Long id, String username) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        checkAuthorization(task, user, "view");

        return mapToResponse(task);
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskRequest request, String username) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        checkAuthorization(task, user, "update");

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getCategory() != null) task.setCategory(request.getCategory());
        if (request.getEstimatedHours() != null) task.setEstimatedHours(request.getEstimatedHours());
        if (request.getTags() != null) task.setTags(request.getTags());

        if (request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));
            if (user.getRole() != Role.ROLE_ADMIN && !project.getOwner().getId().equals(user.getId())) {
                throw new ForbiddenException("You do not have permission to move tasks to this project");
            }
            task.setProject(project);
        }

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found with id: " + request.getAssigneeId()));
            task.setAssignee(assignee);
        }

        task = taskRepository.save(task);
        return mapToResponse(task);
    }

    @Transactional
    public void deleteTask(Long id, String username) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        checkAuthorization(task, user, "delete");

        subtaskRepository.deleteByTaskId(id);
        taskRepository.deleteById(id);
    }

    // ── Subtask Methods ───────────────────────────────────────────

    public SubtaskResponse addSubtask(Long taskId, SubtaskRequest request, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        checkAuthorization(task, user, "add subtasks to");

        Subtask subtask = Subtask.builder()
                .title(request.getTitle())
                .done(Boolean.TRUE.equals(request.getDone()))
                .task(task)
                .build();

        subtask = subtaskRepository.save(subtask);
        return mapSubtaskToResponse(subtask);
    }

    public List<SubtaskResponse> getSubtasksByTaskId(Long taskId, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        checkAuthorization(task, user, "view subtasks of");

        return subtaskRepository.findByTaskId(taskId).stream()
                .map(this::mapSubtaskToResponse)
                .collect(Collectors.toList());
    }

    public SubtaskResponse updateSubtask(Long taskId, Long subtaskId, SubtaskRequest request, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        checkAuthorization(task, user, "update subtasks of");

        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found with id: " + subtaskId));

        if (!subtask.getTask().getId().equals(taskId)) {
            throw new ResourceNotFoundException("Subtask " + subtaskId + " does not belong to Task " + taskId);
        }

        if (request.getTitle() != null) subtask.setTitle(request.getTitle());
        if (request.getDone() != null) subtask.setDone(request.getDone());

        subtask = subtaskRepository.save(subtask);
        return mapSubtaskToResponse(subtask);
    }

    public TaskResponse toggleSubtask(Long taskId, Long subtaskId, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        checkAuthorization(task, user, "toggle subtasks of");

        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found with id: " + subtaskId));

        if (!subtask.getTask().getId().equals(taskId)) {
            throw new ResourceNotFoundException("Subtask " + subtaskId + " does not belong to Task " + taskId);
        }

        subtask.setDone(!subtask.isDone());
        subtaskRepository.save(subtask);

        return mapToResponse(task);
    }

    public void deleteSubtask(Long taskId, Long subtaskId, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        checkAuthorization(task, user, "delete subtasks of");

        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found with id: " + subtaskId));

        if (!subtask.getTask().getId().equals(taskId)) {
            throw new ResourceNotFoundException("Subtask " + subtaskId + " does not belong to Task " + taskId);
        }

        subtaskRepository.deleteById(subtaskId);
    }

    private void checkAuthorization(Task task, User user, String action) {
        if (user.getRole() != Role.ROLE_ADMIN &&
            !task.getReporter().getId().equals(user.getId()) &&
            (task.getAssignee() == null || !task.getAssignee().getId().equals(user.getId())) &&
            (task.getProject() == null || !task.getProject().getOwner().getId().equals(user.getId()))) {
            throw new ForbiddenException("You do not have permission to " + action + " this task");
        }
    }

    private TaskResponse mapToResponse(Task task) {
        List<SubtaskResponse> subtasks = subtaskRepository.findByTaskId(task.getId()).stream()
                .map(this::mapSubtaskToResponse)
                .collect(Collectors.toList());

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .priority(task.getPriority())
                .status(task.getStatus())
                .category(task.getCategory())
                .dueDate(task.getDueDate())
                .estimatedHours(task.getEstimatedHours())
                .actualHours(task.getActualHours())
                .aiPriorityScore(task.getAiPriorityScore())
                .tags(task.getTags())
                .projectId(task.getProject() != null ? task.getProject().getId() : null)
                .assigneeId(task.getAssignee() != null ? task.getAssignee().getId() : null)
                .reporterId(task.getReporter() != null ? task.getReporter().getId() : null)
                .createdAt(task.getCreatedAt())
                .subtasks(subtasks)
                .build();
    }

    private SubtaskResponse mapSubtaskToResponse(Subtask subtask) {
        return SubtaskResponse.builder()
                .id(subtask.getId())
                .title(subtask.getTitle())
                .done(subtask.isDone())
                .build();
    }
}
