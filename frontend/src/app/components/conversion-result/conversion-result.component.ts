import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConvertResponse } from '../../models/convert-response.model';

@Component({
  selector: 'app-conversion-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="result" class="result-container">
      <div class="section">
        <h3>Source</h3>
        <span class="source-badge" [class.pdf]="result.source === 'pdf-upnqr'" [class.string]="result.source === 'upn-string'">
          {{ result.source === 'pdf-upnqr' ? 'PDF Upload' : 'UPN String' }}
        </span>
      </div>

      <div class="section">
        <h3>Parsed UPN Data</h3>
        <table class="data-table">
          <tbody>
            <tr *ngIf="result.upn_parsed.recipient_name">
              <td>Recipient Name</td>
              <td>{{ result.upn_parsed.recipient_name }}</td>
            </tr>
            <tr *ngIf="result.upn_parsed.iban">
              <td>IBAN</td>
              <td><code>{{ result.upn_parsed.iban }}</code></td>
            </tr>
            <tr *ngIf="result.upn_parsed.amount">
              <td>Amount</td>
              <td>{{ result.upn_parsed.amount | number:'1.2-2' }} {{ result.upn_parsed.currency }}</td>
            </tr>
            <tr *ngIf="result.upn_parsed.currency">
              <td>Currency</td>
              <td>{{ result.upn_parsed.currency }}</td>
            </tr>
            <tr *ngIf="result.upn_parsed.purpose_code">
              <td>Purpose Code</td>
              <td>{{ result.upn_parsed.purpose_code }}</td>
            </tr>
            <tr *ngIf="result.upn_parsed.purpose">
              <td>Purpose</td>
              <td>{{ result.upn_parsed.purpose }}</td>
            </tr>
            <tr *ngIf="result.upn_parsed.reference">
              <td>Reference</td>
              <td><code>{{ result.upn_parsed.reference }}</code></td>
            </tr>
            <tr *ngIf="result.upn_parsed.payer_name">
              <td>Payer Name</td>
              <td>{{ result.upn_parsed.payer_name }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h3>EPC QR Code</h3>
        <div class="qr-container">
          <img [src]="'data:image/png;base64,' + result.epc_qr_png_base64" alt="EPC QR Code" class="qr-image" />
        </div>
      </div>

      <div class="section">
        <h3>EPC Payload</h3>
        <pre class="epc-payload">{{ result.epc_payload }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .result-container {
      margin-top: 32px;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background-color: #f9f9f9;
    }

    .section {
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #eee;
    }

    .section:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    h3 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 16px;
    }

    .source-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }

    .source-badge.pdf {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .source-badge.string {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
    }

    .data-table tr {
      border-bottom: 1px solid #eee;
    }

    .data-table tr:last-child {
      border-bottom: none;
    }

    .data-table td {
      padding: 10px 0;
      font-size: 14px;
    }

    .data-table td:first-child {
      font-weight: 500;
      color: #666;
      width: 20%;
    }

    .data-table td:last-child {
      color: #333;
      word-break: break-word;
    }

    code {
      background-color: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 12px;
    }

    .qr-container {
      display: flex;
      justify-content: center;
      padding: 16px;
      background-color: white;
      border: 1px solid #eee;
      border-radius: 6px;
    }

    .qr-image {
      max-width: 300px;
      height: auto;
      border: 1px solid #ddd;
    }

    .epc-payload {
      background-color: #f5f5f5;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #ddd;
      overflow-x: auto;
      font-size: 12px;
      line-height: 1.4;
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  `]
})
export class ConversionResultComponent {
  @Input() result: ConvertResponse | null = null;
}
