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
    <div class="form-container">
      <h3>Enter UPN String</h3>
      <div class="form-group">
        <textarea
          [(ngModel)]="upnPayload"
          [disabled]="isLoading"
          placeholder="Paste your UPN QR code string here..."
          class="upn-textarea"
          rows="6"
        ></textarea>
      </div>
      <button
        (click)="onConvert()"
        [disabled]="!upnPayload.trim() || isLoading"
        class="convert-btn"
      >
        {{ isLoading ? 'Converting...' : 'Convert' }}
      </button>
      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background-color: #f9f9f9;
    }

    h3 {
      margin-top: 0;
      margin-bottom: 16px;
    }

    .form-group {
      margin-bottom: 16px;
    }

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

    .upn-textarea:disabled {
      background-color: #f0f0f0;
      color: #999;
    }

    .convert-btn {
      padding: 10px 24px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .convert-btn:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .convert-btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .error-message {
      margin-top: 12px;
      padding: 10px;
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      font-size: 14px;
    }
  `]
})
export class UpnStringInputComponent {
  @Output() result = new EventEmitter<ConvertResponse>();

  upnPayload = '';
  isLoading = false;
  error: string | null = null;

  constructor(private qrService: QrConverterService) { }

  onConvert(): void {
    const payload = this.upnPayload.trim();
    if (!payload) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.qrService.convertUpnString(payload).subscribe({
      next: (response) => {
        this.result.emit(response);
        this.isLoading = false;
        this.upnPayload = '';
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.detail || 'Failed to convert UPN string';
      }
    });
  }
}
