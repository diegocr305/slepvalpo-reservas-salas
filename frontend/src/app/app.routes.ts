import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/calendario',
    pathMatch: 'full',
  },
  {
    path: 'calendario',
    loadComponent: () => import('./pages/calendario/calendario.page').then(m => m.CalendarioPage)
  },
  {
    path: 'reservar',
    loadComponent: () => import('./pages/reservar/reservar.page').then(m => m.ReservarPage)
  },
  {
    path: 'mis-reservas',
    loadComponent: () => import('./pages/mis-reservas/mis-reservas.page').then(m => m.MisReservasPage)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage)
  },
  {
    path: 'checkin/:id',
    loadComponent: () => import('./pages/checkin/checkin.page').then(m => m.CheckinPage)
  }
];