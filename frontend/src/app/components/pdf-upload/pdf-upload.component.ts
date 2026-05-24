import { Component, EventEmitter, Output } from '@angular/core';
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
          id="pdf-file-input"
          type="file"
          accept=".pdf,application/pdf"
          (change)="onFileSelected($event)"
          [disabled]="isLoading"
          class="file-input"
        />

        <label
          for="pdf-file-input"
          class="drop-zone"
          [class.drag-over]="isDragOver"
          [class.disabled]="isLoading"
          (dragenter)="onDragEnter($event)"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
        >
          <span class="drop-title">Drag & drop PDF here</span>
          <span class="drop-subtitle">or click to choose file</span>
          <span class="file-text" *ngIf="selectedFileName">Selected: {{ selectedFileName }}</span>
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

    .drop-zone {
      width: 100%;
      min-height: 122px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 14px;
      background: linear-gradient(180deg, #f9fbff 0%, #eef4ff 100%);
      border: 2px dashed #9fb7d9;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
      box-sizing: border-box;
    }

    .drop-zone:hover {
      border-color: #4f7ec2;
      background: linear-gradient(180deg, #f4f8ff 0%, #e7efff 100%);
    }

    .drop-zone.drag-over {
      border-color: #2f6fcc;
      background: linear-gradient(180deg, #eef5ff 0%, #dae9ff 100%);
      transform: translateY(-1px);
    }

    .drop-zone.disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .drop-title {
      color: #1f3b64;
      font-size: 15px;
      font-weight: 700;
    }

    .drop-subtitle {
      color: #4c678a;
      font-size: 13px;
    }

    .file-text {
      color: #244573;
      font-size: 13px;
      font-weight: 600;
      word-break: break-all;
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
  isDragOver = false;
  error: string | null = null;

  constructor(private qrService: QrConverterService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    this.applySelectedFile(files && files.length > 0 ? files[0] : null);
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    if (!this.isLoading) {
      this.isDragOver = true;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.isLoading) {
      this.isDragOver = true;
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    if (this.isLoading) {
      return;
    }

    const files = event.dataTransfer?.files;
    this.applySelectedFile(files && files.length > 0 ? files[0] : null);
  }

  private applySelectedFile(file: File | null): void {
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.error = 'Please choose a PDF file.';
      this.selectedFile = null;
      this.selectedFileName = null;
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.error = null;
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
        this.isDragOver = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.detail || 'Failed to convert PDF';
      }
    });
  }
}
