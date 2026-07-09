import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../core/services/task.service';
import { TaskResponse, TaskStatus, TaskPriority } from '../../core/models/task.models';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.css']
})
export class KanbanComponent implements OnInit {
  @Input() tasks: TaskResponse[] = [];
  @Output() taskUpdated = new EventEmitter<void>();
  @Output() editTask = new EventEmitter<{ task: TaskResponse, event: Event }>();
  @Output() deleteTask = new EventEmitter<{ id: number, event: Event }>();
  @Output() openCreateModal = new EventEmitter<TaskStatus>();

  private taskService = inject(TaskService);

  columns = [
    { key: TaskStatus.BACKLOG, label: 'Backlog', icon: '📥', color: '#64748B' }, // Slate: Neutral, out of mind
    { key: TaskStatus.TODO, label: 'To Do', icon: '📌', color: '#3B82F6' }, // Blue: Focus, direction
    { key: TaskStatus.IN_PROGRESS, label: 'In Progress', icon: '⚙️', color: '#8B5CF6' }, // Purple: Flow, creativity
    { key: TaskStatus.IN_REVIEW, label: 'In Review', icon: '👀', color: '#F59E0B' }, // Amber: Needs attention
    { key: TaskStatus.DONE, label: 'Done', icon: '✅', color: '#10B981' } // Green: Success, dopamine
  ];

  draggedTaskId: number | null = null;
  activeDragColumn: string | null = null;

  ngOnInit(): void {}

  getTasksByStatus(status: TaskStatus): TaskResponse[] {
    return this.tasks.filter(t => t.status === status);
  }

  getPriorityClass(priority: TaskPriority): string {
    return 'priority-' + priority.toLowerCase();
  }

  onDragStart(event: DragEvent, taskId: number): void {
    this.draggedTaskId = taskId;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', taskId.toString());
    }
  }

  onDragEnd(event: DragEvent): void {
    this.draggedTaskId = null;
    this.activeDragColumn = null;
  }

  onDragOver(event: DragEvent, columnKey: string): void {
    event.preventDefault();
  }

  onDragEnter(event: DragEvent, columnKey: string): void {
    event.preventDefault();
    this.activeDragColumn = columnKey;
  }

  onDragLeave(event: DragEvent, columnKey: string): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, status: TaskStatus): void {
    event.preventDefault();
    this.activeDragColumn = null;
    const taskIdStr = event.dataTransfer?.getData('text/plain') || this.draggedTaskId?.toString();
    if (taskIdStr) {
      const taskId = parseInt(taskIdStr, 10);
      const task = this.tasks.find(t => t.id === taskId);
      if (task && task.status !== status) {
        this.taskService.updateTask(taskId, { ...task, status }).subscribe({
          next: () => {
            this.taskUpdated.emit();
          }
        });
      }
    }
  }

  onCardClick(task: TaskResponse, event: Event): void {
    this.editTask.emit({ task, event });
  }

  onDeleteClick(id: number, event: Event): void {
    event.stopPropagation();
    this.deleteTask.emit({ id, event });
  }

  onAddTaskClick(status: TaskStatus): void {
    this.openCreateModal.emit(status);
  }

  isOverdue(task: TaskResponse): boolean {
    if (!task.dueDate || task.status === TaskStatus.DONE) return false;
    return new Date(task.dueDate) < new Date(new Date().toDateString());
  }

  getDaysRemaining(dueDate: string): string {
    if (!dueDate) return '';
    const diff = Math.ceil((new Date(dueDate).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Due today';
    return `${diff}d left`;
  }
}
