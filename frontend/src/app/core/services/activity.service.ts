import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Activity {
  id: number;
  taskId?: number;
  taskTitle: string;
  action: string; // 'created' | 'updated' | 'deleted' | 'completed' | 'todo' | 'status_cycle'
  userName: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private activitiesSubject = new BehaviorSubject<Activity[]>([
    {
      id: 1,
      taskId: 5,
      taskTitle: 'Set up CI/CD pipeline',
      action: 'completed',
      userName: 'User',
      timestamp: new Date(Date.now() - 4 * 3600000)
    },
    {
      id: 2,
      taskId: 1,
      taskTitle: 'Design new landing page',
      action: 'started',
      userName: 'User',
      timestamp: new Date(Date.now() - 6 * 3600000)
    },
    {
      id: 3,
      taskId: 4,
      taskTitle: 'Migrate database to PostgreSQL',
      action: 'updated',
      userName: 'User',
      timestamp: new Date(Date.now() - 24 * 3600000)
    }
  ]);

  getActivities(): Observable<Activity[]> {
    return this.activitiesSubject.asObservable();
  }

  logActivity(taskTitle: string, action: string, taskId?: number): void {
    const newActivity: Activity = {
      id: Date.now(),
      taskId,
      taskTitle,
      action,
      userName: 'User',
      timestamp: new Date()
    };
    this.activitiesSubject.next([newActivity, ...this.activitiesSubject.value]);
  }
}
