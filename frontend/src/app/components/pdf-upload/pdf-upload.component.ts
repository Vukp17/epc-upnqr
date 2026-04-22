import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QrConverterService } from '../../services/qr-converter.service';
import { ConvertResponse } from '../../models/convert-response.model';

@Component({
  selector: 'app-pdf-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-container">
      <h3>Upload PDF</h3>
      <div class="form-group">
        <input
          #fileInput
          id="pdf-file-input"
          type="file"
          accept=".pdf"
          (change)="onFileSelected($event)"
          [disabled]="isLoading"
          class="file-input"
        />
        <label for="pdf-file-input" class="file-label">
          <span class="file-text">{{ selectedFileName || 'Choose a PDF file...' }}</span>
        </label>
      </div>
      <button
        (click)="onConvert()"
        [disabled]="!selectedFile || isLoading"
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
      position: relative;
    }

    .file-input {
      display: none;
    }

    .file-label {
      display: inline-block;
      padding: 10px 16px;
      background-color: #f0f0f0;
      border: 2px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .file-label:hover {
      background-color: #e8e8e8;
      border-color: #999;
    }

    .file-text {
      color: #333;
      font-size: 14px;
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
export class PdfUploadComponent {
  @Output() result = new EventEmitter<ConvertResponse>();

  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(private qrService: QrConverterService) { }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.selectedFileName = files[0].name;
      this.error = null;
    }
  }

  onConvert(): void {
    if (!this.selectedFile) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.qrService.convertPdf(this.selectedFile).subscribe({
      next: (response) => {
        this.result.emit(response);
        this.isLoading = false;
        this.selectedFile = null;
        this.selectedFileName = null;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.detail || 'Failed to convert PDF';
      }
    });
  }
}
