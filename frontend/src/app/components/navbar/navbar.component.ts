import { Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="topbar">
      <button
        class="menu-toggle"
        type="button"
        [attr.aria-label]="navigationOpen() ? 'Close navigation menu' : 'Open navigation menu'"
        [attr.aria-expanded]="navigationOpen()"
        (click)="menuToggle.emit()"
      >
        <span></span><span></span><span></span>
      </button>
      <a class="brand" routerLink="/dashboard" aria-label="StockSmart home">
        <span class="brand-mark">S</span>
        <span>stock<span class="brand-accent">smart</span></span>
      </a>
      <div class="topbar-right">
        <span class="environment-label"><i></i> Inventory workspace</span>
        <div class="profile">
          <button
            class="profile-trigger"
            type="button"
            aria-label="Open account menu"
            [attr.aria-expanded]="profileMenuOpen()"
            (click)="toggleProfileMenu()"
          >
            <span class="avatar" aria-hidden="true">●</span>
            <span class="profile-label">Account</span>
            <span class="chevron" aria-hidden="true">⌄</span>
          </button>
          @if (profileMenuOpen()) {
            <div class="profile-menu">
              <span class="menu-heading">Account</span>
              <span class="menu-caption">StockSmart workspace</span>
              <button type="button" class="logout" (click)="signOut()">Sign out</button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: `
    .topbar { position:sticky; z-index:20; top:0; height:72px; display:flex; align-items:center; justify-content:space-between; padding:0 30px; border-bottom:1px solid #e6ece8; background:#fff; }
    .menu-toggle { display:none; width:38px; height:38px; padding:10px; border:1px solid #e4ebe6; border-radius:10px; background:#fff; cursor:pointer; }
    .menu-toggle span { display:block; height:2px; margin:3px 0; border-radius:2px; background:#34523f; }
    .brand { display:flex; align-items:center; gap:10px; color:#17271d; font:800 19px 'Manrope',sans-serif; letter-spacing:-.06em; }
    .brand-mark { width:30px; height:30px; display:grid; place-items:center; border-radius:9px; background:#1c7044; color:#fff; font-size:17px; }
    .brand-accent { color:#268555; }
    .topbar-right { display:flex; align-items:center; gap:17px; }
    .environment-label { display:flex; align-items:center; gap:8px; color:#718077; font-size:12px; }
    .environment-label i { width:7px; height:7px; border-radius:50%; background:#36a269; box-shadow:0 0 0 3px #e8f5ec; }
    .profile { position:relative; }
    .profile-trigger { display:flex; align-items:center; gap:9px; padding:5px 8px 5px 5px; border:1px solid transparent; border-radius:11px; background:#fff; color:#45554b; cursor:pointer; }
    .profile-trigger:hover,.profile-trigger[aria-expanded="true"] { border-color:#e3ebe5; background:#f8faf8; }
    .avatar { width:32px; height:32px; display:grid; place-items:center; border:1px solid #dce9df; border-radius:50%; background:#edf5ef; color:#358455; font-size:13px; }
    .profile-label { font-size:12px; font-weight:600; }
    .chevron { color:#859188; font-size:14px; }
    .profile-menu { position:absolute; top:calc(100% + 10px); right:0; z-index:30; width:220px; padding:16px; border:1px solid #e3ebe5; border-radius:13px; background:#fff; box-shadow:0 14px 36px #193d291a; }
    .menu-heading,.menu-caption { display:block; }
    .menu-heading { color:#25372b; font-size:13px; font-weight:700; }
    .menu-caption { margin-top:4px; color:#7c8980; font-size:11px; }
    .logout { width:100%; margin-top:14px; padding:9px 11px; border:1px solid #e5ebe7; border-radius:8px; background:#fff; color:#415047; font-size:12px; font-weight:600; text-align:left; cursor:pointer; }
    .logout:hover { border-color:#efd4d4; background:#fff7f7; color:#a83c3c; }
    @media (max-width:780px) { .topbar { justify-content:flex-start; gap:12px; padding:0 16px; } .menu-toggle { display:block; flex:0 0 auto; } .topbar-right { gap:8px; margin-left:auto; } .environment-label { display:none; } }
    @media (max-width:420px) { .profile-label,.chevron { display:none; } }
  `,
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  readonly navigationOpen = input(false);
  readonly menuToggle = output<void>();
  protected readonly profileMenuOpen = signal(false);

  protected toggleProfileMenu(): void {
    this.profileMenuOpen.update((open) => !open);
  }

  protected signOut(): void {
    this.profileMenuOpen.set(false);
    this.auth.logout();
  }
}
