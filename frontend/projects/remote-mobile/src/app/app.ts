import { Component } from '@angular/core';
import { MobileGatewayComponent } from './mobile/mobile-gateway.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MobileGatewayComponent],
  template: `<app-mobile-gateway></app-mobile-gateway>`,
})
export class App {}
