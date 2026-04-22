import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QrConverterService } from '../../services/qr-converter.service';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-health-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="health-badge" [class.online]="isOnline" [class.offline]="!isOnline">
      <span class="dot"></span>
      {{ isOnline ? 'Service Online' : 'Service Offline' }}
    </div>
  `,
  styles: [`
    .health-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .health-badge.online {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .health-badge.offline {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .health-badge.online .dot {
      background-color: #28a745;
      animation: pulse-green 2s infinite;
    }

    .health-badge.offline .dot {
      background-color: #dc3545;
    }

    @keyframes pulse-green {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class HealthStatusComponent implements OnInit, OnDestroy {
  isOnline = false;
  private subscription?: Subscription;

  constructor(private qrService: QrConverterService) { }

  ngOnInit(): void {
    this.subscription = interval(5000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.qrService.checkHealth().pipe(
            catchError(error => {
              console.error('Health check failed:', error);
              return of(null);
            })
          )
        )
      )
      .subscribe(result => {
        console.log('Health check result:', result);
        this.isOnline = result !== null && result.status === 'ok';
        console.log('Is online:', this.isOnline);
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
