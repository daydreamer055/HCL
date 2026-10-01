import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [DatePipe],
  template: `
    <section class="page-heading">
      <div>
        <p class="eyebrow">STOCKSMART / PREFERENCES</p>
        <h1>Settings</h1>
        <p class="description">Your profile and sign-in details for this workspace.</p>
      </div>
    </section>

    @if (auth.currentUser(); as user) {
      <div class="settings-grid">
        <section class="settings-card profile-card" aria-labelledby="profile-title">
          <header class="card-heading">
            <span class="card-icon" aria-hidden="true">●</span>
            <div><h2 id="profile-title">Profile information</h2><p>Your account identity from StockSmart sign-in.</p></div>
          </header>
          <div class="profile-summary">
            <span class="avatar" aria-hidden="true">{{ initials(user.username) }}</span>
            <div><strong>{{ user.username }}</strong><span>{{ user.email }}</span></div>
          </div>
          <dl class="detail-list">
            @if (user.id) {
              <div><dt>Account ID</dt><dd>{{ user.id }}</dd></div>
            }
            <div><dt>Username</dt><dd>{{ user.username }}</dd></div>
            <div><dt>Email address</dt><dd>{{ user.email }}</dd></div>
          </dl>
          <p class="card-note">Profile editing is not supported by the current backend API.</p>
        </section>

        <section class="settings-card" aria-labelledby="account-title">
          <header class="card-heading">
            <span class="card-icon" aria-hidden="true">⚙</span>
            <div><h2 id="account-title">Account settings</h2><p>Access assigned to your account.</p></div>
          </header>
          <div class="account-status"><span class="status-dot"></span><div><strong>Account active</strong><span>Authenticated with a valid StockSmart session</span></div></div>
          <div class="role-section">
            <span class="detail-label">Assigned roles</span>
            @if (user.roles.length) {
              <div class="roles">
                @for (role of user.roles; track role) { <span class="role-badge">{{ role }}</span> }
              </div>
            } @else {
              <span class="muted-value">No roles were provided by the current session.</span>
            }
          </div>
          <p class="card-note">Role and account status changes are managed by your administrator.</p>
        </section>

        <section class="settings-card auth-card" aria-labelledby="auth-title">
          <header class="card-heading">
            <span class="card-icon" aria-hidden="true">⌑</span>
            <div><h2 id="auth-title">Authentication</h2><p>How this session is secured.</p></div>
          </header>
          <dl class="detail-list">
            <div><dt>Sign-in method</dt><dd>JWT bearer token</dd></div>
            <div><dt>Session status</dt><dd><span class="session-badge">Signed in</span></dd></div>
            @if (expiration(); as expiresAt) {
              <div><dt>Token expires</dt><dd>{{ expiresAt | date:'medium' }}</dd></div>
            } @else {
              <div><dt>Token expiry</dt><dd>Not provided</dd></div>
            }
          </dl>
          <p class="card-note">Your access token and credentials are never displayed here.</p>
        </section>
      </div>
    } @else {
      <section class="settings-card unavailable" role="status">
        <h2>Account details unavailable</h2>
        <p>Sign out and sign in again to refresh your account information.</p>
      </section>
    }

    <section class="signout-panel">
      <div><h2>Sign out</h2><p>End this session on the current device.</p></div>
      <button class="signout-button" type="button" (click)="auth.logout()">Sign out</button>
    </section>
  `,
  styles: `
    :host { display:block; color:#17211c; }
    .page-heading { margin:10px 0 24px; }
    .eyebrow { margin:0 0 10px; color:#78857d; font-size:11px; font-weight:700; letter-spacing:.13em; }
    h1 { margin:0; font:800 clamp(28px,3vw,38px)/1.15 'Manrope',sans-serif; letter-spacing:-.04em; }
    .description { margin:9px 0 0; color:#738078; font-size:14px; }
    .settings-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
    .settings-card { min-width:0; padding:20px; border:1px solid #e6ece8; border-radius:14px; background:#fff; box-shadow:0 5px 22px #17392408; }
    .card-heading { display:flex; align-items:center; gap:11px; }
    .card-icon { display:grid; width:34px; height:34px; flex:0 0 auto; place-items:center; border-radius:10px; background:#eef6f0; color:#358151; }
    .card-heading h2,.signout-panel h2,.unavailable h2 { margin:0; color:#2d3e33; font:750 13px 'Manrope',sans-serif; }
    .card-heading p,.signout-panel p,.unavailable p { margin:4px 0 0; color:#89948d; font-size:10px; }
    .profile-summary { display:flex; align-items:center; gap:11px; margin-top:19px; padding:13px; border-radius:10px; background:#f8faf8; }
    .avatar { display:grid; width:38px; height:38px; flex:0 0 auto; place-items:center; border:1px solid #dce9df; border-radius:50%; background:#edf5ef; color:#358455; font:700 12px 'Manrope',sans-serif; }
    .profile-summary strong,.profile-summary span:not(.avatar) { display:block; overflow:hidden; text-overflow:ellipsis; }
    .profile-summary strong { color:#34463a; font-size:12px; }
    .profile-summary div span { margin-top:4px; color:#79867e; font-size:10px; }
    .detail-list { display:grid; gap:0; margin:13px 0 0; }
    .detail-list>div { display:flex; justify-content:space-between; gap:14px; padding:10px 0; border-bottom:1px solid #f0f3f1; }
    .detail-list>div:last-child { border-bottom:0; }
    dt,.detail-label { color:#849087; font-size:10px; }
    dd { margin:0; color:#405047; font-size:10px; font-weight:600; text-align:right; overflow-wrap:anywhere; }
    .card-note { margin:13px 0 0; padding-top:11px; border-top:1px solid #f0f3f1; color:#8b968e; font-size:9px; line-height:1.5; }
    .account-status { display:flex; align-items:center; gap:10px; margin:20px 0; padding:12px; border-radius:9px; background:#f2f8f3; }
    .status-dot { width:8px; height:8px; flex:0 0 auto; border-radius:50%; background:#34a166; box-shadow:0 0 0 3px #dff0e3; }
    .account-status strong,.account-status span { display:block; }
    .account-status strong { color:#3d6849; font-size:11px; }
    .account-status span { margin-top:3px; color:#839187; font-size:9px; }
    .role-section { display:grid; gap:9px; }
    .roles { display:flex; gap:7px; flex-wrap:wrap; }
    .role-badge,.session-badge { display:inline-block; padding:5px 8px; border:1px solid #e4ebe6; border-radius:20px; background:#fafcfb; color:#526258; font-size:9px; font-weight:700; }
    .session-badge { border-color:#dcecdf; background:#eff7f0; color:#39754b; }
    .muted-value { color:#7e8a81; font-size:10px; }
    .signout-panel { display:flex; align-items:center; justify-content:space-between; gap:15px; margin-top:15px; padding:17px 20px; border:1px solid #e6ece8; border-radius:13px; background:#fff; }
    .signout-button { min-height:37px; padding:0 14px; border:1px solid #ecd9d7; border-radius:9px; background:#fff8f7; color:#a34d42; font:650 11px 'DM Sans',sans-serif; cursor:pointer; }
    .signout-button:hover { background:#fff0ed; }
    .unavailable { margin-bottom:14px; }
    @media(max-width:700px) { .page-heading { margin-top:2px; }.settings-grid { grid-template-columns:1fr; }.settings-card { padding:17px; } }
    @media(max-width:420px) { .signout-panel { align-items:flex-start; flex-direction:column; }.signout-button { width:100%; } }
  `,
})
export class SettingsPageComponent {
  protected readonly auth = inject(AuthService);

  protected initials(name: string): string {
    return name.trim().slice(0, 2).toUpperCase() || 'SS';
  }

  protected expiration(): Date | null {
    return this.auth.getTokenExpiration();
  }
}
