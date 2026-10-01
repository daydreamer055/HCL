import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthenticatedUser, LoginRequest, LoginResponse } from '../../models/api.models';

const TOKEN_KEY = 'stocksmart.accessToken';
const USER_KEY = 'stocksmart.authenticatedUser';
const ALLOWED_ROLES = ['ADMIN', 'INVENTORY_MANAGER', 'STAFF'];

interface TokenClaims {
  sub?: unknown;
  roles?: unknown;
  exp?: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenState = signal<string | null>(this.readStoredToken());
  readonly currentUser = signal<AuthenticatedUser | null>(this.readAuthenticatedUser());

  readonly isAuthenticated = this.tokenState.asReadonly();

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          if (!response.accessToken) {
            throw new Error('Authentication response did not contain an access token.');
          }
          localStorage.setItem(TOKEN_KEY, response.accessToken);
          this.tokenState.set(response.accessToken);
          localStorage.setItem(USER_KEY, JSON.stringify(response.user));
          this.currentUser.set(response.user);
        }),
      );
  }

  getAccessToken(): string | null {
    return this.isSessionValid() ? this.tokenState() : null;
  }

  isSessionValid(): boolean {
    const token = this.tokenState();
    if (!token) return false;
    const expiration = this.readTokenClaims(token)?.exp;
    if (typeof expiration === 'number' && expiration * 1000 > Date.now()) return true;
    this.clearSession();
    return false;
  }

  hasRole(role: string): boolean {
    return this.isSessionValid() && (this.currentUser()?.roles.includes(role) ?? false);
  }

  getTokenExpiration(): Date | null {
    const claims = this.readTokenClaims(this.getAccessToken());
    return typeof claims?.exp === 'number' ? new Date(claims.exp * 1000) : null;
  }

  logout(redirectToLogin = true): void {
    this.clearSession();
    if (redirectToLogin) {
      void this.router.navigate(['/login']);
    }
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenState.set(null);
    this.currentUser.set(null);
  }

  private readStoredToken(): string | null {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);
  }

  private readAuthenticatedUser(): AuthenticatedUser | null {
    const token = this.readStoredToken();
    const claims = this.readTokenClaims(token);
    if (!claims || typeof claims.sub !== 'string') return null;
    const cached = this.readCachedUser();
    const roles = Array.isArray(claims.roles)
      ? claims.roles.filter((role): role is string => typeof role === 'string' && ALLOWED_ROLES.includes(role))
      : [];
    return {
      id: cached?.id ?? 0,
      username: cached?.username || claims.sub,
      email: claims.sub,
      roles,
    };
  }

  private readCachedUser(): AuthenticatedUser | null {
    if (typeof localStorage === 'undefined') return null;
    const value = localStorage.getItem(USER_KEY);
    if (!value) return null;
    try {
      const parsed: unknown = JSON.parse(value);
      if (
        typeof parsed === 'object'
        && parsed !== null
        && 'id' in parsed
        && typeof parsed.id === 'number'
        && 'username' in parsed
        && typeof parsed.username === 'string'
        && 'email' in parsed
        && typeof parsed.email === 'string'
      ) {
        return {
          id: parsed.id,
          username: parsed.username,
          email: parsed.email,
          roles: [],
        };
      }
    } catch {
      return null;
    }
    return null;
  }

  private readTokenClaims(token: string | null): TokenClaims | null {
    if (!token || typeof atob === 'undefined') return null;
    const payload = token.split('.')[1];
    if (!payload) return null;
    try {
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded: unknown = JSON.parse(atob(normalized));
      return typeof decoded === 'object' && decoded !== null ? decoded : null;
    } catch {
      return null;
    }
  }
}
