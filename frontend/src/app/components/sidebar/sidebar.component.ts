import { Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <button
      class="backdrop"
      type="button"
      aria-label="Close navigation menu"
      [class.visible]="open()"
      (click)="close.emit()"
    ></button>
    <aside class="sidebar" [class.open]="open()">
      <div class="mobile-sidebar-head">
        <span class="mobile-title">Navigation</span>
        <button type="button" aria-label="Close navigation menu" (click)="close.emit()">×</button>
      </div>
      <p class="section-label">WORKSPACE</p>
      <nav aria-label="Workspace navigation">
        @for (item of workspaceItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="close.emit()"
          >
            <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span><span>{{ item.label }}</span>
          </a>
        }
      </nav>
      <p class="section-label secondary-label">MANAGEMENT</p>
      <nav aria-label="Management navigation">
        @for (item of visibleManagementItems(); track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active" (click)="close.emit()">
            <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span><span>{{ item.label }}</span>
          </a>
        }
      </nav>
      <div class="sidebar-foot">
        <div class="foot-mark">✓</div>
        <div><strong>StockSmart</strong><span>Retail operations</span></div>
      </div>
    </aside>
  `,
  styles: `
    :host { display:block; }
    .sidebar { position:sticky; top:72px; display:flex; flex-direction:column; height:calc(100vh - 72px); padding:26px 14px 16px; border-right:1px solid #e6ece8; background:#fff; }
    .mobile-sidebar-head { display:none; }
    .section-label { margin:0 12px 11px; color:#9aa59e; font-size:10px; font-weight:700; letter-spacing:.12em; }
    nav { display:grid; gap:4px; }
    nav a { min-height:40px; display:flex; align-items:center; gap:11px; padding:0 12px; border-radius:9px; color:#657169; font-size:13px; font-weight:500; transition:background .15s,color .15s; }
    nav a:hover { background:#f5f8f6; color:#254b34; }
    nav a.active { background:#eaf4ed; color:#1e7043; font-weight:700; }
    .nav-icon { width:18px; color:#849188; text-align:center; font-size:15px; }
    nav a.active .nav-icon { color:#278552; }
    .secondary-label { margin-top:28px; }
    .sidebar-foot { display:flex; align-items:center; gap:10px; margin-top:auto; padding:14px 8px 5px; border-top:1px solid #edf0ee; }
    .foot-mark { width:29px; height:29px; display:grid; place-items:center; border-radius:9px; background:#e9f4ec; color:#238353; font-weight:700; }
    .sidebar-foot strong,.sidebar-foot span { display:block; }
    .sidebar-foot strong { color:#35433a; font-size:11px; }
    .sidebar-foot span { margin-top:3px; color:#89948d; font-size:10px; }
    .backdrop { display:none; }
    @media (max-width:780px) {
      .backdrop { position:fixed; inset:72px 0 0; z-index:39; display:block; border:0; background:#10251b80; opacity:0; visibility:hidden; transition:opacity .2s,visibility .2s; }
      .backdrop.visible { opacity:1; visibility:visible; }
      .sidebar { position:fixed; z-index:40; top:72px; bottom:0; left:0; width:min(300px,84vw); height:auto; padding:16px 14px; border:0; box-shadow:14px 0 38px #10251b20; transform:translateX(-105%); transition:transform .22s ease; overflow-y:auto; }
      .sidebar.open { transform:translateX(0); }
      .mobile-sidebar-head { display:flex; align-items:center; justify-content:space-between; margin:0 6px 23px; }
      .mobile-title { color:#273a2e; font:700 15px 'Manrope',sans-serif; }
      .mobile-sidebar-head button { width:32px; height:32px; border:1px solid #e5ebe7; border-radius:8px; background:#fff; color:#66736a; font-size:22px; cursor:pointer; }
      .sidebar-foot { margin-top:24px; }
    }
    @media (prefers-reduced-motion:reduce) { .sidebar,.backdrop { transition:none; } }
  `,
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  readonly open = input(false);
  readonly close = output<void>();

  protected readonly workspaceItems: NavigationItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '▦' },
    { label: 'Products', path: '/products', icon: '◇' },
    { label: 'Inventory', path: '/inventory', icon: '▤' },
    { label: 'Locations', path: '/locations', icon: '⌖' },
    { label: 'Suppliers', path: '/suppliers', icon: '⇄' },
    { label: 'Purchase orders', path: '/purchase-orders', icon: '↓' },
    { label: 'Sales orders', path: '/sales-orders', icon: '↑' },
  ];

  protected readonly managementItems: NavigationItem[] = [
    { label: 'Barcode & RFID', path: '/barcode-rfid', icon: '▥' },
    { label: 'Reports', path: '/reports', icon: '▧' },
    { label: 'Users', path: '/users', icon: '♙' },
    { label: 'Settings', path: '/settings', icon: '⚙' },
  ];

  protected visibleManagementItems(): NavigationItem[] {
    return this.managementItems.filter((item) => item.path !== '/users' || this.auth.hasRole('ADMIN'));
  }
}
