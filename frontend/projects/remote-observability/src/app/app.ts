import { Component } from '@angular/core';
import { ObservabilityComponent } from './observability/observability.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ObservabilityComponent],
  template: `<app-observability></app-observability>`,
})
export class App {}
