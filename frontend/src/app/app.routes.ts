import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { authGuard } from './guards/auth.guard';
import { LandingLayoutComponent } from './layouts/landing-layout.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component')
      .then(m => m.LoginComponent),
  },
  {
    path: '',
    component: LandingLayoutComponent,
    children: [
      { path: '', redirectTo: 'convert', pathMatch: 'full' },
      {
        path: 'convert',
        loadComponent: () =>
          loadRemoteModule('remote-conversion', './ConversionComponent')
            .then(m => m.ConversionComponent),
      },
    ],
  },
  {
    path: 'app',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'transactions', pathMatch: 'full' },
      {
        path: 'convert',
        loadComponent: () =>
          loadRemoteModule('remote-conversion', './ConversionComponent')
            .then(m => m.ConversionComponent),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          loadRemoteModule('remote-observability', './ObservabilityComponent')
            .then(m => m.ObservabilityComponent),
      },
      {
        path: 'mobile',
        loadComponent: () =>
          loadRemoteModule('remote-mobile', './MobileGatewayComponent')
            .then(m => m.MobileGatewayComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
