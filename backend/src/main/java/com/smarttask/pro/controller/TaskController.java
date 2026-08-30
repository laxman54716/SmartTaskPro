package com.smarttask.pro.controller;

import com.smarttask.pro.dto.request.SubtaskRequest;
import com.smarttask.pro.dto.request.TaskRequest;
import com.smarttask.pro.dto.response.SubtaskResponse;
import com.smarttask.pro.dto.response.TaskResponse;
import com.smarttask.pro.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(
            @Valid @RequestBody TaskRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(request, username));
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(taskService.getAllTasks(username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable Long id, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(taskService.getTaskById(id, username));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long id,
            @RequestBody TaskRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return ResponseEntity.ok(taskService.updateTask(id, request, username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id, Authentication authentication) {
        String username = authentication.getName();
        taskService.deleteTask(id, username);
        return ResponseEntity.noContent().build();
    }

    // ── Subtask Endpoints ──────────────────────────────────────────

    @PostMapping("/{taskId}/subtasks")
    public ResponseEntity<SubtaskResponse> addSubtask(
            @PathVariable Long taskId,
            @Valid @RequestBody SubtaskRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.addSubtask(taskId, request, username));
    }

    @GetMapping("/{taskId}/subtasks")
    public ResponseEntity<List<SubtaskResponse>> getSubtasks(@PathVariable Long taskId, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(taskService.getSubtasksByTaskId(taskId, username));
    }

    @PutMapping("/{taskId}/subtasks/{subtaskId}")
    public ResponseEntity<SubtaskResponse> updateSubtask(
            @PathVariable Long taskId,
            @PathVariable Long subtaskId,
            @RequestBody SubtaskRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return ResponseEntity.ok(taskService.updateSubtask(taskId, subtaskId, request, username));
    }

    @PutMapping("/{taskId}/subtasks/{subtaskId}/toggle")
    public ResponseEntity<TaskResponse> toggleSubtask(
            @PathVariable Long taskId,
            @PathVariable Long subtaskId,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return ResponseEntity.ok(taskService.toggleSubtask(taskId, subtaskId, username));
    }

    @DeleteMapping("/{taskId}/subtasks/{subtaskId}")
    public ResponseEntity<Void> deleteSubtask(
            @PathVariable Long taskId,
            @PathVariable Long subtaskId,
            Authentication authentication
    ) {
        String username = authentication.getName();
        taskService.deleteSubtask(taskId, subtaskId, username);
        return ResponseEntity.noContent().build();
    }
}
