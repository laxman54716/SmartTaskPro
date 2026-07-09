import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskRequest, TaskResponse } from '../models/task.models';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private apiUrl = 'http://localhost:8080/api/v1/tasks';

  constructor(private http: HttpClient) { }

  getTasks(): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(this.apiUrl);
  }

  getTaskById(id: number): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.apiUrl}/${id}`);
  }

  createTask(task: TaskRequest): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(this.apiUrl, task);
  }

  updateTask(id: number, task: TaskRequest): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleSubtask(taskId: number, subtaskId: number): Observable<TaskResponse> {
    // In a real app, this should be handled by an API call like POST /api/v1/tasks/{taskId}/subtasks/{subtaskId}/toggle
    // For now, this requires the backend to have subtasks, but since the mock did this locally, 
    // we would need to fetch the task, update the subtask, and send a PUT request.
    // Assuming backend will be updated to handle this eventually.
    return this.http.put<TaskResponse>(`${this.apiUrl}/${taskId}/subtasks/${subtaskId}/toggle`, {});
  }
}
