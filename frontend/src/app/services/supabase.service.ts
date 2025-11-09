import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    
    // Verificar sesión existente al inicializar
    this.checkSession();
    
    // Escuchar cambios de autenticación
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      this.currentUser.next(user);
    });
  }

  private async checkSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (session?.user) {
      this.currentUser.next(session.user);
    }
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
        redirectTo: `${window.location.origin}/auth/callback`,
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

  // Obtener edificios
  async getEdificios() {
    return await this.supabase
      .from('edificios')
      .select('*')
      .order('nombre');
  }

  // Obtener salas con información del edificio
  async getSalas() {
    return await this.supabase
      .from('salas')
      .select(`
        *,
        edificios (
          id,
          nombre
        )
      `)
      .eq('activa', true)
      .order('edificio_id')
      .order('nombre');
  }

  // Obtener salas por edificio
  async getSalasPorEdificio(edificioId: number) {
    return await this.supabase
      .from('salas')
      .select(`
        *,
        edificios (
          id,
          nombre
        )
      `)
      .eq('edificio_id', edificioId)
      .eq('activa', true)
      .order('nombre');
  }

  // Crear reserva
  async crearReserva(reservaData: any) {
    return await this.supabase
      .from('reservas')
      .insert({
        fecha: reservaData.fecha,
        hora_inicio: reservaData.hora_inicio,
        hora_fin: reservaData.hora_fin,
        sala_id: reservaData.sala_id,
        usuario_id: reservaData.usuario_id,
        proposito: reservaData.proposito,
        responsable_id: reservaData.responsable_id,
        estado: 'confirmada'
      })
      .select();
  }

  // Verificar disponibilidad de sala
  async verificarDisponibilidad(fecha: string, salaId: number, horaInicio: string, horaFin: string) {
    return await this.supabase
      .from('reservas')
      .select('*')
      .eq('fecha', fecha)
      .eq('sala_id', salaId)
      .eq('estado', 'confirmada')
      .or(`and(hora_inicio.lte.${horaInicio},hora_fin.gt.${horaInicio}),and(hora_inicio.lt.${horaFin},hora_fin.gte.${horaFin}),and(hora_inicio.gte.${horaInicio},hora_fin.lte.${horaFin})`);
  }

  // Obtener reservas por fecha y sala
  async getReservasPorFechaYSala(fecha: string, salaId?: number) {
    console.log(`=== CONSULTANDO RESERVAS ===`);
    console.log(`Fecha: ${fecha}`);
    console.log(`Sala ID: ${salaId || 'todas'}`);
    
    let query = this.supabase
      .from('reservas')
      .select('*')
      .eq('fecha', fecha)
      .eq('estado', 'confirmada');
    
    if (salaId) {
      query = query.eq('sala_id', salaId);
    }
    
    const result = await query.order('hora_inicio');
    
    console.log('Resultado de la consulta de reservas:', result);
    console.log('Reservas encontradas:', result.data?.length || 0);
    
    return result;
  }

  // Eliminar reserva
  async eliminarReserva(reservaId: string) {
    return await this.supabase
      .from('reservas')
      .delete()
      .eq('id', reservaId)
      .select();
  }

  // Métodos para historial de reservas
  async getHistorialReservas(filtros?: any) {
    let query = this.supabase.from('vista_historial_completo').select('*');
    
    if (filtros?.usuario_id) {
      query = query.eq('usuario_id', filtros.usuario_id);
    }
    if (filtros?.fecha_inicio) {
      query = query.gte('fecha', filtros.fecha_inicio);
    }
    if (filtros?.fecha_fin) {
      query = query.lte('fecha', filtros.fecha_fin);
    }
    if (filtros?.accion) {
      query = query.eq('accion', filtros.accion);
    }
    
    return await query.order('fecha_accion', { ascending: false });
  }

  async getHistorialReservaEspecifica(reservaId: string) {
    return await this.supabase
      .rpc('obtener_historial_reserva', { p_reserva_id: reservaId });
  }

  async getEstadisticasHistorial() {
    return await this.supabase
      .from('historial_reservas')
      .select('accion');
  }

}