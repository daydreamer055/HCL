import { Injectable, signal } from '@angular/core';

export type NotificationKind = 'success' | 'error' | 'info';

export interface AppNotification {
  id: number;
  message: string;
  kind: NotificationKind;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 0;
  readonly notifications = signal<AppNotification[]>([]);

  show(message: string, kind: NotificationKind = 'info'): void {
    const id = ++this.nextId;
    this.notifications.update((items) => [...items, { id, message, kind }]);
    window.setTimeout(() => this.dismiss(id), 5000);
  }

  dismiss(id: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== id));
  }
}
