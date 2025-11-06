import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./components/tabs/tabs.component').then(m => m.TabsComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'calendario',
        loadComponent: () => import('./pages/calendario/calendario.page').then(m => m.CalendarioPage)
      },
      {
        path: 'reservar',
        loadComponent: () => import('./pages/reservar/reservar.page').then(m => m.ReservarPage)
      },
      {
        path: '',
        redirectTo: '/tabs/reservar',
        pathMatch: 'full'
      }
    ]
  }
];