import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = new BehaviorSubject<boolean>(false);
  private currentUserProfile = new BehaviorSubject<Usuario | null>(null);

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticated.asObservable();
  }

  get userProfile$(): Observable<Usuario | null> {
    return this.currentUserProfile.asObservable();
  }

  get userProfile(): Usuario | null {
    return this.currentUserProfile.value;
  }

  get isAdmin(): boolean {
    return this.currentUserProfile.value?.es_admin ?? false;
  }

  private async initializeAuth() {
    this.supabase.user$.subscribe(async (user) => {
      if (user) {
        this.isAuthenticated.next(true);
        await this.loadUserProfile(user.id);
      } else {
        this.isAuthenticated.next(false);
        this.currentUserProfile.next(null);
      }
    });
  }

  private async loadUserProfile(userId: string) {
    try {
      const { data, error } = await this.supabase.select('usuarios', '*', { id: userId });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        this.currentUserProfile.next(data[0]);
      } else {
        // Crear perfil de usuario si no existe
        await this.createUserProfile(userId);
      }
    } catch (error) {
      console.error('Error cargando perfil de usuario:', error);
    }
  }

  private async createUserProfile(userId: string) {
    const user = this.supabase.user;
    if (!user) return;

    const newUser: Partial<Usuario> = {
      id: userId,
      email: user.email!,
      nombre_completo: user.user_metadata?.full_name || user.email!,
      es_admin: false,
      activo: true
    };

    try {
      const { data, error } = await this.supabase.insert('usuarios', newUser);
      if (error) throw error;
      
      this.currentUserProfile.next(data[0]);
    } catch (error) {
      console.error('Error creando perfil de usuario:', error);
    }
  }

  async signInWithGoogle() {
    try {
      const { error } = await this.supabase.signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      console.error('Error en login con Google:', error);
      throw error;
    }
  }

  async signInWithMicrosoft() {
    try {
      const { error } = await this.supabase.signInWithMicrosoft();
      if (error) throw error;
    } catch (error) {
      console.error('Error en login con Microsoft:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.signOut();
      if (error) throw error;
      
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }

  async updateProfile(profileData: Partial<Usuario>) {
    const userId = this.supabase.user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    try {
      const { data, error } = await this.supabase.update('usuarios', userId, profileData);
      if (error) throw error;
      
      // Actualizar el perfil local
      const currentProfile = this.currentUserProfile.value;
      if (currentProfile) {
        this.currentUserProfile.next({ ...currentProfile, ...profileData });
      }
      
      return data;
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  }

  canAccess(requiredRole: 'user' | 'admin' = 'user'): boolean {
    if (!this.isAuthenticated.value) return false;
    
    if (requiredRole === 'admin') {
      return this.isAdmin;
    }
    
    return true;
  }
}