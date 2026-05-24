import { Component, OnInit, OnDestroy } from '@angular/core';
import { QrConverterService } from '../../services/qr-converter.service';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-health-status',
  standalone: true,
  template: `
    <div class="status" [class.online]="isOnline">
      <span class="dot"></span>
      <span class="label">{{ isOnline ? 'Service online' : 'Service offline' }}</span>
    </div>
  `,
  styles: [`
    .status {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 12px;
      border-radius: 999px;
      background: #FEE2E2;
      font-size: 13px;
      font-weight: 600;
      color: #991B1B;
      transition: background 0.3s, color 0.3s;
    }
    .status.online {
      background: #DCFCE7;
      color: #166534;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #DC2626;
      flex-shrink: 0;
    }
    .status.online .dot {
      background: #16A34A;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class HealthStatusComponent implements OnInit, OnDestroy {
  isOnline = false;
  private sub?: Subscription;

  constructor(private qrService: QrConverterService) {}

  ngOnInit(): void {
    this.sub = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.qrService.checkHealth().pipe(catchError(() => of(null))))
    ).subscribe(r => { this.isOnline = r?.status === 'ok'; });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
