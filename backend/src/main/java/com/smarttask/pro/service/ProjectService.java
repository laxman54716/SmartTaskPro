package com.smarttask.pro.service;

import com.smarttask.pro.dto.request.ProjectRequest;
import com.smarttask.pro.dto.response.ProjectResponse;
import com.smarttask.pro.exception.ForbiddenException;
import com.smarttask.pro.exception.ResourceNotFoundException;
import com.smarttask.pro.model.entity.Project;
import com.smarttask.pro.model.entity.User;
import com.smarttask.pro.model.enums.Role;
import com.smarttask.pro.repository.ProjectRepository;
import com.smarttask.pro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import com.smarttask.pro.model.entity.Task;
import com.smarttask.pro.repository.SubtaskRepository;
import com.smarttask.pro.repository.TaskRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final SubtaskRepository subtaskRepository;

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, String ownerUsername) {
        User owner = userRepository.findByUsername(ownerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + ownerUsername));

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(owner)
                .build();

        project = projectRepository.save(project);
        return mapToResponse(project);
    }

    public List<ProjectResponse> getAllProjects(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getRole() == Role.ROLE_ADMIN) {
            return projectRepository.findAll().stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }

        return projectRepository.findByOwnerId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(Long id, String username) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getRole() != Role.ROLE_ADMIN && !project.getOwner().getId().equals(user.getId())) {
            throw new ForbiddenException("You do not have permission to view this project");
        }

        return mapToResponse(project);
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectRequest request, String username) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getRole() != Role.ROLE_ADMIN && !project.getOwner().getId().equals(user.getId())) {
            throw new ForbiddenException("You do not have permission to update this project");
        }

        if (request.getName() != null) project.setName(request.getName());
        if (request.getDescription() != null) project.setDescription(request.getDescription());

        project = projectRepository.save(project);
        return mapToResponse(project);
    }

    @Transactional
    public void deleteProject(Long id, String username) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getRole() != Role.ROLE_ADMIN && !project.getOwner().getId().equals(user.getId())) {
            throw new ForbiddenException("You do not have permission to delete this project");
        }

        List<Task> projectTasks = taskRepository.findByProjectId(id);
        for (Task task : projectTasks) {
            subtaskRepository.deleteByTaskId(task.getId());
            taskRepository.deleteById(task.getId());
        }

        projectRepository.deleteById(id);
    }

    @Transactional
    public Project getOrCreateDefaultProject(User user) {
        List<Project> userProjects = projectRepository.findByOwnerId(user.getId());
        if (!userProjects.isEmpty()) {
            return userProjects.get(0);
        }
        
        Project defaultProject = Project.builder()
                .name("Default Project")
                .description("Default project automatically created for " + user.getUsername())
                .owner(user)
                .build();
        return projectRepository.save(defaultProject);
    }

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .ownerId(project.getOwner().getId())
                .createdAt(project.getCreatedAt())
                .build();
    }
}
