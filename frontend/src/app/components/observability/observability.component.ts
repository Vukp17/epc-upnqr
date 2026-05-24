import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QrConverterService } from '../../services/qr-converter.service';
import { RecentConversionItem } from '../../models/recent-conversions.model';
import { StatsResponse } from '../../models/stats.model';

@Component({
  selector: 'app-observability',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="obs-panel">

      <!-- Stats row -->
      <section class="obs-section">
        <div class="section-header">
          <h3>Conversion Stats</h3>
          <button class="action-btn refresh" (click)="loadStats()" [disabled]="statsLoading()">
            {{ statsLoading() ? 'Loading…' : 'Refresh' }}
          </button>
        </div>

        <div *ngIf="statsError()" class="error-msg">{{ statsError() }}</div>

        <div *ngIf="stats()" class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ stats()!.total_conversions }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-card pdf">
            <span class="stat-value">{{ stats()!.pdf_conversions }}</span>
            <span class="stat-label">PDF</span>
          </div>
          <div class="stat-card string">
            <span class="stat-value">{{ stats()!.string_conversions }}</span>
            <span class="stat-label">String</span>
          </div>
        </div>
      </section>

      <!-- Recent conversions -->
      <section class="obs-section">
        <div class="section-header">
          <h3>Recent Conversions</h3>
          <div class="header-actions">
            <button class="action-btn refresh" (click)="loadRecent()" [disabled]="recentLoading()">
              {{ recentLoading() ? 'Loading…' : 'Refresh' }}
            </button>
            <button class="action-btn danger" (click)="onDelete()" [disabled]="deleteLoading()">
              {{ deleteLoading() ? 'Deleting…' : 'Delete All' }}
            </button>
          </div>
        </div>

        <div *ngIf="recentError()" class="error-msg">{{ recentError() }}</div>
        <div *ngIf="deleteMsg()" class="success-msg">{{ deleteMsg() }}</div>

        <div *ngIf="recentItems().length === 0 && !recentLoading() && !recentError()" class="empty-state">
          No conversions recorded yet.
        </div>

        <div *ngIf="recentItems().length > 0" class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Source</th>
                <th>Recipient</th>
                <th>IBAN</th>
                <th>Amount</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of recentItems()">
                <td><code>{{ item.id | slice:0:8 }}…</code></td>
                <td><span class="source-badge" [class.pdf]="item.source === 'pdf-upnqr'">{{ item.source }}</span></td>
                <td>{{ item.recipient_name ?? '—' }}</td>
                <td><code>{{ item.iban ?? '—' }}</code></td>
                <td>{{ item.amount !== null ? (item.amount | number:'1.2-2') + ' ' + item.currency : '—' }}</td>
                <td>{{ item.created_at | date:'short' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  `,
  styles: [`
    .obs-panel {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .obs-section {
      background: rgba(255,255,255,0.84);
      border: 1px solid rgba(28,42,62,0.12);
      border-radius: 18px;
      padding: 20px;
      box-shadow: 0 10px 28px rgba(20,40,63,0.08);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      gap: 12px;
      flex-wrap: wrap;
    }

    .section-header h3 {
      margin: 0;
      font-size: 18px;
      color: #162843;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      padding: 7px 16px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn.refresh {
      background: linear-gradient(135deg, #2c5f96, #1a4a7a);
      color: #fff;
    }

    .action-btn.refresh:hover:not(:disabled) {
      background: linear-gradient(135deg, #1a4a7a, #0e3360);
    }

    .action-btn.danger {
      background: linear-gradient(135deg, #dc3545, #b02030);
      color: #fff;
    }

    .action-btn.danger:hover:not(:disabled) {
      background: linear-gradient(135deg, #b02030, #8a1520);
    }

    .action-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 18px 12px;
      border-radius: 14px;
      background: linear-gradient(180deg, #f4f8ff, #eef4ff);
      border: 1px solid rgba(44,95,150,0.18);
    }

    .stat-card.pdf { background: linear-gradient(180deg, #e3f2fd, #d9ecfd); border-color: rgba(25,118,210,0.2); }
    .stat-card.string { background: linear-gradient(180deg, #f3e5f5, #eedaf5); border-color: rgba(123,31,162,0.2); }

    .stat-value {
      font-size: 36px;
      font-weight: 800;
      color: #15223a;
      line-height: 1;
    }

    .stat-label {
      margin-top: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #4a6080;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .table-wrap {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .data-table th {
      text-align: left;
      padding: 10px 12px;
      background: rgba(44,95,150,0.08);
      color: #1a2f4e;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 2px solid rgba(44,95,150,0.15);
    }

    .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(28,42,62,0.08);
      color: #2a3d54;
      vertical-align: middle;
    }

    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: rgba(44,95,150,0.04); }

    code {
      background: #f0f4f8;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }

    .source-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .source-badge.pdf {
      background: #e3f2fd;
      color: #1976d2;
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

    .success-msg {
      padding: 10px 14px;
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
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

    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ObservabilityComponent implements OnInit {
  stats = signal<StatsResponse | null>(null);
  statsLoading = signal(false);
  statsError = signal<string | null>(null);

  recentItems = signal<RecentConversionItem[]>([]);
  recentLoading = signal(false);
  recentError = signal<string | null>(null);

  deleteLoading = signal(false);
  deleteMsg = signal<string | null>(null);

  constructor(private qrService: QrConverterService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadRecent();
  }

  loadStats(): void {
    this.statsLoading.set(true);
    this.statsError.set(null);
    this.qrService.getStats().subscribe({
      next: (s) => { this.stats.set(s); this.statsLoading.set(false); },
      error: (e) => { this.statsError.set(e.error?.detail ?? 'Failed to load stats'); this.statsLoading.set(false); },
    });
  }

  loadRecent(): void {
    this.recentLoading.set(true);
    this.recentError.set(null);
    this.qrService.getRecentConversions(20).subscribe({
      next: (r) => { this.recentItems.set(r.items); this.recentLoading.set(false); },
      error: (e) => { this.recentError.set(e.error?.detail ?? 'Failed to load recent conversions'); this.recentLoading.set(false); },
    });
  }

  onDelete(): void {
    this.deleteLoading.set(true);
    this.deleteMsg.set(null);
    this.qrService.deleteConversions().subscribe({
      next: (r) => {
        this.deleteMsg.set(r.message ?? 'All conversions deleted.');
        this.deleteLoading.set(false);
        this.recentItems.set([]);
        this.loadStats();
      },
      error: (e) => {
        this.recentError.set(e.error?.detail ?? 'Delete failed');
        this.deleteLoading.set(false);
      },
    });
  }
}
