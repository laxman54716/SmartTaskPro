import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { ActivityService, Activity } from '../../core/services/activity.service';
import { TaskResponse, TaskPriority, TaskStatus, Subtask } from '../../core/models/task.models';

import { KanbanComponent } from '../kanban/kanban.component';
import { AnalyticsComponent } from '../analytics/analytics.component';
import { GlobalSearchComponent } from '../search/global-search.component';
import { SkeletonComponent } from '../../shared/skeleton/skeleton.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, KanbanComponent, AnalyticsComponent, GlobalSearchComponent, SkeletonComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  // ── State ──────────────────────────────────────────────────────
  tasks: TaskResponse[] = [];
  filteredTasks: TaskResponse[] = [];
  isLoading = true;
  showModal = false;
  showEditModal = false;
  activeFilter = 'ALL';
  currentUser = '';
  activeNav: 'dashboard' | 'tasks' | 'kanban' | 'analytics' = 'dashboard';

  // Search & Sort
  searchQuery = '';
  sortBy = 'default';

  // Theme
  isDarkTheme = true;

  // Global Search
  showGlobalSearch = false;

  // Notifications
  notifications: Notification[] = [];
  unreadCount = 0;
  showNotificationPanel = false;
  private notifSub?: Subscription;

  // Activities
  activities: Activity[] = [];
  private actSub?: Subscription;

  // Pomodoro
  pomodoroActive = false;
  pomodoroMinutes = 25;
  pomodoroSeconds = 0;
  pomodoroTotal = 25 * 60;
  pomodoroElapsed = 0;
  pomodoroInterval: any = null;
  pomodoroLabel = 'Focus';

  // New Task
  newTask = {
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    category: '',
    dueDate: '',
    estimatedHours: 0,
    projectId: 1,
    labels: [] as string[],
    subtasks: [] as Subtask[]
  };
  newLabelInput = '';
  newSubtaskInput = '';

  // Edit Task
  editingTask: TaskResponse | null = null;
  editTask = {
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    category: '',
    dueDate: '',
    estimatedHours: 0,
    projectId: 1,
    labels: [] as string[],
    subtasks: [] as Subtask[]
  };
  editLabelInput = '';
  editSubtaskInput = '';

  priorities = Object.values(TaskPriority);
  statuses = Object.values(TaskStatus);

  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private activityService = inject(ActivityService);
  private router = inject(Router);

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadTasks();
    const saved = localStorage.getItem('stp_theme');
    this.isDarkTheme = saved !== 'light';
    this.applyTheme();

    this.notifSub = this.notificationService.getNotifications().subscribe(n => {
      this.notifications = n;
      this.unreadCount = n.filter(x => !x.read).length;
    });

    this.actSub = this.activityService.getActivities().subscribe(a => {
      this.activities = a;
    });
  }

  ngOnDestroy(): void {
    this.clearPomodoro();
    this.notifSub?.unsubscribe();
    this.actSub?.unsubscribe();
  }

  // ── Global keyboard shortcuts ──────────────────────────────────
  @HostListener('document:keydown', ['$event'])
  handleGlobalKeys(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.showGlobalSearch = !this.showGlobalSearch;
    }
  }

  // ── Theme ──────────────────────────────────────────────────────
  applyTheme(): void {
    document.body.classList.toggle('light-theme', !this.isDarkTheme);
    localStorage.setItem('stp_theme', this.isDarkTheme ? 'dark' : 'light');
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
  }

  // ── User ───────────────────────────────────────────────────────
  get userInitial(): string {
    return this.currentUser.charAt(0).toUpperCase();
  }

  // ── Stats ──────────────────────────────────────────────────────
  get stats() {
    const overdue = this.tasks.filter(t => this.isOverdue(t)).length;
    return {
      total: this.tasks.length,
      todo: this.tasks.filter(t => t.status === TaskStatus.TODO).length,
      inProgress: this.tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      done: this.tasks.filter(t => t.status === TaskStatus.DONE).length,
      overdue
    };
  }

  get completionPercent(): number {
    if (!this.tasks.length) return 0;
    return Math.round((this.stats.done / this.tasks.length) * 100);
  }

  // ── Tasks ──────────────────────────────────────────────────────
  loadTasks(): void {
    this.isLoading = true;
    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.tasks = data;
        this.applyFilterAndSearch();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  applyFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilterAndSearch();
  }

  applyFilterAndSearch(): void {
    let result = [...this.tasks];

    if (this.activeFilter !== 'ALL') {
      if (this.activeFilter === 'OVERDUE') {
        result = result.filter(t => this.isOverdue(t));
      } else {
        result = result.filter(t => t.status === this.activeFilter);
      }
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q) ||
        t.tags?.toLowerCase().includes(q)
      );
    }

    result = this.sortTasks(result);
    this.filteredTasks = result;
  }

  sortTasks(tasks: TaskResponse[]): TaskResponse[] {
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    switch (this.sortBy) {
      case 'priority':
        return [...tasks].sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));
      case 'dueDate':
        return [...tasks].sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      case 'aiScore':
        return [...tasks].sort((a, b) => (b.aiPriorityScore ?? 0) - (a.aiPriorityScore ?? 0));
      case 'title':
        return [...tasks].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return tasks;
    }
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

  // ── My Tasks Grouping ──────────────────────────────────────────
  private getDateBounds() {
    const today = new Date(new Date().toDateString());
    const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 6);
    const monthEnd = new Date(today); monthEnd.setDate(today.getDate() + 30);
    return { today, todayEnd, weekEnd, monthEnd };
  }

  get todayTasks(): TaskResponse[] {
    const { today, todayEnd } = this.getDateBounds();
    return this.tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d >= today && d <= todayEnd;
    });
  }

  get weeklyTasks(): TaskResponse[] {
    const { todayEnd, weekEnd } = this.getDateBounds();
    return this.tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d > todayEnd && d <= weekEnd;
    });
  }

  get monthlyTasks(): TaskResponse[] {
    const { weekEnd, monthEnd } = this.getDateBounds();
    return this.tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d > weekEnd && d <= monthEnd;
    });
  }

  get noDueDateTasks(): TaskResponse[] {
    return this.tasks.filter(t => !t.dueDate && t.status !== 'DONE');
  }

  // ── Create Modal ───────────────────────────────────────────────
  openModal(withStatus?: TaskStatus): void {
    this.newTask = {
      title: '', description: '', priority: TaskPriority.MEDIUM,
      status: withStatus || TaskStatus.TODO, category: '', dueDate: '',
      estimatedHours: 0, projectId: 1, labels: [], subtasks: []
    };
    this.newLabelInput = '';
    this.newSubtaskInput = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  addNewLabel(): void {
    const label = this.newLabelInput.trim();
    if (label && !this.newTask.labels.includes(label)) {
      this.newTask.labels = [...this.newTask.labels, label];
    }
    this.newLabelInput = '';
  }

  removeNewLabel(label: string): void {
    this.newTask.labels = this.newTask.labels.filter(l => l !== label);
  }

  addNewSubtask(): void {
    const title = this.newSubtaskInput.trim();
    if (title) {
      const id = Date.now();
      this.newTask.subtasks = [...this.newTask.subtasks, { id, title, done: false }];
    }
    this.newSubtaskInput = '';
  }

  removeNewSubtask(id: number): void {
    this.newTask.subtasks = this.newTask.subtasks.filter(s => s.id !== id);
  }

  createTask(): void {
    if (!this.newTask.title.trim()) return;
    this.taskService.createTask(this.newTask).subscribe({
      next: (task) => {
        this.activityService.logActivity(task.title, 'created', task.id);
        this.notificationService.addNotification('Task Created', `"${task.title}" was created successfully.`, 'system');
        this.closeModal();
        this.loadTasks();
      }
    });
  }

  // ── Edit Modal ─────────────────────────────────────────────────
  openEditModal(task: TaskResponse, event: Event): void {
    event.stopPropagation();
    this.editingTask = task;
    this.editTask = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      category: task.category,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      projectId: task.projectId,
      labels: [...(task.labels || [])],
      subtasks: (task.subtasks || []).map(s => ({ ...s }))
    };
    this.editLabelInput = '';
    this.editSubtaskInput = '';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingTask = null;
  }

  addEditLabel(): void {
    const label = this.editLabelInput.trim();
    if (label && !this.editTask.labels.includes(label)) {
      this.editTask.labels = [...this.editTask.labels, label];
    }
    this.editLabelInput = '';
  }

  removeEditLabel(label: string): void {
    this.editTask.labels = this.editTask.labels.filter(l => l !== label);
  }

  addEditSubtask(): void {
    const title = this.editSubtaskInput.trim();
    if (title) {
      const id = Date.now();
      this.editTask.subtasks = [...this.editTask.subtasks, { id, title, done: false }];
    }
    this.editSubtaskInput = '';
  }

  removeEditSubtask(id: number): void {
    this.editTask.subtasks = this.editTask.subtasks.filter(s => s.id !== id);
  }

  toggleEditSubtask(id: number): void {
    this.editTask.subtasks = this.editTask.subtasks.map(s =>
      s.id === id ? { ...s, done: !s.done } : s
    );
  }

  saveEdit(): void {
    if (!this.editingTask || !this.editTask.title.trim()) return;
    this.taskService.updateTask(this.editingTask.id, this.editTask).subscribe({
      next: () => {
        this.activityService.logActivity(this.editTask.title, 'updated', this.editingTask!.id);
        this.closeEditModal();
        this.loadTasks();
      }
    });
  }

  // ── Quick Actions ──────────────────────────────────────────────
  deleteTask(id: number, event: Event): void {
    event.stopPropagation();
    const task = this.tasks.find(t => t.id === id);
    this.taskService.deleteTask(id).subscribe({
      next: () => {
        if (task) this.activityService.logActivity(task.title, 'deleted', id);
        this.loadTasks();
      }
    });
  }

  markDone(task: TaskResponse, event: Event): void {
    event.stopPropagation();
    const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    this.taskService.updateTask(task.id, { ...task, status: newStatus, projectId: task.projectId }).subscribe({
      next: () => {
        this.activityService.logActivity(task.title, newStatus === TaskStatus.DONE ? 'completed' : 'todo', task.id);
        this.loadTasks();
      }
    });
  }

  cycleStatus(task: TaskResponse, event: Event): void {
    event.stopPropagation();
    const cycle = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.DONE];
    const idx = cycle.indexOf(task.status);
    const next = cycle[(idx + 1) % cycle.length];
    this.taskService.updateTask(task.id, { ...task, status: next, projectId: task.projectId }).subscribe({
      next: () => {
        this.activityService.logActivity(task.title, 'status_cycle', task.id);
        this.loadTasks();
      }
    });
  }

  // ── Kanban Actions ─────────────────────────────────────────────
  onKanbanTaskUpdated(): void {
    this.loadTasks();
  }

  onKanbanEditTask(payload: { task: TaskResponse; event: Event }): void {
    this.openEditModal(payload.task, payload.event);
  }

  onKanbanDeleteTask(payload: { id: number; event: Event }): void {
    this.deleteTask(payload.id, payload.event);
  }

  onKanbanOpenCreate(status: TaskStatus): void {
    this.openModal(status);
  }

  // ── Global Search ──────────────────────────────────────────────
  openGlobalSearch(): void {
    this.showGlobalSearch = true;
  }

  closeGlobalSearch(): void {
    this.showGlobalSearch = false;
  }

  onSearchSelectTask(task: TaskResponse): void {
    this.closeGlobalSearch();
    this.openEditModal(task, new MouseEvent('click'));
  }

  // ── Notifications ──────────────────────────────────────────────
  toggleNotificationPanel(): void {
    this.showNotificationPanel = !this.showNotificationPanel;
  }

  closeNotificationPanel(): void {
    this.showNotificationPanel = false;
  }

  markNotifRead(id: number): void {
    this.notificationService.markAsRead(id).subscribe();
  }

  markAllNotifsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  getNotifIcon(type: string): string {
    const icons: Record<string, string> = {
      assignment: '👤', deadline: '⏰', comment: '💬', system: '🔔'
    };
    return icons[type] || '🔔';
  }

  getRelativeTime(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  // ── Pomodoro ───────────────────────────────────────────────────
  startPomodoro(minutes: number, label: string): void {
    this.clearPomodoro();
    this.pomodoroMinutes = minutes;
    this.pomodoroSeconds = 0;
    this.pomodoroTotal = minutes * 60;
    this.pomodoroElapsed = 0;
    this.pomodoroLabel = label;
    this.pomodoroActive = true;

    this.pomodoroInterval = setInterval(() => {
      this.pomodoroElapsed++;
      const remaining = this.pomodoroTotal - this.pomodoroElapsed;
      this.pomodoroMinutes = Math.floor(remaining / 60);
      this.pomodoroSeconds = remaining % 60;
      if (remaining <= 0) {
        this.clearPomodoro();
        this.pomodoroLabel = '✅ Done!';
        this.playAudioBeep();
      }
    }, 1000);
  }

  pauseResumePomodoro(): void {
    if (this.pomodoroInterval) {
      clearInterval(this.pomodoroInterval);
      this.pomodoroInterval = null;
    } else {
      this.pomodoroInterval = setInterval(() => {
        this.pomodoroElapsed++;
        const remaining = this.pomodoroTotal - this.pomodoroElapsed;
        this.pomodoroMinutes = Math.floor(remaining / 60);
        this.pomodoroSeconds = remaining % 60;
        if (remaining <= 0) {
          this.clearPomodoro();
          this.pomodoroLabel = '✅ Done!';
          this.playAudioBeep();
        }
      }, 1000);
    }
  }

  resetPomodoro(): void {
    this.clearPomodoro();
    this.pomodoroActive = false;
    this.pomodoroMinutes = 25;
    this.pomodoroSeconds = 0;
    this.pomodoroElapsed = 0;
    this.pomodoroLabel = 'Focus';
  }

  clearPomodoro(): void {
    if (this.pomodoroInterval) {
      clearInterval(this.pomodoroInterval);
      this.pomodoroInterval = null;
    }
  }

  get pomodoroProgress(): number {
    return this.pomodoroTotal > 0 ? (this.pomodoroElapsed / this.pomodoroTotal) * 100 : 0;
  }

  get isPomodoroRunning(): boolean {
    return !!this.pomodoroInterval;
  }

  playAudioBeep(): void {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5 pitch
      
      gainNode.gain.setValueAtTime(0.5, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1);
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start();
      oscillator.stop(context.currentTime + 1);
    } catch (e) {
      console.warn('AudioContext not supported or blocked');
    }
  }

  // ── Auth ───────────────────────────────────────────────────────
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
