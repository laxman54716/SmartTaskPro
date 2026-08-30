package com.smarttask.pro.repository;

import com.smarttask.pro.model.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectId(Long projectId);
    List<Task> findByAssigneeId(Long assigneeId);

    @Query("SELECT DISTINCT t FROM Task t LEFT JOIN t.project p WHERE t.reporter.id = :userId OR (t.assignee IS NOT NULL AND t.assignee.id = :userId) OR (p IS NOT NULL AND p.owner.id = :userId)")
    List<Task> findByUserId(@Param("userId") Long userId);
}

