import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-shell">
      <div class="auth-backdrop"></div>
      <div class="auth-card">
        <div class="auth-header">
          <span class="badge">Secure Access</span>
          <h2>Sign in to Transactions</h2>
          <p>Use your username and password to access transaction history and admin tools.</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <label class="field-label" for="username">Username</label>
          <input
            id="username"
            name="username"
            [(ngModel)]="username"
            autocomplete="username"
            class="text-input"
          />

          <label class="field-label" for="password">Password</label>
          <input
            id="password"
            name="password"
            [(ngModel)]="password"
            type="password"
            autocomplete="current-password"
            class="text-input"
          />

          <div *ngIf="error" class="error-msg">{{ error }}</div>

          <button class="primary-btn" type="submit" [disabled]="loading">
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <div class="auth-footer">
          <span>Need access?</span>
          <span class="hint">Ask your admin for credentials.</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-shell {
      position: relative;
      min-height: 70vh;
      display: grid;
      place-items: center;
      padding: 48px 16px 64px;
      overflow: hidden;
    }

    .auth-backdrop {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top left, rgba(159, 232, 112, 0.35), transparent 45%),
        radial-gradient(circle at bottom right, rgba(44, 95, 150, 0.25), transparent 55%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.6), rgba(250, 250, 248, 0.9));
      z-index: 0;
    }

    .auth-card {
      position: relative;
      z-index: 1;
      width: min(520px, 92vw);
      padding: 32px 30px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(22, 51, 0, 0.12);
      box-shadow: 0 20px 50px rgba(12, 31, 8, 0.12);
      backdrop-filter: blur(8px);
    }

    .auth-header h2 {
      font-size: 26px;
      margin: 10px 0 6px;
      color: #163300;
    }

    .auth-header p {
      color: #54635f;
      font-size: 14px;
      margin: 0 0 18px;
    }

    .badge {
      display: inline-flex;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: rgba(159, 232, 112, 0.25);
      color: #2f4a1b;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .field-label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #2f4a1b;
    }

    .text-input {
      width: 100%;
      border-radius: 12px;
      border: 1px solid rgba(22, 51, 0, 0.2);
      background: rgba(255, 255, 255, 0.95);
      padding: 12px;
      font-size: 13px;
    }

    .primary-btn {
      margin-top: 6px;
      padding: 10px 16px;
      border-radius: 10px;
      background: linear-gradient(135deg, #2f6a1b, #163300);
      color: #fff;
      font-weight: 700;
      border: none;
      cursor: pointer;
    }

    .primary-btn:hover {
      filter: brightness(0.95);
    }

    .error-msg {
      padding: 8px 12px;
      border-radius: 8px;
      background: rgba(220, 53, 69, 0.1);
      color: #8a1f2c;
      font-size: 13px;
    }

    .auth-footer {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
      color: #6c7a76;
    }

    .hint {
      font-weight: 600;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  onSubmit(): void {
    this.error = null;
    if (!this.username.trim() || !this.password) {
      this.error = 'Please enter your username and password.';
      return;
    }
    this.loading = true;
    this.auth.login({
      username: this.username.trim(),
      password: this.password,
    }).subscribe({
      next: () => {
        const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/app/transactions';
        this.router.navigateByUrl(redirect);
      },
      error: (e) => {
        this.error = e.error?.detail ?? 'Login failed.';
        this.loading = false;
      },
    });
  }
}
