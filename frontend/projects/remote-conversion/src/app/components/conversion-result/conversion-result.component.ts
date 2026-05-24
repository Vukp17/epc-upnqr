import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConvertResponse } from '../../models/convert-response.model';

@Component({
  selector: 'app-conversion-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (result) {
      <div class="result-wrap">
        <div class="result-header">
          <div class="result-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div class="result-title">Payment converted</div>
            <div class="result-meta">via {{ result.source === 'pdf-upnqr' ? 'PDF upload' : 'payment string' }}</div>
          </div>
        </div>

        <div class="result-body">
          <div class="payment-card">
            <h4>Payment details</h4>
            <div class="detail-list">
              @if (result.upn_parsed.recipient_name) {
                <div class="detail-row">
                  <span class="dl">Recipient</span>
                  <span class="dv">{{ result.upn_parsed.recipient_name }}</span>
                </div>
              }
              @if (result.upn_parsed.iban) {
                <div class="detail-row">
                  <span class="dl">IBAN</span>
                  <span class="dv mono">{{ result.upn_parsed.iban }}</span>
                </div>
              }
              @if (result.upn_parsed.amount) {
                <div class="detail-row">
                  <span class="dl">Amount</span>
                  <span class="dv amount">{{ result.upn_parsed.amount | number:'1.2-2' }} {{ result.upn_parsed.currency }}</span>
                </div>
              }
              @if (result.upn_parsed.purpose) {
                <div class="detail-row">
                  <span class="dl">Purpose</span>
                  <span class="dv">{{ result.upn_parsed.purpose }}</span>
                </div>
              }
              @if (result.upn_parsed.reference) {
                <div class="detail-row">
                  <span class="dl">Reference</span>
                  <span class="dv mono">{{ result.upn_parsed.reference }}</span>
                </div>
              }
              @if (result.upn_parsed.payer_name) {
                <div class="detail-row">
                  <span class="dl">Payer</span>
                  <span class="dv">{{ result.upn_parsed.payer_name }}</span>
                </div>
              }
            </div>
          </div>

          <div class="qr-card">
            <h4>Your EPC QR code</h4>
            <p class="qr-hint">Scan with your banking app to pay instantly.</p>
            <div class="qr-box">
              <img [src]="'data:image/png;base64,' + result.epc_qr_png_base64" alt="EPC QR Code" class="qr-img" />
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .result-wrap {
      margin-top: 24px;
      border: 1.5px solid #BBF7D0;
      border-radius: 18px;
      background: #F0FDF4;
      overflow: hidden;
    }

    .result-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 24px;
      border-bottom: 1px solid #D1FAE5;
    }

    .result-icon {
      width: 44px;
      height: 44px;
      background: #fff;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid #BBF7D0;
    }

    .result-title { font-size: 17px; font-weight: 700; color: #163300; }
    .result-meta { font-size: 13px; color: #637074; margin-top: 2px; }

    .result-body {
      display: grid;
      grid-template-columns: 1fr 220px;
      gap: 0;
    }

    .payment-card {
      padding: 24px;
      border-right: 1px solid #D1FAE5;
    }

    .qr-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    h4 { font-size: 14px; font-weight: 700; color: #163300; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.05em; }

    .detail-list { display: flex; flex-direction: column; gap: 0; }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 16px;
      padding: 10px 0;
      border-bottom: 1px solid #D1FAE5;
      font-size: 14px;
    }
    .detail-row:last-child { border-bottom: none; }

    .dl { color: #637074; font-weight: 500; flex-shrink: 0; }
    .dv { color: #163300; font-weight: 600; text-align: right; word-break: break-all; }
    .dv.mono { font-family: 'SF Mono', 'Menlo', monospace; font-size: 12px; }
    .dv.amount { font-size: 18px; font-weight: 800; color: #163300; }

    .qr-hint { font-size: 13px; color: #637074; margin-bottom: 16px; line-height: 1.4; }

    .qr-box {
      background: #fff;
      border: 1px solid #D1FAE5;
      border-radius: 12px;
      padding: 12px;
    }
    .qr-img { width: 160px; height: 160px; display: block; }

    @media (max-width: 640px) {
      .result-body { grid-template-columns: 1fr; }
      .payment-card { border-right: none; border-bottom: 1px solid #D1FAE5; }
    }
  `]
})
export class ConversionResultComponent {
  @Input() result: ConvertResponse | null = null;
}
