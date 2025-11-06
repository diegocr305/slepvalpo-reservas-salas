import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    
    // Escuchar cambios de autenticación
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser.next(session?.user ?? null);
    });
  }

  get user$(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  get user(): User | null {
    return this.currentUser.value;
  }

  // Autenticación
  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/tabs/calendario`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          hd: 'slepvalparaiso.cl'
        }
      }
    });
    
    return { data, error };
  }

  async signInWithMicrosoft() {
    return await this.supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email profile openid'
      }
    });
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  // Operaciones de base de datos
  async query(table: string) {
    return this.supabase.from(table);
  }

  async select(table: string, columns = '*', filters?: any) {
    let query = this.supabase.from(table).select(columns);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key]);
      });
    }
    
    return await query;
  }

  async insert(table: string, data: any) {
    return await this.supabase.from(table).insert(data);
  }

  async update(table: string, id: string | number, data: any) {
    return await this.supabase.from(table).update(data).eq('id', id);
  }

  async delete(table: string, id: string | number) {
    return await this.supabase.from(table).delete().eq('id', id);
  }

  // Funciones específicas para el sistema
  async getReservasCompletas(filtros?: any) {
    let query = this.supabase.from('vista_reservas_completa').select('*');
    
    if (filtros?.fecha_inicio) {
      query = query.gte('fecha', filtros.fecha_inicio);
    }
    if (filtros?.fecha_fin) {
      query = query.lte('fecha', filtros.fecha_fin);
    }
    if (filtros?.sala_id) {
      query = query.eq('sala_id', filtros.sala_id);
    }
    if (filtros?.usuario_id) {
      query = query.eq('usuario_id', filtros.usuario_id);
    }
    
    return await query.order('fecha', { ascending: true });
  }

  async getDisponibilidadSalas(fecha?: string) {
    let query = this.supabase.from('disponibilidad_salas').select('*');
    
    if (fecha) {
      query = query.eq('fecha', fecha);
    }
    
    return await query.order('fecha', { ascending: true });
  }

  async getEstadisticasSalas() {
    return await this.supabase
      .from('estadisticas_salas_mensual')
      .select('*')
      .order('mes', { ascending: false });
  }
}