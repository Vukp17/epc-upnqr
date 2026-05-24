import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { HealthStatusComponent } from '../components/health-status/health-status.component';

@Component({
  selector: 'app-landing-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, HealthStatusComponent],
  template: `
    <div class="landing">

      <header class="topbar">
        <div class="topbar-inner">
          <a routerLink="/convert" class="brand">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="10" fill="#163300"/>
              <rect x="7" y="7" width="7" height="7" rx="1.5" fill="#9FE870"/>
              <rect x="18" y="7" width="7" height="7" rx="1.5" fill="#9FE870"/>
              <rect x="7" y="18" width="7" height="7" rx="1.5" fill="#9FE870"/>
              <rect x="19" y="19" width="2" height="2" fill="#9FE870"/>
              <rect x="23" y="19" width="2" height="2" fill="#9FE870"/>
              <rect x="19" y="23" width="2" height="2" fill="#9FE870"/>
              <rect x="23" y="23" width="2" height="2" fill="#9FE870"/>
            </svg>
            <span class="brand-name">PayConvert</span>
          </a>
          <div class="topbar-right">
            <app-health-status></app-health-status>
            <a routerLink="/login" class="signin-btn">Sign in</a>
          </div>
        </div>
      </header>

      <div class="hero">
        <div class="hero-inner">
          <div class="hero-tag">Free · No account needed</div>
          <h1>Convert UPN payments<br>to EPC in seconds</h1>
          <p class="hero-sub">Upload your payment slip PDF or paste the payment string — get an EPC QR code instantly. Sign in to save history and track transactions.</p>
        </div>
      </div>

      <main class="content">
        <router-outlet></router-outlet>
      </main>

    </div>
  `,
  styles: [`
    .landing {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #FAFAF8;
    }

    /* Topbar */
    .topbar {
      background: #fff;
      border-bottom: 1px solid #E8E8E8;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .topbar-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 24px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .brand-name {
      font-size: 20px;
      font-weight: 700;
      color: #163300;
      letter-spacing: -0.3px;
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .signin-btn {
      padding: 8px 20px;
      background: #163300;
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      border-radius: 999px;
      text-decoration: none;
      transition: background 0.15s;
      letter-spacing: -0.2px;
    }
    .signin-btn:hover { background: #1f4a00; }

    /* Hero */
    .hero {
      background: #fff;
      border-bottom: 1px solid #E8E8E8;
    }
    .hero-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 52px 24px 44px;
    }
    .hero-tag {
      display: inline-block;
      padding: 4px 12px;
      background: #F0FAE8;
      border: 1px solid #BBF7D0;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      color: #166534;
      letter-spacing: 0.03em;
      margin-bottom: 20px;
    }
    .hero-inner h1 {
      font-size: clamp(32px, 5vw, 52px);
      font-weight: 800;
      line-height: 1.08;
      color: #163300;
      letter-spacing: -1.5px;
      margin-bottom: 16px;
    }
    .hero-sub {
      font-size: 17px;
      color: #637074;
      max-width: 560px;
      line-height: 1.65;
    }

    /* Content */
    .content {
      flex: 1;
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
      padding: 36px 24px 64px;
    }

    @media (max-width: 640px) {
      .topbar-inner, .hero-inner, .content { padding-left: 16px; padding-right: 16px; }
      .hero-inner { padding-top: 32px; padding-bottom: 28px; }
    }
  `]
})
export class LandingLayoutComponent {}
