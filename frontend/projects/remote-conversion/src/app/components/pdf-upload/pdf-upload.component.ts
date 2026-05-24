import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QrConverterService } from '../../services/qr-converter.service';
import { ConvertResponse } from '../../models/convert-response.model';

@Component({
  selector: 'app-pdf-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-card">
      <div class="card-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#163300" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      </div>
      <h3 class="card-title">Upload payment slip</h3>
      <p class="card-desc">Drag your PDF here or click to browse. We'll extract the payment data automatically.</p>

      <input id="pdf-file-input" type="file" accept=".pdf,application/pdf"
        (change)="onFileSelected($event)" [disabled]="isLoading" class="file-input" />

      <label for="pdf-file-input" class="drop-zone"
        [class.drag-over]="isDragOver" [class.has-file]="!!selectedFileName" [class.disabled]="isLoading"
        (dragenter)="onDragEnter($event)" (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
        @if (selectedFileName) {
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span class="file-name">{{ selectedFileName }}</span>
          <span class="change-hint">Click to change</span>
        } @else {
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#637074" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
          <span class="drop-label">Drop PDF here or <u>browse</u></span>
        }
      </label>

      <button class="btn-primary" (click)="onConvert()" [disabled]="!selectedFile || isLoading">
        {{ isLoading ? 'Converting…' : 'Convert payment' }}
      </button>

      @if (error) {
        <div class="error-bar">{{ error }}</div>
      }
    </div>
  `,
  styles: [`
    .upload-card {
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

    .file-input { display: none; }

    .drop-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 28px 20px;
      border: 2px dashed #D1D5DB;
      border-radius: 14px;
      background: #FAFAF8;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      text-align: center;
    }
    .drop-zone:hover, .drop-zone.drag-over {
      border-color: #9FE870;
      background: #F0FAE8;
    }
    .drop-zone.has-file { border-color: #16A34A; background: #F0FDF4; }
    .drop-zone.disabled { opacity: 0.6; cursor: not-allowed; }

    .drop-label { font-size: 14px; color: #637074; }
    .drop-label u { color: #163300; font-weight: 600; text-underline-offset: 3px; }
    .file-name { font-size: 14px; font-weight: 600; color: #163300; word-break: break-all; }
    .change-hint { font-size: 12px; color: #637074; }

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
    this.applyFile(input.files?.[0] ?? null);
  }

  onDragEnter(e: DragEvent): void { e.preventDefault(); if (!this.isLoading) this.isDragOver = true; }
  onDragOver(e: DragEvent): void { e.preventDefault(); if (!this.isLoading) this.isDragOver = true; }
  onDragLeave(e: DragEvent): void { e.preventDefault(); this.isDragOver = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault(); this.isDragOver = false;
    if (!this.isLoading) this.applyFile(e.dataTransfer?.files[0] ?? null);
  }

  private applyFile(file: File | null): void {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.error = 'Please choose a PDF file.';
      return;
    }
    this.selectedFile = file;
    this.selectedFileName = file.name;
    this.error = null;
  }

  onConvert(): void {
    if (!this.selectedFile) return;
    this.isLoading = true;
    this.error = null;
    this.qrService.convertPdf(this.selectedFile).subscribe({
      next: r => { this.result.emit(r); this.isLoading = false; this.selectedFile = null; this.selectedFileName = null; },
      error: e => { this.error = e.error?.detail ?? 'Failed to convert PDF'; this.isLoading = false; }
    });
  }
}
