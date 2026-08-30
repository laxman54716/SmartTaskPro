package com.smarttask.pro.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubtaskRequest {

    @NotBlank(message = "Subtask title is required")
    private String title;

    private Boolean done;
}
