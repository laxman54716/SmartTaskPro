import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TaskRequest, TaskResponse } from '../models/task.models';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) { }

  getTasks(): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(this.apiUrl).pipe(
      map(tasks => (tasks || []).map(task => this.normalizeTask(task)))
    );
  }

  getTaskById(id: number): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.apiUrl}/${id}`).pipe(
      map(task => this.normalizeTask(task))
    );
  }

  createTask(task: TaskRequest): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(this.apiUrl, this.toApiPayload(task, false)).pipe(
      map(created => this.normalizeTask(created))
    );
  }

  updateTask(id: number, task: TaskRequest): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${this.apiUrl}/${id}`, this.toApiPayload(task, true)).pipe(
      map(updated => this.normalizeTask(updated))
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleSubtask(taskId: number, subtaskId: number): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${this.apiUrl}/${taskId}/subtasks/${subtaskId}/toggle`, {}).pipe(
      map(task => this.normalizeTask(task))
    );
  }

  private toApiPayload(task: TaskRequest, includeProjectId: boolean): Record<string, unknown> {
    const due = task.dueDate?.toString().trim();
    const labels = task.labels || [];
    const payload: Record<string, unknown> = {
      title: task.title?.trim(),
      description: task.description || undefined,
      priority: task.priority,
      status: task.status,
      category: task.category || undefined,
      estimatedHours: task.estimatedHours ?? 0,
      tags: task.tags || (labels.length ? labels.join(',') : undefined),
      subtasks: (task.subtasks || []).map(s => ({ title: s.title, done: !!s.done }))
    };

    if (due) {
      payload['dueDate'] = due.includes('T') ? due : `${due}T00:00:00`;
    }

    if (includeProjectId && task.projectId != null && task.projectId > 0) {
      payload['projectId'] = task.projectId;
    }

    if (task.assigneeId) {
      payload['assigneeId'] = task.assigneeId;
    }

    return payload;
  }

  private normalizeTask(task: TaskResponse): TaskResponse {
    const labels = task.labels?.length
      ? task.labels
      : (task.tags ? task.tags.split(',').map(s => s.trim()).filter(Boolean) : []);
    return {
      ...task,
      labels,
      subtasks: task.subtasks || []
    };
  }
}
