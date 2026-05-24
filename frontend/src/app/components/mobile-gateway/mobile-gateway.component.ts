import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MobileGatewayService } from '../../services/mobile-gateway.service';
import { AuthService } from '../../services/auth.service';
import {
  MobileConversionResponse,
  MobileHistoryResponse,
  MobileInsightsResponse,
  MobileCapabilitiesResponse,
  MobileHealthResponse,
} from '../../models/mobile.model';

type MobileTab = 'health' | 'scan-upn' | 'scan-pdf' | 'history' | 'insights' | 'capabilities';

@Component({
  selector: 'app-mobile-gateway',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mobile-panel">

      <!-- Sub-nav -->
      <nav class="mobile-nav">
        <button *ngFor="let t of tabs" class="mnav-btn" [class.active]="activeTab() === t.id" (click)="setTab(t.id)">
          {{ t.label }}
          <span *ngIf="isProtectedTab(t.id) && !isAuthenticated()" class="lock-tag">Locked</span>
        </button>
      </nav>

      <ng-template #authRequired>
        <div class="locked-card">
          <div class="locked-title">Login required</div>
          <p>History, insights, and capabilities are available only to logged-in users.</p>
          <button class="action-btn" (click)="goLogin()">Sign in</button>
        </div>
      </ng-template>

      <!-- Health -->
      <section *ngIf="activeTab() === 'health'" class="mob-section">
        <div class="section-header">
          <h3>Mobile Health</h3>
          <button class="action-btn" (click)="loadHealth()" [disabled]="healthLoading()">
            {{ healthLoading() ? 'Checking…' : 'Check' }}
          </button>
        </div>
        <div *ngIf="healthError()" class="error-msg">{{ healthError() }}</div>
        <div *ngIf="health()" class="json-block">
          <div class="status-row">
            <span class="status-dot" [class.ok]="health()!.status === 'ok'"></span>
            <strong>{{ health()!.status }}</strong> — gateway: {{ health()!.gateway }}
          </div>
          <pre>{{ health() | json }}</pre>
        </div>
      </section>

      <!-- Scan UPN -->
      <section *ngIf="activeTab() === 'scan-upn'" class="mob-section">
        <h3>Scan UPN String</h3>
        <div class="form-group">
          <textarea
            [(ngModel)]="upnPayload"
            [disabled]="scanUpnLoading()"
            placeholder="Paste UPN QR code string here…"
            class="upn-textarea"
            rows="5"
          ></textarea>
        </div>
        <button class="action-btn" (click)="onScanUpn()" [disabled]="!upnPayload.trim() || scanUpnLoading()">
          {{ scanUpnLoading() ? 'Scanning…' : 'Scan' }}
        </button>
        <div *ngIf="scanUpnError()" class="error-msg">{{ scanUpnError() }}</div>
        <div *ngIf="scanUpnResult()" class="result-card">
          <h4>Payment Details</h4>
          <table class="data-table">
            <tr><td>Recipient</td><td>{{ scanUpnResult()!.payment.recipient ?? '—' }}</td></tr>
            <tr><td>Recipient Address</td><td>{{ scanUpnResult()!.payment.recipient_address ?? '—' }}</td></tr>
            <tr><td>Recipient City</td><td>{{ scanUpnResult()!.payment.recipient_city ?? '—' }}</td></tr>
            <tr><td>IBAN</td><td><code>{{ scanUpnResult()!.payment.iban ?? '—' }}</code></td></tr>
            <tr><td>Amount</td><td>{{ scanUpnResult()!.payment.amount !== null ? (scanUpnResult()!.payment.amount | number:'1.2-2') + ' ' + scanUpnResult()!.payment.currency : '—' }}</td></tr>
            <tr><td>Purpose Code</td><td>{{ scanUpnResult()!.payment.purpose_code ?? '—' }}</td></tr>
            <tr><td>Purpose</td><td>{{ scanUpnResult()!.payment.purpose ?? '—' }}</td></tr>
            <tr><td>Reference</td><td><code>{{ scanUpnResult()!.payment.reference ?? '—' }}</code></td></tr>
            <tr><td>Due Date</td><td>{{ scanUpnResult()!.payment.due_date ?? '—' }}</td></tr>
            <tr><td>Payer Name</td><td>{{ scanUpnResult()!.payment.payer_name ?? '—' }}</td></tr>
            <tr><td>Payer Address</td><td>{{ scanUpnResult()!.payment.payer_address ?? '—' }}</td></tr>
            <tr><td>Payer City</td><td>{{ scanUpnResult()!.payment.payer_city ?? '—' }}</td></tr>
            <tr><td>Control Code</td><td>{{ scanUpnResult()!.payment.control_code ?? '—' }}</td></tr>
          </table>
          <div *ngIf="scanUpnResult()!.qr.epc_qr_png_base64" class="qr-wrap">
            <img [src]="'data:image/png;base64,' + scanUpnResult()!.qr.epc_qr_png_base64" alt="EPC QR" class="qr-img" />
          </div>
        </div>
      </section>

      <!-- Scan PDF -->
      <section *ngIf="activeTab() === 'scan-pdf'" class="mob-section">
        <h3>Scan PDF</h3>
        <div class="form-group">
          <input id="mob-pdf-input" type="file" accept=".pdf" (change)="onMobFileSelected($event)" [disabled]="scanPdfLoading()" class="file-input" />
          <label for="mob-pdf-input" class="drop-zone" [class.drag-over]="mobDragOver()" [class.disabled]="scanPdfLoading()"
            (dragenter)="onDragEnter($event)" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
            <span class="drop-title">Drag & drop PDF here</span>
            <span class="drop-subtitle">or click to choose</span>
            <span *ngIf="mobFileName()" class="file-text">{{ mobFileName() }}</span>
          </label>
        </div>
        <button class="action-btn" (click)="onScanPdf()" [disabled]="!mobFile() || scanPdfLoading()">
          {{ scanPdfLoading() ? 'Scanning…' : 'Scan PDF' }}
        </button>
        <div *ngIf="scanPdfError()" class="error-msg">{{ scanPdfError() }}</div>
        <div *ngIf="scanPdfResult()" class="result-card">
          <h4>Payment Details</h4>
          <table class="data-table">
            <tr><td>Recipient</td><td>{{ scanPdfResult()!.payment.recipient ?? '—' }}</td></tr>
            <tr><td>Recipient Address</td><td>{{ scanPdfResult()!.payment.recipient_address ?? '—' }}</td></tr>
            <tr><td>Recipient City</td><td>{{ scanPdfResult()!.payment.recipient_city ?? '—' }}</td></tr>
            <tr><td>IBAN</td><td><code>{{ scanPdfResult()!.payment.iban ?? '—' }}</code></td></tr>
            <tr><td>Amount</td><td>{{ scanPdfResult()!.payment.amount !== null ? (scanPdfResult()!.payment.amount | number:'1.2-2') + ' ' + scanPdfResult()!.payment.currency : '—' }}</td></tr>
            <tr><td>Purpose Code</td><td>{{ scanPdfResult()!.payment.purpose_code ?? '—' }}</td></tr>
            <tr><td>Purpose</td><td>{{ scanPdfResult()!.payment.purpose ?? '—' }}</td></tr>
            <tr><td>Reference</td><td><code>{{ scanPdfResult()!.payment.reference ?? '—' }}</code></td></tr>
            <tr><td>Due Date</td><td>{{ scanPdfResult()!.payment.due_date ?? '—' }}</td></tr>
            <tr><td>Payer Name</td><td>{{ scanPdfResult()!.payment.payer_name ?? '—' }}</td></tr>
            <tr><td>Payer Address</td><td>{{ scanPdfResult()!.payment.payer_address ?? '—' }}</td></tr>
            <tr><td>Payer City</td><td>{{ scanPdfResult()!.payment.payer_city ?? '—' }}</td></tr>
            <tr><td>Control Code</td><td>{{ scanPdfResult()!.payment.control_code ?? '—' }}</td></tr>
          </table>
          <div *ngIf="scanPdfResult()!.qr.epc_qr_png_base64" class="qr-wrap">
            <img [src]="'data:image/png;base64,' + scanPdfResult()!.qr.epc_qr_png_base64" alt="EPC QR" class="qr-img" />
          </div>
        </div>
      </section>

      <!-- History -->
      <section *ngIf="activeTab() === 'history'" class="mob-section">
        <ng-container *ngIf="isAuthenticated(); else authRequired">
          <div class="section-header">
            <h3>Mobile History</h3>
            <button class="action-btn" (click)="loadHistory()" [disabled]="historyLoading()">
              {{ historyLoading() ? 'Loading…' : 'Refresh' }}
            </button>
          </div>
          <div *ngIf="historyError()" class="error-msg">{{ historyError() }}</div>
          <div *ngIf="history() && history()!.items.length === 0 && !historyLoading()" class="empty-state">No history yet.</div>
          <div *ngIf="history() && history()!.items.length > 0" class="table-wrap">
            <table class="data-table full">
              <thead>
                <tr><th>ID</th><th>Source</th><th>Recipient</th><th>Amount</th><th>Created</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of history()!.items">
                  <td><code>{{ item.id | slice:0:8 }}…</code></td>
                  <td>{{ item.source }}</td>
                  <td>{{ item.recipient_name ?? '—' }}</td>
                  <td>{{ item.amount !== null ? (item.amount | number:'1.2-2') + ' ' + item.currency : '—' }}</td>
                  <td>{{ item.created_at | date:'short' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </ng-container>
      </section>

      <!-- Insights -->
      <section *ngIf="activeTab() === 'insights'" class="mob-section">
        <ng-container *ngIf="isAuthenticated(); else authRequired">
          <div class="section-header">
            <h3>Mobile Insights</h3>
            <button class="action-btn" (click)="loadInsights()" [disabled]="insightsLoading()">
              {{ insightsLoading() ? 'Loading…' : 'Refresh' }}
            </button>
          </div>
          <div *ngIf="insightsError()" class="error-msg">{{ insightsError() }}</div>
          <pre *ngIf="insights()" class="json-pre">{{ insights() | json }}</pre>
        </ng-container>
      </section>

      <!-- Capabilities -->
      <section *ngIf="activeTab() === 'capabilities'" class="mob-section">
        <ng-container *ngIf="isAuthenticated(); else authRequired">
          <div class="section-header">
            <h3>Mobile Capabilities</h3>
            <button class="action-btn" (click)="loadCapabilities()" [disabled]="capsLoading()">
              {{ capsLoading() ? 'Loading…' : 'Refresh' }}
            </button>
          </div>
          <div *ngIf="capsError()" class="error-msg">{{ capsError() }}</div>
          <ul *ngIf="caps()" class="caps-list">
            <li *ngFor="let f of caps()!.features" class="cap-item">{{ f }}</li>
          </ul>
        </ng-container>
      </section>

    </div>
  `,
  styles: [`
    .mobile-panel {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .mobile-nav {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .mnav-btn {
      padding: 7px 16px;
      border: 1px solid rgba(44,95,150,0.3);
      border-radius: 22px;
      background: rgba(255,255,255,0.7);
      color: #2c5f96;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .mnav-btn.active, .mnav-btn:hover {
      background: linear-gradient(135deg, #2c5f96, #1a4a7a);
      color: #fff;
      border-color: transparent;
    }

    .lock-tag {
      margin-left: 6px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: rgba(44,95,150,0.12);
      color: #2c5f96;
    }

    .mob-section {
      background: rgba(255,255,255,0.84);
      border: 1px solid rgba(28,42,62,0.12);
      border-radius: 18px;
      padding: 20px;
      box-shadow: 0 10px 28px rgba(20,40,63,0.08);
    }

    .mob-section h3 {
      margin: 0 0 16px;
      font-size: 18px;
      color: #162843;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-header h3 { margin: 0; }

    .action-btn {
      padding: 7px 16px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #2c5f96, #1a4a7a);
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover:not(:disabled) { background: linear-gradient(135deg, #1a4a7a, #0e3360); }
    .action-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .form-group { margin-bottom: 16px; }

    .file-input { display: none; }

    .drop-zone {
      width: 100%;
      min-height: 100px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 14px;
      background: linear-gradient(180deg, #f9fbff, #eef4ff);
      border: 2px dashed #9fb7d9;
      border-radius: 10px;
      cursor: pointer;
      box-sizing: border-box;
      text-align: center;
      transition: all 0.2s;
    }

    .drop-zone:hover, .drop-zone.drag-over {
      border-color: #2f6fcc;
      background: linear-gradient(180deg, #eef5ff, #dae9ff);
    }

    .drop-zone.disabled { opacity: 0.6; cursor: not-allowed; }
    .drop-title { font-size: 14px; font-weight: 700; color: #1f3b64; }
    .drop-subtitle { font-size: 12px; color: #4c678a; }
    .file-text { font-size: 12px; font-weight: 600; color: #244573; word-break: break-all; }

    .upn-textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-family: monospace;
      font-size: 13px;
      resize: vertical;
      box-sizing: border-box;
    }

    .result-card {
      margin-top: 20px;
      padding: 16px;
      background: #f7faff;
      border: 1px solid rgba(44,95,150,0.18);
      border-radius: 12px;
    }

    .result-card h4 { margin: 0 0 12px; color: #162843; font-size: 15px; }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .data-table.full th {
      text-align: left;
      padding: 10px 12px;
      background: rgba(44,95,150,0.08);
      color: #1a2f4e;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      border-bottom: 2px solid rgba(44,95,150,0.15);
    }

    .data-table td {
      padding: 9px 0;
      border-bottom: 1px solid rgba(28,42,62,0.08);
      color: #2a3d54;
      vertical-align: middle;
    }

    .data-table.full td { padding: 9px 12px; }
    .data-table td:first-child { font-weight: 600; color: #4a6080; width: 30%; }
    .data-table tr:last-child td { border-bottom: none; }

    code {
      background: #f0f4f8;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }

    .qr-wrap {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }

    .qr-img {
      max-width: 240px;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    .table-wrap { overflow-x: auto; }

    .json-block { margin-top: 8px; }

    .status-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 14px;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #dc3545;
      flex-shrink: 0;
    }

    .status-dot.ok { background: #28a745; animation: pulse-green 2s infinite; }

    @keyframes pulse-green {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .json-pre {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      border: 1px solid #ddd;
    }

    .caps-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .cap-item {
      padding: 6px 14px;
      background: linear-gradient(135deg, #2c5f96, #1a4a7a);
      color: #fff;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }

    .error-msg {
      padding: 10px 14px;
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 28px;
      color: #6c88a8;
      font-size: 15px;
    }

    .locked-card {
      padding: 18px;
      border-radius: 14px;
      background: linear-gradient(180deg, #f7f9fb, #eef3f7);
      border: 1px solid rgba(44,95,150,0.15);
      color: #27415e;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .locked-title {
      font-size: 16px;
      font-weight: 700;
      color: #1f3b64;
    }
  `]
})
export class MobileGatewayComponent implements OnInit {
  tabs: { id: MobileTab; label: string }[] = [
    { id: 'health', label: 'Health' },
    { id: 'scan-upn', label: 'Scan UPN' },
    { id: 'scan-pdf', label: 'Scan PDF' },
    { id: 'history', label: 'History' },
    { id: 'insights', label: 'Insights' },
    { id: 'capabilities', label: 'Capabilities' },
  ];

  activeTab = signal<MobileTab>('health');

  health = signal<MobileHealthResponse | null>(null);
  healthLoading = signal(false);
  healthError = signal<string | null>(null);

  upnPayload = '';
  scanUpnResult = signal<MobileConversionResponse | null>(null);
  scanUpnLoading = signal(false);
  scanUpnError = signal<string | null>(null);

  mobFile = signal<File | null>(null);
  mobFileName = signal<string | null>(null);
  mobDragOver = signal(false);
  scanPdfResult = signal<MobileConversionResponse | null>(null);
  scanPdfLoading = signal(false);
  scanPdfError = signal<string | null>(null);

  history = signal<MobileHistoryResponse | null>(null);
  historyLoading = signal(false);
  historyError = signal<string | null>(null);

  insights = signal<MobileInsightsResponse | null>(null);
  insightsLoading = signal(false);
  insightsError = signal<string | null>(null);

  caps = signal<MobileCapabilitiesResponse | null>(null);
  capsLoading = signal(false);
  capsError = signal<string | null>(null);

  constructor(
    private mobileService: MobileGatewayService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadHealth();
  }

  setTab(tab: MobileTab): void {
    this.activeTab.set(tab);
    if (tab === 'health' && !this.health()) this.loadHealth();
    if (this.isProtectedTab(tab) && !this.isAuthenticated()) return;
    if (tab === 'history' && !this.history()) this.loadHistory();
    if (tab === 'insights' && !this.insights()) this.loadInsights();
    if (tab === 'capabilities' && !this.caps()) this.loadCapabilities();
  }

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  isProtectedTab(tab: MobileTab): boolean {
    return tab === 'history' || tab === 'insights' || tab === 'capabilities';
  }

  goLogin(): void {
    this.router.navigate(['/login'], { queryParams: { redirect: '/mobile' } });
  }

  loadHealth(): void {
    this.healthLoading.set(true);
    this.healthError.set(null);
    this.mobileService.checkHealth().subscribe({
      next: (h) => { this.health.set(h); this.healthLoading.set(false); },
      error: (e) => { this.healthError.set(e.error?.detail ?? 'Failed to reach mobile gateway'); this.healthLoading.set(false); },
    });
  }

  onScanUpn(): void {
    const payload = this.upnPayload.trim();
    if (!payload) return;
    this.scanUpnLoading.set(true);
    this.scanUpnError.set(null);
    this.scanUpnResult.set(null);
    this.mobileService.scanUpn(payload).subscribe({
      next: (r) => { this.scanUpnResult.set(r); this.scanUpnLoading.set(false); this.upnPayload = ''; },
      error: (e) => { this.scanUpnError.set(e.error?.detail ?? 'Scan failed'); this.scanUpnLoading.set(false); },
    });
  }

  onMobFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.applyFile(input.files?.[0] ?? null);
  }

  onDragEnter(e: DragEvent): void { e.preventDefault(); if (!this.scanPdfLoading()) this.mobDragOver.set(true); }
  onDragOver(e: DragEvent): void { e.preventDefault(); if (!this.scanPdfLoading()) this.mobDragOver.set(true); }
  onDragLeave(e: DragEvent): void { e.preventDefault(); this.mobDragOver.set(false); }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.mobDragOver.set(false);
    if (!this.scanPdfLoading()) this.applyFile(e.dataTransfer?.files[0] ?? null);
  }

  private applyFile(file: File | null): void {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.scanPdfError.set('Only PDF files are supported.');
      return;
    }
    this.mobFile.set(file);
    this.mobFileName.set(file.name);
    this.scanPdfError.set(null);
  }

  onScanPdf(): void {
    const file = this.mobFile();
    if (!file) return;
    this.scanPdfLoading.set(true);
    this.scanPdfError.set(null);
    this.scanPdfResult.set(null);
    this.mobileService.scanPdf(file).subscribe({
      next: (r) => { this.scanPdfResult.set(r); this.scanPdfLoading.set(false); this.mobFile.set(null); this.mobFileName.set(null); },
      error: (e) => { this.scanPdfError.set(e.error?.detail ?? 'Scan failed'); this.scanPdfLoading.set(false); },
    });
  }

  loadHistory(): void {
    if (!this.isAuthenticated()) return;
    this.historyLoading.set(true);
    this.historyError.set(null);
    this.mobileService.getHistory(20).subscribe({
      next: (h) => { this.history.set(h); this.historyLoading.set(false); },
      error: (e) => { this.historyError.set(e.error?.detail ?? 'Failed to load history'); this.historyLoading.set(false); },
    });
  }

  loadInsights(): void {
    if (!this.isAuthenticated()) return;
    this.insightsLoading.set(true);
    this.insightsError.set(null);
    this.mobileService.getInsights().subscribe({
      next: (i) => { this.insights.set(i); this.insightsLoading.set(false); },
      error: (e) => { this.insightsError.set(e.error?.detail ?? 'Failed to load insights'); this.insightsLoading.set(false); },
    });
  }

  loadCapabilities(): void {
    if (!this.isAuthenticated()) return;
    this.capsLoading.set(true);
    this.capsError.set(null);
    this.mobileService.getCapabilities().subscribe({
      next: (c) => { this.caps.set(c); this.capsLoading.set(false); },
      error: (e) => { this.capsError.set(e.error?.detail ?? 'Failed to load capabilities'); this.capsLoading.set(false); },
    });
  }
}
