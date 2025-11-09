// Ejemplo de rutas protegidas con guards de roles
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard, AdminGuard, SuperAdminGuard } from './guards/role.guard';

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
    loadComponent: () => import('./pages/auth-callback/auth-callback.page').then(m => m.AuthCallbackPage)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./pages/unauthorized/unauthorized.page').then(m => m.UnauthorizedPage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./components/tabs/tabs.component').then(m => m.TabsComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'reservar',
        loadComponent: () => import('./pages/reservar/reservar.page').then(m => m.ReservarPage),
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'subdirector', 'funcionario'] } // Todos pueden ver
      },
      {
        path: 'mis-reservas',
        loadComponent: () => import('./pages/mis-reservas/mis-reservas.page').then(m => m.MisReservasPage),
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'subdirector', 'funcionario'] } // Todos pueden ver sus reservas
      },
      {
        path: 'crear-reserva',
        loadComponent: () => import('./pages/crear-reserva/crear-reserva.page').then(m => m.CrearReservaPage),
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'subdirector'] } // Solo admin y subdirector pueden crear
      },
      {
        path: '',
        redirectTo: '/tabs/reservar',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [AuthGuard, AdminGuard], // Solo admin y super_admin
    children: [
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/admin/usuarios/usuarios.page').then(m => m.UsuariosPage)
      },
      {
        path: 'reservas',
        loadComponent: () => import('./pages/admin/reservas/reservas.page').then(m => m.ReservasPage)
      }
    ]
  },
  {
    path: 'super-admin',
    canActivate: [AuthGuard, SuperAdminGuard], // Solo super_admin
    children: [
      {
        path: 'estadisticas',
        loadComponent: () => import('./pages/super-admin/estadisticas/estadisticas.page').then(m => m.EstadisticasPage)
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./pages/super-admin/configuracion/configuracion.page').then(m => m.ConfiguracionPage)
      }
    ]
  }
];