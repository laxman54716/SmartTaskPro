package com.smarttask.pro.dto.response;

import com.smarttask.pro.model.enums.TaskPriority;
import com.smarttask.pro.model.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
    
    private Long id;
    private String title;
    private String description;
    private TaskPriority priority;
    private TaskStatus status;
    private String category;
    private LocalDateTime dueDate;
    private Integer estimatedHours;
    private Integer actualHours;
    private Integer aiPriorityScore;
    private String tags;
    private Long projectId;
    private Long assigneeId;
    private Long reporterId;
    private LocalDateTime createdAt;
}
