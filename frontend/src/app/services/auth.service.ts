import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.model';

const TOKEN_KEY = 'payconvert_auth_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private token = signal<string | null>(null);
  readonly authenticated = computed(() => Boolean(this.token()));
  private apiBaseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {
    const existing = localStorage.getItem(TOKEN_KEY);
    this.token.set(existing);
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, payload).pipe(
      tap((response) => this.setToken(response.access_token))
    );
  }

  isAuthenticated(): boolean {
    return this.authenticated();
  }

  getToken(): string | null {
    return this.token();
  }

  setToken(token: string): void {
    const cleaned = token.trim();
    if (!cleaned) return;
    localStorage.setItem(TOKEN_KEY, cleaned);
    this.token.set(cleaned);
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
  }
}
