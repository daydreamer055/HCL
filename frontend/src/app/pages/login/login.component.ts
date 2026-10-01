import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoadingComponent } from '../../components/loading/loading.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingComponent],
  template: `
    <app-loading />
    <main class="login-page">
      <section class="form-panel">
        <div class="login-card">
          <a class="brand" routerLink="/login" aria-label="StockSmart home">
            <span class="brand-mark">S</span>
            <span>stock<span class="brand-light">smart</span></span>
          </a>
          <span class="overline">STOCKSMART · RETAIL INVENTORY</span>
          <h2>Sign in to your workspace</h2>
          <p class="hint">Choose how you’d like to access your account.</p>

          @if (apiError) {
            <div class="api-error" role="alert">{{ apiError }}</div>
          }

          <section class="credential-card" aria-labelledby="credential-title">
            <div class="credential-heading">
              <span class="credential-icon" aria-hidden="true">⚿</span>
              <div>
                <h3 id="credential-title">Email and password</h3>
                <p>Use your StockSmart account credentials</p>
              </div>
            </div>
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <label for="email">Email address</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                autocomplete="username"
                inputmode="email"
                placeholder="you@company.com"
                [attr.aria-invalid]="email.invalid && email.touched"
                [attr.aria-describedby]="email.invalid && email.touched ? 'email-error' : null"
              />
              @if (email.touched && email.hasError('required')) {
                <span class="field-error" id="email-error">Email is required.</span>
              } @else if (email.touched && email.hasError('email')) {
                <span class="field-error" id="email-error">Enter a valid email address.</span>
              }

              <label for="password">Password</label>
              <div class="password-field">
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="current-password"
                  placeholder="Enter your password"
                  [attr.aria-invalid]="password.invalid && password.touched"
                  [attr.aria-describedby]="password.invalid && password.touched ? 'password-error' : null"
                />
                <button
                  class="visibility-toggle"
                  type="button"
                  [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
                  [attr.aria-pressed]="showPassword"
                  (click)="showPassword = !showPassword"
                >
                  {{ showPassword ? 'Hide' : 'Show' }}
                </button>
              </div>
              @if (password.touched && password.hasError('required')) {
                <span class="field-error password-error" id="password-error">Password is required.</span>
              }

              <button class="submit-button" type="submit" [disabled]="form.invalid || submitting">
                @if (submitting) {
                  <span class="button-spinner" aria-hidden="true"></span>
                  Signing in…
                } @else {
                  Continue <span aria-hidden="true">→</span>
                }
              </button>
            </form>
          </section>

          <p class="security-note">
            <span aria-hidden="true">⌑</span>
            Your account is protected by secure authentication.
          </p>
        </div>
        <span class="copyright">© {{ year }} StockSmart · Retail Inventory Management</span>
      </section>
    </main>
  `,
  styles: `
    :host { display:block; min-height:100vh; }
    .login-page { min-height:100vh; display:flex; justify-content:center; padding:clamp(42px,9vh,82px) 24px 28px; background:#f7f9f5; }
    .form-panel { width:min(100%,718px); }
    .login-card { width:100%; }
    .brand { display:inline-flex; align-items:center; gap:9px; margin-bottom:42px; color:#17271d; font:800 19px 'Manrope',sans-serif; letter-spacing:-.06em; }
    .brand-mark { width:30px; height:30px; display:inline-grid; flex:0 0 auto; place-items:center; border-radius:9px; background:#258352; color:#fff; font:800 17px 'Manrope',sans-serif; }
    .brand-light { color:#278555; }
    .overline { display:block; color:#4a8060; font-size:10px; font-weight:800; letter-spacing:.15em; }
    h2 { margin:15px 0 8px; color:#17211c; font:800 clamp(25px,4vw,34px)/1.2 'Manrope',sans-serif; letter-spacing:-.045em; }
    .hint { margin:0 0 35px; color:#77837b; font-size:14px; }
    .credential-card { padding:25px 26px 24px; border:1px solid #d9e3dd; border-radius:14px; background:#fff; box-shadow:0 5px 18px #17392408; }
    .credential-heading { display:flex; align-items:center; gap:14px; margin-bottom:22px; }
    .credential-icon { display:grid; width:42px; height:42px; flex:0 0 auto; place-items:center; border-radius:11px; background:#f1f6f1; color:#398254; font-size:23px; }
    .credential-heading h3 { margin:0; color:#27392e; font:750 15px 'Manrope',sans-serif; }
    .credential-heading p { margin:5px 0 0; color:#849087; font-size:11px; }
    form { display:grid; }
    label { margin:0 0 8px; color:#34453a; font-size:11px; font-weight:700; }
    input { width:100%; height:46px; margin-bottom:18px; padding:0 13px; border:1px solid #dce5df; border-radius:8px; outline:none; background:#fff; color:#24332a; font-size:12px; }
    input:focus { border-color:#51a874; box-shadow:0 0 0 3px #e6f4ea; }
    input[aria-invalid="true"] { border-color:#d66b6b; }
    input::placeholder { color:#a3ada6; }
    .password-field { position:relative; }
    .password-field input { padding-right:64px; }
    .visibility-toggle { position:absolute; top:14px; right:11px; padding:5px; border:0; background:transparent; color:#39845a; font-size:10px; font-weight:700; cursor:pointer; }
    .visibility-toggle:focus-visible { outline:2px solid #51a874; outline-offset:2px; border-radius:4px; }
    .field-error { margin:-12px 0 15px; color:#bd4242; font-size:10px; }
    .password-error { margin:-12px 0 0; }
    .api-error { margin:0 0 17px; padding:11px 13px; border:1px solid #f0cece; border-radius:9px; background:#fff6f6; color:#a43636; font-size:11px; line-height:1.5; }
    .submit-button { min-height:45px; display:flex; justify-content:center; align-items:center; gap:10px; margin-top:7px; border:0; border-radius:8px; background:#28794b; color:#fff; font-size:12px; font-weight:700; cursor:pointer; }
    .submit-button:hover:not(:disabled) { background:#1d673e; }
    .submit-button:disabled { opacity:.56; cursor:not-allowed; }
    .button-spinner { width:14px; height:14px; border:2px solid #ffffff70; border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .security-note { display:flex; align-items:center; justify-content:center; gap:8px; margin:22px 0 0; color:#829087; font-size:10px; text-align:center; }
    .security-note span { color:#378254; }
    .copyright { display:block; margin-top:48px; color:#9aa49d; font-size:9px; text-align:center; }
    @media(max-width:560px) { .login-page { padding:32px 17px 22px; }.brand { margin-bottom:37px; }.hint { margin-bottom:25px; }.credential-card { padding:19px 16px; }.credential-heading { gap:11px; }.credential-heading h3 { font-size:13px; }.credential-heading p { font-size:10px; }.copyright { margin-top:35px; } }
  `,
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly year = new Date().getFullYear();
  protected submitting = false;
  protected showPassword = false;
  protected apiError: string | null = null;
  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected get email() {
    return this.form.controls.email;
  }

  protected get password() {
    return this.form.controls.password;
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.apiError = null;
    this.submitting = true;
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        void this.router.navigate(['/dashboard']);
      },
      error: (error: unknown) => {
        this.apiError = this.getApiErrorMessage(error);
        this.submitting = false;
      },
      complete: () => {
        this.submitting = false;
      },
    });
  }

  private getApiErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body: unknown = error.error;
      if (typeof body === 'object' && body !== null && 'message' in body
          && typeof body.message === 'string' && body.message.trim()) {
        return body.message;
      }
      if (error.status === 0) {
        return 'Could not connect to StockSmart. Check the backend connection and try again.';
      }
      if (error.status === 401 || error.status === 403) {
        return 'The email or password you entered is incorrect.';
      }
    }
    return 'Sign in failed. Please try again.';
  }
}
