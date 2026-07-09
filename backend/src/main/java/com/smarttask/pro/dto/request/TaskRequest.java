package com.smarttask.pro.dto.request;

import com.smarttask.pro.model.enums.TaskPriority;
import com.smarttask.pro.model.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    
    private TaskPriority priority;
    
    private TaskStatus status;
    
    private String category;
    
    private LocalDateTime dueDate;
    
    private Integer estimatedHours;
    
    private String tags;
    
    @NotNull(message = "Project ID is required")
    private Long projectId;
    
    private Long assigneeId;
}
