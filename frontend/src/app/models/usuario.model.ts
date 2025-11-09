export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  area?: string;
  rol: 'super_admin' | 'admin' | 'subdirector' | 'funcionario';
  activo: boolean;
  created_at: string;
}

export type UserRole = 'super_admin' | 'admin' | 'subdirector' | 'funcionario';

export const ROLE_PERMISSIONS = {
  super_admin: {
    canCreateReservations: true,
    canEditReservations: true,
    canDeleteReservations: true,
    canAccessAdminPanel: true,
    canViewStatistics: true,
    canManageUsers: true
  },
  admin: {
    canCreateReservations: true,
    canEditReservations: true,
    canDeleteReservations: true,
    canAccessAdminPanel: false,
    canViewStatistics: false,
    canManageUsers: false
  },
  subdirector: {
    canCreateReservations: true,
    canEditReservations: true,
    canDeleteReservations: false,
    canAccessAdminPanel: false,
    canViewStatistics: false,
    canManageUsers: false
  },
  funcionario: {
    canCreateReservations: false,
    canEditReservations: false,
    canDeleteReservations: false,
    canAccessAdminPanel: false,
    canViewStatistics: false,
    canManageUsers: false
  }
} as const;