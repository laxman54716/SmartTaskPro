export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE'
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
  dueDate?: string; // ISO 8601 string
  estimatedHours?: number;
  tags?: string;
  projectId: number;
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
