import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { LoadingComponent } from '../../components/loading/loading.component';
import { NotificationsComponent } from '../../components/notifications/notifications.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, LoadingComponent, NotificationsComponent],
  template: `
    <app-navbar [navigationOpen]="navigationOpen()" (menuToggle)="toggleNavigation()" />
    <div class="workspace">
      <app-sidebar [open]="navigationOpen()" (close)="closeNavigation()" />
      <main class="content"><router-outlet /></main>
    </div>
    <app-loading />
    <app-notifications />
  `,
  styles: `
    :host { display:block; min-height:100vh; }
    .workspace { display:grid; grid-template-columns:228px minmax(0,1fr); min-height:calc(100vh - 72px); }
    .content { width:100%; max-width:1500px; margin:0 auto; padding:34px 38px 50px; }
    @media (max-width:980px) { .workspace { grid-template-columns:190px minmax(0,1fr); } .content { padding:28px 24px 40px; } }
    @media (max-width:780px) { .workspace { display:block; min-height:calc(100vh - 72px); } .content { padding:25px 18px 40px; } }
  `,
})
export class AppShellComponent {
  protected readonly navigationOpen = signal(false);

  protected toggleNavigation(): void {
    this.navigationOpen.update((open) => !open);
  }

  protected closeNavigation(): void {
    this.navigationOpen.set(false);
  }
}
