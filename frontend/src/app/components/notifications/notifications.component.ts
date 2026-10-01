import { Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  template: `
    <div class="notification-stack" aria-live="polite" aria-relevant="additions">
      @for (notification of service.notifications(); track notification.id) {
        <div class="notification" [class]="notification.kind" role="status">
          <span>{{ notification.message }}</span>
          <button type="button" aria-label="Dismiss notification" (click)="service.dismiss(notification.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .notification-stack { position:fixed; z-index:1100; right:20px; bottom:20px; display:grid; gap:10px; width:min(360px,calc(100vw - 40px)); }
    .notification { display:flex; justify-content:space-between; align-items:center; gap:15px; padding:14px 15px; border:1px solid #dce9df; border-left:4px solid #238353; border-radius:12px; background:#fff; color:#26352c; font-size:13px; box-shadow:0 10px 28px #173c281c; }
    .notification.error { border-left-color:#d34d4d; }
    .notification.success { border-left-color:#238353; }
    button { border:0; background:transparent; color:#6c7870; cursor:pointer; font-size:19px; line-height:1; }
  `,
})
export class NotificationsComponent {
  protected readonly service = inject(NotificationService);
}
