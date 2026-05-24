import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QrConverterService } from '../services/qr-converter.service';
import { RecentConversionItem } from '../models/recent-conversions.model';
import { StatsResponse } from '../models/stats.model';

@Component({
  selector: 'app-observability',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">

      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-num">{{ stats()?.total_conversions ?? '—' }}</span>
          <span class="stat-lbl">Total conversions</span>
        </div>
        <div class="stat-card green">
          <span class="stat-num">{{ stats()?.pdf_conversions ?? '—' }}</span>
          <span class="stat-lbl">PDF uploads</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ stats()?.string_conversions ?? '—' }}</span>
          <span class="stat-lbl">Payment strings</span>
        </div>
      </div>

      <!-- Recent table -->
      <div class="table-card">
        <div class="table-header">
          <h3>Recent transactions</h3>
          <div class="actions">
            <button class="btn-outline" (click)="loadRecent()" [disabled]="recentLoading()">
              {{ recentLoading() ? 'Loading…' : 'Refresh' }}
            </button>
            <button class="btn-danger" (click)="onDelete()" [disabled]="deleteLoading()">
              {{ deleteLoading() ? 'Clearing…' : 'Clear all' }}
            </button>
          </div>
        </div>

        @if (recentError()) {
          <div class="err-bar">{{ recentError() }}</div>
        }
        @if (deleteMsg()) {
          <div class="ok-bar">{{ deleteMsg() }}</div>
        }

        @if (recentItems().length === 0 && !recentLoading()) {
          <div class="empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>No transactions yet. Convert a payment to see it here.</p>
          </div>
        }

        @if (recentItems().length > 0) {
          <div class="table-wrap">
            <table class="tbl">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Recipient</th>
                  <th>IBAN</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (item of recentItems(); track item.id) {
                  <tr>
                    <td>
                      <span class="badge" [class.pdf]="item.source === 'pdf-upnqr'">
                        {{ item.source === 'pdf-upnqr' ? 'PDF' : 'String' }}
                      </span>
                    </td>
                    <td>{{ item.recipient_name ?? '—' }}</td>
                    <td class="mono">{{ item.iban ?? '—' }}</td>
                    <td class="amount">
                      {{ item.amount !== null ? (item.amount | number:'1.2-2') : '—' }}
                      {{ item.amount !== null ? item.currency : '' }}
                    </td>
                    <td class="muted">{{ item.created_at | date:'dd MMM, HH:mm' }}</td>
                    <td class="actions-cell">
                      @if (item.has_pdf) {
                        <button class="btn-pdf" (click)="viewPdf(item)" [disabled]="pdfLoadingId() === item.id" title="Preview PDF">
                          @if (pdfLoadingId() === item.id) {
                            <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                          } @else {
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M4 4h8l4 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>
                              <polyline points="12,4 12,8 16,8"/>
                            </svg>
                            View PDF
                          }
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .stat-card {
      background: #fff;
      border: 1.5px solid #E8E8E8;
      border-radius: 18px;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .stat-card.green { border-color: #BBF7D0; background: #F0FDF4; }

    .stat-num { font-size: 40px; font-weight: 800; color: #163300; line-height: 1; letter-spacing: -1px; }
    .stat-lbl { font-size: 13px; color: #637074; font-weight: 500; }

    .table-card {
      background: #fff;
      border: 1.5px solid #E8E8E8;
      border-radius: 18px;
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #F3F4F6;
      gap: 12px;
      flex-wrap: wrap;
    }

    .table-header h3 { font-size: 17px; font-weight: 700; color: #163300; }

    .actions { display: flex; gap: 8px; }

    .btn-outline {
      padding: 8px 16px;
      background: #fff;
      border: 1.5px solid #E8E8E8;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      color: #163300;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .btn-outline:hover:not(:disabled) { border-color: #9FE870; }
    .btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-danger {
      padding: 8px 16px;
      background: #FEF2F2;
      border: 1.5px solid #FECACA;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      color: #991B1B;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-danger:hover:not(:disabled) { background: #FEE2E2; }
    .btn-danger:disabled { opacity: 0.4; cursor: not-allowed; }

    .err-bar { margin: 0 24px 16px; padding: 12px 14px; background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; border-radius: 10px; font-size: 14px; }
    .ok-bar  { margin: 0 24px 16px; padding: 12px 14px; background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; border-radius: 10px; font-size: 14px; }

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 56px 24px;
      color: #9CA3AF;
    }
    .empty p { font-size: 14px; text-align: center; }

    .table-wrap { overflow-x: auto; }

    .tbl { width: 100%; font-size: 14px; border-collapse: collapse; }
    .tbl th {
      text-align: left;
      padding: 12px 16px;
      font-size: 12px;
      font-weight: 700;
      color: #637074;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #FAFAF8;
      border-bottom: 1px solid #F3F4F6;
    }
    .tbl td {
      padding: 14px 16px;
      border-bottom: 1px solid #F9FAFB;
      color: #163300;
      vertical-align: middle;
    }
    .tbl tr:last-child td { border-bottom: none; }
    .tbl tr:hover td { background: #FAFAF8; }

    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #F3F4F6; color: #374151; }
    .badge.pdf { background: #DBEAFE; color: #1D4ED8; }

    .mono { font-family: 'SF Mono', 'Menlo', monospace; font-size: 12px; color: #374151; }
    .amount { font-weight: 700; }
    .muted { color: #9CA3AF; font-size: 13px; }

    .actions-cell { width: 110px; }

    .btn-pdf {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #F0FAE8;
      border: 1.5px solid #BBF7D0;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #166534;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.12s, border-color 0.12s;
    }
    .btn-pdf:hover:not(:disabled) { background: #DCFCE7; border-color: #86EFAC; }
    .btn-pdf:disabled { opacity: 0.5; cursor: not-allowed; }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.8s linear infinite; }

    @media (max-width: 600px) {
      .stats-row { grid-template-columns: 1fr; }
    }
  `]
})
export class ObservabilityComponent implements OnInit {
  stats = signal<StatsResponse | null>(null);
  statsLoading = signal(false);

  recentItems = signal<RecentConversionItem[]>([]);
  recentLoading = signal(false);
  recentError = signal<string | null>(null);

  deleteLoading = signal(false);
  deleteMsg = signal<string | null>(null);

  pdfLoadingId = signal<string | null>(null);

  constructor(private qrService: QrConverterService) {}

  ngOnInit(): void { this.loadStats(); this.loadRecent(); }

  loadStats(): void {
    this.statsLoading.set(true);
    this.qrService.getStats().subscribe({
      next: s => { this.stats.set(s); this.statsLoading.set(false); },
      error: () => this.statsLoading.set(false),
    });
  }

  loadRecent(): void {
    this.recentLoading.set(true);
    this.recentError.set(null);
    this.qrService.getRecentConversions().subscribe({
      next: r => { this.recentItems.set(r.items); this.recentLoading.set(false); },
      error: e => { this.recentError.set(e.error?.detail ?? 'Failed to load transactions'); this.recentLoading.set(false); },
    });
  }

  viewPdf(item: RecentConversionItem): void {
    this.pdfLoadingId.set(item.id);
    this.qrService.getPdf(item.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (win) {
          win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
        }
        this.pdfLoadingId.set(null);
      },
      error: () => {
        this.recentError.set('Failed to load PDF.');
        this.pdfLoadingId.set(null);
      },
    });
  }

  onDelete(): void {
    this.deleteLoading.set(true);
    this.deleteMsg.set(null);
    this.qrService.deleteConversions().subscribe({
      next: () => {
        this.deleteMsg.set('All transactions cleared.');
        this.deleteLoading.set(false);
        this.recentItems.set([]);
        this.loadStats();
      },
      error: e => { this.recentError.set(e.error?.detail ?? 'Failed to clear'); this.deleteLoading.set(false); },
    });
  }
}
