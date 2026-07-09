package com.smarttask.pro.service;

import com.smarttask.pro.dto.request.TaskRequest;
import com.smarttask.pro.dto.response.TaskResponse;
import com.smarttask.pro.model.entity.Project;
import com.smarttask.pro.model.entity.Task;
import com.smarttask.pro.model.entity.User;
import com.smarttask.pro.model.enums.Role;
import com.smarttask.pro.model.enums.TaskPriority;
import com.smarttask.pro.model.enums.TaskStatus;
import com.smarttask.pro.repository.ProjectRepository;
import com.smarttask.pro.repository.TaskRepository;
import com.smarttask.pro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public TaskResponse createTask(TaskRequest request, String reporterUsername) {
        User reporter = userRepository.findByUsername(reporterUsername)
                .orElseThrow(() -> new RuntimeException("Reporter not found"));
                
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
                
        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new RuntimeException("Assignee not found"));
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
        return mapToResponse(task);
    }

    public List<TaskResponse> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TaskResponse getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        return mapToResponse(task);
    }

    public TaskResponse updateTask(Long id, TaskRequest request, String username) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.ROLE_ADMIN &&
            !task.getReporter().getId().equals(user.getId()) &&
            (task.getAssignee() == null || !task.getAssignee().getId().equals(user.getId()))) {
            throw new RuntimeException("Forbidden: You do not have permission to update this task");
        }

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new RuntimeException("Assignee not found"));
            task.setAssignee(assignee);
        }

        task = taskRepository.save(task);
        return mapToResponse(task);
    }

    public void deleteTask(Long id, String username) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.ROLE_ADMIN &&
            !task.getReporter().getId().equals(user.getId()) &&
            (task.getAssignee() == null || !task.getAssignee().getId().equals(user.getId()))) {
            throw new RuntimeException("Forbidden: You do not have permission to delete this task");
        }
        
        taskRepository.deleteById(id);
    }

    private TaskResponse mapToResponse(Task task) {
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
                .projectId(task.getProject().getId())
                .assigneeId(task.getAssignee() != null ? task.getAssignee().getId() : null)
                .reporterId(task.getReporter().getId())
                .createdAt(task.getCreatedAt())
                .build();
    }
}
