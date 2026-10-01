import { Component } from '@angular/core';

@Component({
  selector: 'app-users-page',
  standalone: true,
  template: `
    <section class="page-heading">
      <div>
        <p class="eyebrow">STOCKSMART / ADMINISTRATION</p>
        <h1>Users</h1>
        <p class="description">User access and account management.</p>
      </div>
    </section>

    <section class="notice-panel" aria-labelledby="users-unavailable-title">
      <div class="notice-icon" aria-hidden="true">♙</div>
      <div class="notice-content">
        <span class="eyebrow">ADMIN ACCESS</span>
        <h2 id="users-unavailable-title">User management isn’t available yet</h2>
        <p>
          The StockSmart API currently supports sign-in, but it does not expose user-list,
          search, create, update, role-assignment, activation, or deletion endpoints.
          No user data or changes can be managed from this page.
        </p>
        <div class="supported-roles">
          <span class="supported-label">Roles recognized by authentication</span>
          <span class="role-badge">ADMIN</span>
          <span class="role-badge">INVENTORY_MANAGER</span>
          <span class="role-badge">STAFF</span>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host { display:block; color:#17211c; }
    .page-heading { margin:10px 0 24px; }
    .eyebrow { margin:0 0 10px; color:#78857d; font-size:11px; font-weight:700; letter-spacing:.13em; }
    h1 { margin:0; font:800 clamp(28px,3vw,38px)/1.15 'Manrope',sans-serif; letter-spacing:-.04em; }
    .description { margin:9px 0 0; color:#738078; font-size:14px; }
    .notice-panel { display:flex; gap:17px; padding:24px; border:1px solid #e5ece7; border-radius:15px; background:#fff; box-shadow:0 5px 22px #17392408; }
    .notice-icon { display:grid; width:44px; height:44px; flex:0 0 auto; place-items:center; border-radius:13px; background:#eef6f0; color:#348151; font-size:21px; }
    .notice-content { min-width:0; }
    .notice-content .eyebrow { margin:2px 0 8px; font-size:9px; }
    h2 { margin:0; color:#26392d; font:750 17px 'Manrope',sans-serif; }
    .notice-content>p { max-width:730px; margin:9px 0 0; color:#748078; font-size:12px; line-height:1.7; }
    .supported-roles { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:20px; }
    .supported-label { margin-right:4px; color:#758178; font-size:10px; }
    .role-badge { padding:6px 9px; border:1px solid #e4ebe6; border-radius:20px; background:#fafcfb; color:#526258; font-size:9px; font-weight:700; letter-spacing:.04em; }
    @media(max-width:560px) { .page-heading { margin-top:2px; }.notice-panel { gap:12px; padding:17px 15px; }.notice-icon { width:37px; height:37px; }.supported-roles { align-items:flex-start; }.supported-label { flex-basis:100%; } }
  `,
})
export class UsersPageComponent {}
