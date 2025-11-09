import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  area?: string;
  rol: 'super_admin' | 'admin' | 'subdirector' | 'funcionario';
  activo: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = new BehaviorSubject<Usuario | null>(null);
  public user$ = this.currentUser.asObservable();

  constructor(private supabaseService: SupabaseService) {
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Escuchar cambios de autenticación
    this.supabaseService.user$.subscribe(async (authUser) => {
      if (authUser?.email) {
        await this.loadUserProfile(authUser.email);
      } else {
        this.currentUser.next(null);
      }
    });
  }

  private async loadUserProfile(email: string) {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('activo', true)
        .single();

      if (data && !error) {
        this.currentUser.next(data as Usuario);
      }
    } catch (error) {
      console.error('Error cargando perfil de usuario:', error);
    }
  }

  // Getters para el usuario actual
  get user(): Usuario | null {
    return this.currentUser.value;
  }

  get userRole(): string | null {
    return this.user?.rol || null;
  }

  // Métodos de verificación de roles
  isSuperAdmin(): boolean {
    return this.user?.rol === 'super_admin';
  }

  isAdmin(): boolean {
    return this.user?.rol === 'admin' || this.isSuperAdmin();
  }

  isSubdirector(): boolean {
    return this.user?.rol === 'subdirector';
  }

  isFuncionario(): boolean {
    return this.user?.rol === 'funcionario';
  }

  // Métodos de verificación de permisos
  canCreateReservations(): boolean {
    return this.isAdmin() || this.isSubdirector();
  }

  canEditReservations(): boolean {
    return this.isAdmin() || this.isSubdirector();
  }

  canDeleteReservations(): boolean {
    return this.isAdmin();
  }

  canAccessAdminPanel(): boolean {
    return this.isSuperAdmin();
  }

  canViewStatistics(): boolean {
    return this.isSuperAdmin();
  }

  // Método para verificar si tiene al menos uno de los roles
  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.userRole || '');
  }

  // Método para verificar si es usuario activo
  isActiveUser(): boolean {
    return this.user?.activo === true;
  }
}