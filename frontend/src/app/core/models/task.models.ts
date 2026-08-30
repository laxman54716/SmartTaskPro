export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED'
}

export interface Subtask {
  id: number;
  title: string;
  done: boolean;
}

export interface TaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  category?: string;
  dueDate?: string; // ISO 8601 string or yyyy-MM-dd
  estimatedHours?: number;
  tags?: string;
  projectId?: number;
  assigneeId?: number;
  labels?: string[];
  subtasks?: Subtask[];
  commentsCount?: number;
}

export interface TaskResponse {
  id: number;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  aiPriorityScore: number;
  tags: string;
  projectId: number;
  assigneeId: number;
  reporterId: number;
  createdAt: string;
  labels?: string[];
  subtasks?: Subtask[];
  commentsCount?: number;
}
