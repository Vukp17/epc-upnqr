import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MobileGatewayService } from '../services/mobile-gateway.service';
import { AuthService } from '../services/auth.service';
import {
  MobileConversionResponse,
  MobileHistoryResponse,
  MobileInsightsResponse,
  MobileHealthResponse,
} from '../models/mobile.model';

type Tab = 'scan-image' | 'scan-upn' | 'scan-pdf' | 'history' | 'insights';

@Component({
  selector: 'app-mobile-gateway',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">

      <div class="page-header">
        <div class="header-status">
          <span class="dot" [class.ok]="health()?.status === 'ok'"></span>
          <span class="status-text">{{ health()?.status === 'ok' ? 'Mobile gateway online' : 'Checking gateway…' }}</span>
        </div>
      </div>

      <nav class="tab-strip">
        <button *ngFor="let t of tabs" class="tab-btn" [class.active]="activeTab() === t.id" (click)="setTab(t.id)">
          {{ t.label }}
          <span *ngIf="isProtectedTab(t.id) && !isAuthenticated()" class="lock-tag">Locked</span>
        </button>
      </nav>

      <ng-template #authRequired>
        <div class="locked-card">
          <div class="locked-title">Login required</div>
          <p>History and insights are available only to logged-in users.</p>
          <button class="btn-primary" (click)="goLogin()">Sign in</button>
        </div>
      </ng-template>

      <!-- ── Scan image ─────────────────────────────────────────────────────── -->
      <div *ngIf="activeTab() === 'scan-image'" class="panel">
        <div class="panel-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#163300" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
        <h3>Scan QR from image</h3>
        <p class="panel-desc">Take a photo of a UPN payment slip or pick an image from your gallery. The QR code will be detected automatically.</p>

        <!-- Hidden inputs -->
        <input id="cam-input" type="file" accept="image/*" capture="environment"
          (change)="onImgSelected($event)" [disabled]="scanImgLoading()" class="file-input" />
        <input id="img-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif"
          (change)="onImgSelected($event)" [disabled]="scanImgLoading()" class="file-input" />

        <!-- Pick buttons -->
        <div class="pick-row">
          <label for="cam-input" class="pick-btn camera" [class.disabled]="scanImgLoading()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Take photo
          </label>
          <label for="img-input" class="pick-btn gallery" [class.disabled]="scanImgLoading()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Choose image
          </label>
        </div>

        <!-- Preview -->
        @if (imgPreviewUrl()) {
          <div class="img-preview-wrap">
            <img [src]="imgPreviewUrl()!" alt="Selected image" class="img-preview" />
            <button class="img-clear" (click)="clearImg()" [disabled]="scanImgLoading()" title="Remove">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        }

        <button class="btn-primary" (click)="onScanImage()" [disabled]="!imgFile() || scanImgLoading()">
          {{ scanImgLoading() ? 'Scanning…' : 'Detect & convert' }}
        </button>

        <div *ngIf="scanImgError()" class="err-bar">{{ scanImgError() }}</div>

        <div *ngIf="scanImgResult()" class="result-card">
          <div class="rc-header">Payment details</div>
          <div class="rc-rows">
            <div class="rc-row"><span class="rl">Recipient</span><span class="rv">{{ scanImgResult()!.payment.recipient ?? '—' }}</span></div>
            <div class="rc-row"><span class="rl">IBAN</span><span class="rv mono">{{ scanImgResult()!.payment.iban ?? '—' }}</span></div>
            <div class="rc-row"><span class="rl">Amount</span><span class="rv bold">{{ scanImgResult()!.payment.amount !== null ? (scanImgResult()!.payment.amount | number:'1.2-2') + ' ' + scanImgResult()!.payment.currency : '—' }}</span></div>
            <div class="rc-row"><span class="rl">Purpose</span><span class="rv">{{ scanImgResult()!.payment.purpose ?? '—' }}</span></div>
          </div>
          <div *ngIf="scanImgResult()!.qr.epc_qr_png_base64" class="qr-wrap">
            <p class="qr-label">EPC QR Code</p>
            <div class="qr-box">
              <img [src]="'data:image/png;base64,' + scanImgResult()!.qr.epc_qr_png_base64" alt="EPC QR" class="qr-img" />
            </div>
          </div>
        </div>
      </div>

      <!-- ── Scan UPN string ─────────────────────────────────────────────────── -->
      <div *ngIf="activeTab() === 'scan-upn'" class="panel">
        <div class="panel-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#163300" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
        </div>
        <h3>Paste payment string</h3>
        <p class="panel-desc">Paste the scanned UPN QR code content to convert it via the mobile gateway.</p>
        <textarea [(ngModel)]="upnPayload" [disabled]="scanUpnLoading()" placeholder="Paste payment string here…" class="textarea" rows="5"></textarea>
        <button class="btn-primary" (click)="onScanUpn()" [disabled]="!upnPayload.trim() || scanUpnLoading()">
          {{ scanUpnLoading() ? 'Converting…' : 'Convert' }}
        </button>
        <div *ngIf="scanUpnError()" class="err-bar">{{ scanUpnError() }}</div>
        <div *ngIf="scanUpnResult()" class="result-card">
          <div class="rc-header">Payment details</div>
          <div class="rc-rows">
            <div class="rc-row"><span class="rl">Recipient</span><span class="rv">{{ scanUpnResult()!.payment.recipient ?? '—' }}</span></div>
            <div class="rc-row"><span class="rl">IBAN</span><span class="rv mono">{{ scanUpnResult()!.payment.iban ?? '—' }}</span></div>
            <div class="rc-row"><span class="rl">Amount</span><span class="rv bold">{{ scanUpnResult()!.payment.amount !== null ? (scanUpnResult()!.payment.amount | number:'1.2-2') + ' ' + scanUpnResult()!.payment.currency : '—' }}</span></div>
            <div class="rc-row"><span class="rl">Purpose</span><span class="rv">{{ scanUpnResult()!.payment.purpose ?? '—' }}</span></div>
          </div>
          <div *ngIf="scanUpnResult()!.qr.epc_qr_png_base64" class="qr-wrap">
            <p class="qr-label">EPC QR Code</p>
            <div class="qr-box">
              <img [src]="'data:image/png;base64,' + scanUpnResult()!.qr.epc_qr_png_base64" alt="EPC QR" class="qr-img" />
            </div>
          </div>
        </div>
      </div>

      <!-- ── Scan PDF ────────────────────────────────────────────────────────── -->
      <div *ngIf="activeTab() === 'scan-pdf'" class="panel">
        <div class="panel-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#163300" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <h3>Upload payment slip</h3>
        <p class="panel-desc">Upload your PDF payment slip via the mobile gateway.</p>
        <input id="mob-pdf" type="file" accept=".pdf" (change)="onFileSelected($event)" [disabled]="scanPdfLoading()" class="file-input" />
        <label for="mob-pdf" class="drop-zone" [class.has-file]="!!mobFileName()" [class.drag-over]="mobDragOver()" [class.disabled]="scanPdfLoading()"
          (dragenter)="onDragEnter($event)" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
          @if (mobFileName()) {
            <span class="file-name">{{ mobFileName() }}</span>
            <span class="change-hint">Click to change</span>
          } @else {
            <span class="drop-label">Drop PDF or <u>browse</u></span>
          }
        </label>
        <button class="btn-primary" (click)="onScanPdf()" [disabled]="!mobFile() || scanPdfLoading()">
          {{ scanPdfLoading() ? 'Converting…' : 'Convert' }}
        </button>
        <div *ngIf="scanPdfError()" class="err-bar">{{ scanPdfError() }}</div>
        <div *ngIf="scanPdfResult()" class="result-card">
          <div class="rc-header">Payment details</div>
          <div class="rc-rows">
            <div class="rc-row"><span class="rl">Recipient</span><span class="rv">{{ scanPdfResult()!.payment.recipient ?? '—' }}</span></div>
            <div class="rc-row"><span class="rl">IBAN</span><span class="rv mono">{{ scanPdfResult()!.payment.iban ?? '—' }}</span></div>
            <div class="rc-row"><span class="rl">Amount</span><span class="rv bold">{{ scanPdfResult()!.payment.amount !== null ? (scanPdfResult()!.payment.amount | number:'1.2-2') + ' ' + scanPdfResult()!.payment.currency : '—' }}</span></div>
          </div>
          <div *ngIf="scanPdfResult()!.qr.epc_qr_png_base64" class="qr-wrap">
            <p class="qr-label">EPC QR Code</p>
            <div class="qr-box">
              <img [src]="'data:image/png;base64,' + scanPdfResult()!.qr.epc_qr_png_base64" alt="EPC QR" class="qr-img" />
            </div>
          </div>
        </div>
      </div>

      <!-- ── History ────────────────────────────────────────────────────────── -->
      <div *ngIf="activeTab() === 'history'" class="panel">
        <ng-container *ngIf="isAuthenticated(); else authRequired">
          <div class="section-hdr">
            <h3>Transaction history</h3>
            <button class="btn-outline" (click)="loadHistory()" [disabled]="historyLoading()">{{ historyLoading() ? 'Loading…' : 'Refresh' }}</button>
          </div>
          <div *ngIf="historyError()" class="err-bar">{{ historyError() }}</div>
          <div *ngIf="!historyLoading() && (!history() || history()!.items.length === 0)" class="empty">No transactions yet.</div>
          <div *ngIf="history() && history()!.items.length > 0" class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Source</th><th>IBAN</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>
                <tr *ngFor="let item of history()!.items">
                  <td><span class="badge" [class.pdf]="item.source === 'pdf-upnqr'" [class.img]="item.source === 'image-upnqr'">
                    {{ item.source === 'pdf-upnqr' ? 'PDF' : item.source === 'image-upnqr' ? 'Image' : 'String' }}
                  </span></td>
                  <td class="mono">{{ item.iban ?? '—' }}</td>
                  <td class="amount">{{ item.amount !== null ? (item.amount | number:'1.2-2') : '—' }}</td>
                  <td class="muted">{{ item.created_at | date:'dd MMM, HH:mm' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </ng-container>
      </div>

      <!-- ── Insights ───────────────────────────────────────────────────────── -->
      <div *ngIf="activeTab() === 'insights'" class="panel">
        <ng-container *ngIf="isAuthenticated(); else authRequired">
          <div class="section-hdr">
            <h3>Payment insights</h3>
            <button class="btn-outline" (click)="loadInsights()" [disabled]="insightsLoading()">{{ insightsLoading() ? 'Loading…' : 'Refresh' }}</button>
          </div>
          <div *ngIf="insightsError()" class="err-bar">{{ insightsError() }}</div>
          <div *ngIf="insights()" class="insights-grid">
            <div class="i-card">
              <span class="i-num">{{ insights()!.stats?.['total_conversions'] ?? '—' }}</span>
              <span class="i-lbl">Total conversions</span>
            </div>
            <div class="i-card green">
              <span class="i-num">{{ getAmountStat(insights()!.stats, 'sum') }}</span>
              <span class="i-lbl">Total amount (EUR)</span>
            </div>
            <div class="i-card">
              <span class="i-num">{{ getAmountStat(insights()!.stats, 'avg') }}</span>
              <span class="i-lbl">Avg. amount (EUR)</span>
            </div>
          </div>
        </ng-container>
      </div>

    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 16px; }

    .page-header { display: flex; align-items: center; gap: 10px; }

    .header-status { display: inline-flex; align-items: center; gap: 7px; padding: 6px 14px; background: #F3F4F6; border-radius: 999px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #DC2626; flex-shrink: 0; transition: background 0.3s; }
    .dot.ok { background: #16A34A; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    .status-text { font-size: 13px; font-weight: 600; color: #374151; }

    .tab-strip { display: flex; gap: 6px; flex-wrap: wrap; }
    .tab-btn { padding: 8px 18px; background: #fff; border: 1.5px solid #E8E8E8; border-radius: 999px; font-size: 14px; font-weight: 600; color: #637074; cursor: pointer; transition: all 0.15s; }
    .tab-btn:hover, .tab-btn.active { background: #163300; color: #9FE870; border-color: #163300; }
    .lock-tag { margin-left: 6px; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; background: #F3F4F6; color: #6B7280; }

    .panel { background: #fff; border: 1.5px solid #E8E8E8; border-radius: 20px; padding: 28px; display: flex; flex-direction: column; gap: 14px; }

    .panel-icon { width: 48px; height: 48px; background: #F0FAE8; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
    .panel h3 { font-size: 20px; font-weight: 700; color: #163300; }
    .panel-desc { font-size: 14px; color: #637074; line-height: 1.5; }
    .section-hdr { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .section-hdr h3 { font-size: 18px; font-weight: 700; color: #163300; }

    /* Image scan */
    .file-input { display: none; }

    .pick-row { display: flex; gap: 10px; }

    .pick-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
      border: 1.5px solid;
      text-align: center;
    }
    .pick-btn.camera {
      background: #163300;
      color: #fff;
      border-color: #163300;
    }
    .pick-btn.camera:hover:not(.disabled) { background: #1f4a00; }
    .pick-btn.gallery {
      background: #fff;
      color: #163300;
      border-color: #E8E8E8;
    }
    .pick-btn.gallery:hover:not(.disabled) { border-color: #9FE870; }
    .pick-btn.disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }

    .img-preview-wrap {
      position: relative;
      align-self: center;
      border-radius: 14px;
      overflow: hidden;
      border: 1.5px solid #E8E8E8;
      background: #F9FAFB;
    }
    .img-preview {
      display: block;
      max-width: 100%;
      max-height: 260px;
      object-fit: contain;
    }
    .img-clear {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      background: rgba(255,255,255,0.9);
      border: 1px solid #E8E8E8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #637074;
      transition: background 0.12s;
    }
    .img-clear:hover { background: #FEF2F2; color: #991B1B; }

    /* PDF / textarea */
    .textarea { width: 100%; padding: 14px; border: 1.5px solid #E8E8E8; border-radius: 12px; font-family: 'SF Mono', monospace; font-size: 12px; line-height: 1.6; color: #163300; background: #FAFAF8; resize: vertical; transition: border-color 0.15s; box-sizing: border-box; }
    .textarea:focus { outline: none; border-color: #9FE870; background: #fff; }
    .textarea:disabled { opacity: 0.5; }

    .drop-zone { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 28px 20px; border: 2px dashed #D1D5DB; border-radius: 14px; background: #FAFAF8; cursor: pointer; transition: border-color 0.15s; text-align: center; }
    .drop-zone:hover, .drop-zone.drag-over { border-color: #9FE870; background: #F0FAE8; }
    .drop-zone.has-file { border-color: #16A34A; background: #F0FDF4; }
    .drop-zone.disabled { opacity: 0.6; cursor: not-allowed; }
    .drop-label { font-size: 14px; color: #637074; }
    .drop-label u { color: #163300; font-weight: 600; text-underline-offset: 3px; }
    .file-name { font-size: 14px; font-weight: 600; color: #163300; }
    .change-hint { font-size: 12px; color: #637074; }

    .btn-primary { width: 100%; padding: 14px; background: #163300; color: #fff; font-size: 15px; font-weight: 700; border-radius: 12px; border: none; cursor: pointer; transition: background 0.15s; }
    .btn-primary:hover:not(:disabled) { background: #1f4a00; }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-outline { padding: 8px 16px; background: #fff; border: 1.5px solid #E8E8E8; border-radius: 10px; font-size: 13px; font-weight: 600; color: #163300; cursor: pointer; transition: border-color 0.15s; }
    .btn-outline:hover:not(:disabled) { border-color: #9FE870; }
    .btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }

    .err-bar { padding: 12px 14px; background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; border-radius: 10px; font-size: 14px; }

    .result-card { border: 1.5px solid #E8E8E8; border-radius: 14px; overflow: hidden; }
    .rc-header { padding: 12px 16px; background: #FAFAF8; border-bottom: 1px solid #E8E8E8; font-size: 13px; font-weight: 700; color: #637074; text-transform: uppercase; letter-spacing: 0.05em; }
    .rc-rows { padding: 0 16px; }
    .rc-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 12px 0; border-bottom: 1px solid #F9FAFB; font-size: 14px; }
    .rc-row:last-child { border-bottom: none; }
    .rl { color: #637074; font-weight: 500; flex-shrink: 0; }
    .rv { color: #163300; font-weight: 600; text-align: right; word-break: break-all; }
    .rv.mono { font-family: 'SF Mono', monospace; font-size: 12px; }
    .rv.bold { font-size: 17px; font-weight: 800; }

    .qr-wrap { padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 10px; border-top: 1px solid #E8E8E8; }
    .qr-label { font-size: 12px; font-weight: 700; color: #637074; text-transform: uppercase; letter-spacing: 0.05em; }
    .qr-box { background: #fff; border: 1px solid #E8E8E8; border-radius: 12px; padding: 12px; }
    .qr-img { width: 160px; height: 160px; display: block; }

    .empty { padding: 40px; text-align: center; color: #9CA3AF; font-size: 14px; }

    .table-wrap { overflow-x: auto; }
    .tbl { width: 100%; font-size: 14px; border-collapse: collapse; }
    .tbl th { text-align: left; padding: 10px 12px; font-size: 12px; font-weight: 700; color: #637074; text-transform: uppercase; letter-spacing: 0.05em; background: #FAFAF8; border-bottom: 1px solid #E8E8E8; }
    .tbl td { padding: 12px 12px; border-bottom: 1px solid #F9FAFB; color: #163300; }
    .tbl tr:last-child td { border-bottom: none; }

    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #F3F4F6; color: #374151; }
    .badge.pdf { background: #DBEAFE; color: #1D4ED8; }
    .badge.img { background: #FEF9C3; color: #854D0E; }
    .mono { font-family: 'SF Mono', monospace; font-size: 12px; color: #374151; }
    .amount { font-weight: 700; }
    .muted { color: #9CA3AF; font-size: 13px; }

    .insights-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .i-card { background: #FAFAF8; border: 1.5px solid #E8E8E8; border-radius: 14px; padding: 20px 16px; display: flex; flex-direction: column; gap: 6px; }
    .i-card.green { border-color: #BBF7D0; background: #F0FDF4; }
    .i-num { font-size: 32px; font-weight: 800; color: #163300; line-height: 1; }
    .i-lbl { font-size: 13px; color: #637074; }

    .locked-card { padding: 20px; border-radius: 14px; background: #F9FAFB; border: 1.5px solid #E8E8E8; display: flex; flex-direction: column; gap: 10px; }
    .locked-title { font-size: 16px; font-weight: 700; color: #163300; }

    @media (max-width: 600px) {
      .insights-grid { grid-template-columns: 1fr; }
      .pick-row { flex-direction: column; }
    }
  `]
})
export class MobileGatewayComponent implements OnInit, OnDestroy {
  tabs: { id: Tab; label: string }[] = [
    { id: 'scan-image', label: 'Scan image' },
    { id: 'scan-upn', label: 'Paste string' },
    { id: 'scan-pdf', label: 'Upload PDF' },
    { id: 'history', label: 'History' },
    { id: 'insights', label: 'Insights' },
  ];

  activeTab = signal<Tab>('scan-image');
  health = signal<MobileHealthResponse | null>(null);

  // Image scan
  imgFile = signal<File | null>(null);
  imgPreviewUrl = signal<string | null>(null);
  scanImgResult = signal<MobileConversionResponse | null>(null);
  scanImgLoading = signal(false);
  scanImgError = signal<string | null>(null);

  // UPN string
  upnPayload = '';
  scanUpnResult = signal<MobileConversionResponse | null>(null);
  scanUpnLoading = signal(false);
  scanUpnError = signal<string | null>(null);

  // PDF
  mobFile = signal<File | null>(null);
  mobFileName = signal<string | null>(null);
  mobDragOver = signal(false);
  scanPdfResult = signal<MobileConversionResponse | null>(null);
  scanPdfLoading = signal(false);
  scanPdfError = signal<string | null>(null);

  // History / Insights
  history = signal<MobileHistoryResponse | null>(null);
  historyLoading = signal(false);
  historyError = signal<string | null>(null);

  insights = signal<MobileInsightsResponse | null>(null);
  insightsLoading = signal(false);
  insightsError = signal<string | null>(null);

  constructor(
    private mobileService: MobileGatewayService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void { this.loadHealth(); }

  ngOnDestroy(): void { this.releasePreview(); }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (this.isProtectedTab(tab) && !this.isAuthenticated()) return;
    if (tab === 'history' && !this.history()) this.loadHistory();
    if (tab === 'insights' && !this.insights()) this.loadInsights();
  }

  isAuthenticated(): boolean { return this.auth.isAuthenticated(); }

  isProtectedTab(tab: Tab): boolean { return tab === 'history' || tab === 'insights'; }

  goLogin(): void { window.location.assign('/login?redirect=/mobile'); }

  loadHealth(): void {
    this.mobileService.checkHealth().subscribe({
      next: h => this.health.set(h),
      error: () => {},
    });
  }

  // ── Image scan ──────────────────────────────────────────────────────────────

  onImgSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0] ?? null;
    (e.target as HTMLInputElement).value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.scanImgError.set('Please select an image file.'); return; }
    this.releasePreview();
    this.imgFile.set(file);
    this.imgPreviewUrl.set(URL.createObjectURL(file));
    this.scanImgError.set(null);
    this.scanImgResult.set(null);
  }

  clearImg(): void {
    this.releasePreview();
    this.imgFile.set(null);
    this.scanImgResult.set(null);
    this.scanImgError.set(null);
  }

  onScanImage(): void {
    const file = this.imgFile();
    if (!file) return;
    this.scanImgLoading.set(true);
    this.scanImgError.set(null);
    this.scanImgResult.set(null);
    this.mobileService.scanImage(file).subscribe({
      next: r => { this.scanImgResult.set(r); this.scanImgLoading.set(false); },
      error: e => { this.scanImgError.set(e.error?.detail ?? 'QR detection failed. Make sure the image is clear and the QR code is visible.'); this.scanImgLoading.set(false); },
    });
  }

  private releasePreview(): void {
    const url = this.imgPreviewUrl();
    if (url) { URL.revokeObjectURL(url); this.imgPreviewUrl.set(null); }
  }

  // ── UPN string ──────────────────────────────────────────────────────────────

  onScanUpn(): void {
    const payload = this.upnPayload.trim();
    if (!payload) return;
    this.scanUpnLoading.set(true); this.scanUpnError.set(null); this.scanUpnResult.set(null);
    this.mobileService.scanUpn(payload).subscribe({
      next: r => { this.scanUpnResult.set(r); this.scanUpnLoading.set(false); this.upnPayload = ''; },
      error: e => { this.scanUpnError.set(e.error?.detail ?? 'Conversion failed'); this.scanUpnLoading.set(false); },
    });
  }

  // ── PDF ─────────────────────────────────────────────────────────────────────

  onFileSelected(e: Event): void { this.applyFile((e.target as HTMLInputElement).files?.[0] ?? null); }
  onDragEnter(e: DragEvent): void { e.preventDefault(); if (!this.scanPdfLoading()) this.mobDragOver.set(true); }
  onDragOver(e: DragEvent): void { e.preventDefault(); if (!this.scanPdfLoading()) this.mobDragOver.set(true); }
  onDragLeave(e: DragEvent): void { e.preventDefault(); this.mobDragOver.set(false); }
  onDrop(e: DragEvent): void { e.preventDefault(); this.mobDragOver.set(false); if (!this.scanPdfLoading()) this.applyFile(e.dataTransfer?.files[0] ?? null); }

  private applyFile(file: File | null): void {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) { this.scanPdfError.set('Only PDF files are supported.'); return; }
    this.mobFile.set(file); this.mobFileName.set(file.name); this.scanPdfError.set(null);
  }

  onScanPdf(): void {
    const file = this.mobFile();
    if (!file) return;
    this.scanPdfLoading.set(true); this.scanPdfError.set(null); this.scanPdfResult.set(null);
    this.mobileService.scanPdf(file).subscribe({
      next: r => { this.scanPdfResult.set(r); this.scanPdfLoading.set(false); this.mobFile.set(null); this.mobFileName.set(null); },
      error: e => { this.scanPdfError.set(e.error?.detail ?? 'Conversion failed'); this.scanPdfLoading.set(false); },
    });
  }

  // ── History / Insights ──────────────────────────────────────────────────────

  loadHistory(): void {
    if (!this.isAuthenticated()) return;
    this.historyLoading.set(true); this.historyError.set(null);
    this.mobileService.getHistory().subscribe({
      next: h => { this.history.set(h); this.historyLoading.set(false); },
      error: e => { this.historyError.set(e.error?.detail ?? 'Failed to load history'); this.historyLoading.set(false); },
    });
  }

  loadInsights(): void {
    if (!this.isAuthenticated()) return;
    this.insightsLoading.set(true); this.insightsError.set(null);
    this.mobileService.getInsights().subscribe({
      next: i => { this.insights.set(i); this.insightsLoading.set(false); },
      error: e => { this.insightsError.set(e.error?.detail ?? 'Failed to load insights'); this.insightsLoading.set(false); },
    });
  }

  getAmountStat(stats: Record<string, unknown>, key: string): unknown {
    const amount = stats?.['amount'];
    if (amount && typeof amount === 'object') return (amount as Record<string, unknown>)[key] ?? '—';
    return '—';
  }
}
