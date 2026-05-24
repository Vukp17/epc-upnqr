import { Component, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="dashboard">

      <!-- Sidebar -->
      <aside class="sidebar">
        <a routerLink="/convert" class="sidebar-brand">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="10" fill="#163300"/>
            <rect x="7" y="7" width="7" height="7" rx="1.5" fill="#9FE870"/>
            <rect x="18" y="7" width="7" height="7" rx="1.5" fill="#9FE870"/>
            <rect x="7" y="18" width="7" height="7" rx="1.5" fill="#9FE870"/>
            <rect x="19" y="19" width="2" height="2" fill="#9FE870"/>
            <rect x="23" y="19" width="2" height="2" fill="#9FE870"/>
            <rect x="19" y="23" width="2" height="2" fill="#9FE870"/>
            <rect x="23" y="23" width="2" height="2" fill="#9FE870"/>
          </svg>
          <span class="brand-text">PayConvert</span>
        </a>

        <nav class="sidebar-nav">
          <a routerLink="/app/convert" routerLinkActive="active" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 16l-4-4 4-4"/><path d="M3 12h10a4 4 0 0 0 0-8h-1"/>
            </svg>
            Convert
          </a>
          <a routerLink="/app/transactions" routerLinkActive="active" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="16" height="14" rx="2"/>
              <line x1="2" y1="7" x2="18" y2="7"/>
              <line x1="6" y1="11" x2="10" y2="11"/>
              <line x1="6" y1="14" x2="8" y2="14"/>
            </svg>
            Transactions
          </a>
          <a routerLink="/app/mobile" routerLinkActive="active" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="1" width="10" height="18" rx="2"/>
              <line x1="9" y1="16" x2="11" y2="16"/>
            </svg>
            Mobile
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-row">
            <div class="user-avatar">{{ initials() }}</div>
            <div class="user-info">
              <span class="user-name">Signed in</span>
              <span class="user-role">Member</span>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
              <path d="M13 16l4-4-4-4"/><path d="M7 12h10"/>
              <path d="M7 4H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="main">
        <router-outlet></router-outlet>
      </main>

    </div>
  `,
  styles: [`
    .dashboard {
      display: flex;
      min-height: 100vh;
      background: #FAFAF8;
    }

    /* Sidebar */
    .sidebar {
      width: 220px;
      flex-shrink: 0;
      background: #fff;
      border-right: 1px solid #E8E8E8;
      display: flex;
      flex-direction: column;
      padding: 20px 12px;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      text-decoration: none;
      margin-bottom: 28px;
    }
    .brand-text {
      font-size: 16px;
      font-weight: 800;
      color: #163300;
      letter-spacing: -0.3px;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      color: #637074;
      text-decoration: none;
      transition: background 0.12s, color 0.12s;
    }
    .nav-item:hover { background: #F5F5F3; color: #163300; }
    .nav-item.active {
      background: #F0FAE8;
      color: #163300;
    }
    .nav-item.active .nav-icon { color: #16A34A; }

    .nav-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    /* Sidebar footer */
    .sidebar-footer {
      padding-top: 16px;
      border-top: 1px solid #E8E8E8;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .user-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px;
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #163300;
      color: #9FE870;
      font-size: 12px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      letter-spacing: 0.04em;
    }
    .user-info { display: flex; flex-direction: column; gap: 1px; }
    .user-name { font-size: 13px; font-weight: 700; color: #163300; }
    .user-role { font-size: 11px; color: #9CA3AF; font-weight: 500; }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 9px 12px;
      background: none;
      border: 1px solid #E8E8E8;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      color: #637074;
      cursor: pointer;
      transition: background 0.12s, color 0.12s, border-color 0.12s;
    }
    .logout-btn:hover {
      background: #FEF2F2;
      color: #991B1B;
      border-color: #FECACA;
    }

    /* Main */
    .main {
      flex: 1;
      padding: 36px 32px 64px;
      min-width: 0;
    }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main { padding: 20px 16px 48px; }
    }
  `]
})
export class DashboardLayoutComponent {
  initials = computed(() => 'ME');

  constructor(private auth: AuthService, private router: Router) {}

  logout(): void {
    this.auth.clearToken();
    this.router.navigate(['/convert']);
  }
}
