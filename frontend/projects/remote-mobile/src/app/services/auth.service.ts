import { Injectable, computed, signal } from '@angular/core';

const TOKEN_KEY = 'payconvert_auth_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private token = signal<string | null>(null);
  readonly authenticated = computed(() => Boolean(this.token()));

  constructor() {
    const existing = localStorage.getItem(TOKEN_KEY);
    this.token.set(existing);
  }

  isAuthenticated(): boolean {
    return this.authenticated();
  }

  getToken(): string | null {
    return this.token();
  }
}
