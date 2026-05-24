import { Component } from '@angular/core';
import { ConversionComponent } from './conversion/conversion.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ConversionComponent],
  template: `<app-conversion></app-conversion>`,
})
export class App {}
