import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QrConverterService } from '../../services/qr-converter.service';
import { ConvertResponse } from '../../models/convert-response.model';

@Component({
  selector: 'app-upn-string-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="input-card">
      <div class="card-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#163300" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
      </div>
      <h3 class="card-title">Paste payment string</h3>
      <p class="card-desc">Already have the UPN QR data as text? Paste it below and we'll convert it immediately.</p>

      <textarea
        [(ngModel)]="upnPayload"
        [disabled]="isLoading"
        placeholder="Paste payment string here…"
        class="payload-area"
        rows="6"
      ></textarea>

      <button class="btn-primary" (click)="onConvert()" [disabled]="!upnPayload.trim() || isLoading">
        {{ isLoading ? 'Converting…' : 'Convert payment' }}
      </button>

      @if (error) {
        <div class="error-bar">{{ error }}</div>
      }
    </div>
  `,
  styles: [`
    .input-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .card-icon {
      width: 48px;
      height: 48px;
      background: #F0FAE8;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card-title { font-size: 18px; font-weight: 700; color: #163300; }
    .card-desc { font-size: 14px; color: #637074; line-height: 1.5; }

    .payload-area {
      width: 100%;
      padding: 14px;
      border: 1.5px solid #E8E8E8;
      border-radius: 12px;
      font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
      font-size: 12px;
      line-height: 1.6;
      color: #163300;
      background: #FAFAF8;
      resize: vertical;
      transition: border-color 0.15s;
    }
    .payload-area:focus { outline: none; border-color: #9FE870; background: #fff; }
    .payload-area:disabled { opacity: 0.5; }

    .btn-primary {
      width: 100%;
      padding: 14px;
      background: #163300;
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      border-radius: 12px;
      transition: background 0.15s;
      letter-spacing: -0.2px;
    }
    .btn-primary:hover:not(:disabled) { background: #1f4a00; }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

    .error-bar {
      padding: 12px 14px;
      background: #FEF2F2;
      color: #991B1B;
      border: 1px solid #FECACA;
      border-radius: 10px;
      font-size: 14px;
    }
  `]
})
export class UpnStringInputComponent {
  @Output() result = new EventEmitter<ConvertResponse>();

  upnPayload = '';
  isLoading = false;
  error: string | null = null;

  constructor(private qrService: QrConverterService) {}

  onConvert(): void {
    const payload = this.upnPayload.trim();
    if (!payload) return;
    this.isLoading = true;
    this.error = null;
    this.qrService.convertUpnString(payload).subscribe({
      next: r => { this.result.emit(r); this.isLoading = false; this.upnPayload = ''; },
      error: e => { this.error = e.error?.detail ?? 'Failed to convert payment string'; this.isLoading = false; }
    });
  }
}
