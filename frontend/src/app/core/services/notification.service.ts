import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Notification {
  id: number;
  title: string;
  description?: string;
  type: 'assignment' | 'deadline' | 'comment' | 'system';
  timestamp: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications: Notification[] = [
    {
      id: 1,
      title: 'New Task Assigned',
      description: 'You have been assigned the task "Fix authentication bug".',
      type: 'assignment',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      read: false
    },
    {
      id: 2,
      title: 'Upcoming Deadline',
      description: 'The task "Design new landing page" is due in 3 days.',
      type: 'deadline',
      timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 hours ago
      read: false
    },
    {
      id: 3,
      title: 'Comment Added',
      description: 'System AI commented on "Migrate database to PostgreSQL": Optimal performance index suggested.',
      type: 'comment',
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
      read: true
    },
    {
      id: 4,
      title: 'System Update Completed',
      description: 'SmartTaskPro version 2.0 has been deployed successfully.',
      type: 'system',
      timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
      read: true
    }
  ];

  private notificationsSubject = new BehaviorSubject<Notification[]>(this.notifications);

  getNotifications(): Observable<Notification[]> {
    return this.notificationsSubject.asObservable();
  }

  getUnreadCount(): Observable<number> {
    const unreadSubject = new BehaviorSubject<number>(this.notifications.filter(n => !n.read).length);
    this.notificationsSubject.subscribe(notifs => {
      unreadSubject.next(notifs.filter(n => !n.read).length);
    });
    return unreadSubject.asObservable();
  }

  markAsRead(id: number): Observable<void> {
    const idx = this.notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      this.notifications[idx] = { ...this.notifications[idx], read: true };
      this.notificationsSubject.next([...this.notifications]);
    }
    return of(undefined).pipe(delay(100));
  }

  markAllAsRead(): Observable<void> {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next([...this.notifications]);
    return of(undefined).pipe(delay(100));
  }

  addNotification(title: string, description: string, type: 'assignment' | 'deadline' | 'comment' | 'system'): void {
    const newNotif: Notification = {
      id: Math.max(...this.notifications.map(n => n.id), 0) + 1,
      title,
      description,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    this.notifications = [newNotif, ...this.notifications];
    this.notificationsSubject.next([...this.notifications]);
  }
}
