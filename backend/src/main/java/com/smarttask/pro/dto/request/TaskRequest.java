package com.smarttask.pro.dto.request;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.smarttask.pro.dto.jackson.FlexibleLocalDateTimeDeserializer;
import com.smarttask.pro.model.enums.TaskPriority;
import com.smarttask.pro.model.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

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
    
    @JsonDeserialize(using = FlexibleLocalDateTimeDeserializer.class)
    private LocalDateTime dueDate;
    
    @jakarta.validation.constraints.Min(value = 0, message = "Estimated hours must be non-negative")
    private Integer estimatedHours;
    
    private String tags;
    
    private Long projectId;
    
    private Long assigneeId;

    private List<SubtaskRequest> subtasks;
}
