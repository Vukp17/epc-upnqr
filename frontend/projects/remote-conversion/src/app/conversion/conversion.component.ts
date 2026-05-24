import { Component, signal } from '@angular/core';
import { PdfUploadComponent } from '../components/pdf-upload/pdf-upload.component';
import { UpnStringInputComponent } from '../components/upn-string-input/upn-string-input.component';
import { ConversionResultComponent } from '../components/conversion-result/conversion-result.component';
import { ConvertResponse } from '../models/convert-response.model';

@Component({
  selector: 'app-conversion',
  standalone: true,
  imports: [PdfUploadComponent, UpnStringInputComponent, ConversionResultComponent],
  template: `
    <div class="page">
      <div class="input-grid">
        <div class="input-panel">
          <app-pdf-upload (result)="onResult($event)"></app-pdf-upload>
        </div>

        <div class="divider-col">
          <div class="divider-line"></div>
          <span class="or-label">or</span>
          <div class="divider-line"></div>
        </div>

        <div class="input-panel">
          <app-upn-string-input (result)="onResult($event)"></app-upn-string-input>
        </div>
      </div>

      <app-conversion-result [result]="currentResult()"></app-conversion-result>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; }

    .input-grid {
      display: grid;
      grid-template-columns: 1fr 32px 1fr;
      gap: 0;
      background: #fff;
      border: 1.5px solid #E8E8E8;
      border-radius: 20px;
      overflow: hidden;
    }

    .input-panel { padding: 32px 28px; }

    .divider-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 20px 0;
      border-left: 1px solid #E8E8E8;
      border-right: 1px solid #E8E8E8;
    }

    .divider-line { flex: 1; width: 1px; background: #E8E8E8; }

    .or-label {
      font-size: 12px;
      font-weight: 700;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    @media (max-width: 720px) {
      .input-grid { grid-template-columns: 1fr; }
      .divider-col {
        flex-direction: row;
        border-left: none;
        border-right: none;
        border-top: 1px solid #E8E8E8;
        border-bottom: 1px solid #E8E8E8;
        padding: 14px 20px;
      }
      .divider-line { flex: 1; height: 1px; width: auto; }
    }
  `]
})
export class ConversionComponent {
  currentResult = signal<ConvertResponse | null>(null);

  onResult(r: ConvertResponse): void {
    this.currentResult.set(r);
    setTimeout(() => document.querySelector('app-conversion-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }
}
