import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthStatusComponent } from './components/health-status/health-status.component';
import { PdfUploadComponent } from './components/pdf-upload/pdf-upload.component';
import { UpnStringInputComponent } from './components/upn-string-input/upn-string-input.component';
import { ConversionResultComponent } from './components/conversion-result/conversion-result.component';
import { ConvertResponse } from './models/convert-response.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HealthStatusComponent,
    PdfUploadComponent,
    UpnStringInputComponent,
    ConversionResultComponent,
  ],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>QR Converter</h1>
        <app-health-status></app-health-status>
      </header>

      <main class="app-main">
        <div class="forms-section">
          <div class="form-wrapper">
            <app-pdf-upload (result)="onConversionResult($event)"></app-pdf-upload>
          </div>

          <div class="divider">OR</div>

          <div class="form-wrapper">
            <app-upn-string-input (result)="onConversionResult($event)"></app-upn-string-input>
          </div>
        </div>

        <app-conversion-result [result]="currentResult()"></app-conversion-result>
      </main>
    </div>
  `,
  styleUrl: './app.scss'
})
export class App {
  currentResult = signal<ConvertResponse | null>(null);

  onConversionResult(response: ConvertResponse): void {
    this.currentResult.set(response);
  }
}
