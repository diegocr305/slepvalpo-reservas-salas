import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';
import { ReservaCompleta, DisponibilidadSala } from '../../models/reserva.model';
import { Sala } from '../../models/sala.model';

@Component({
  selector: 'app-calendario',
  templateUrl: './calendario.page.html',
  styleUrls: ['./calendario.page.scss']
})
export class CalendarioPage implements OnInit {
  reservas: ReservaCompleta[] = [];
  salas: Sala[] = [];
  disponibilidad: DisponibilidadSala[] = [];
  fechaSeleccionada: string = new Date().toISOString().split('T')[0];
  salaSeleccionada: number | null = null;
  cargando = false;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.cargarSalas();
    await this.cargarCalendario();
  }

  async cargarSalas() {
    try {
      const { data, error } = await this.supabase.select('salas', `
        *,
        edificios:edificio_id (
          id,
          nombre
        )
      `);
      
      if (error) throw error;
      this.salas = data || [];
    } catch (error) {
      console.error('Error cargando salas:', error);
    }
  }

  async cargarCalendario() {
    this.cargando = true;
    
    try {
      const filtros = {
        fecha_inicio: this.fechaSeleccionada,
        fecha_fin: this.fechaSeleccionada
      };

      if (this.salaSeleccionada) {
        filtros['sala_id'] = this.salaSeleccionada;
      }

      const { data, error } = await this.supabase.getReservasCompletas(filtros);
      
      if (error) throw error;
      this.reservas = data || [];

      // Cargar disponibilidad
      const { data: disponibilidadData } = await this.supabase.getDisponibilidadSalas(this.fechaSeleccionada);
      this.disponibilidad = disponibilidadData || [];
      
    } catch (error) {
      console.error('Error cargando calendario:', error);
    } finally {
      this.cargando = false;
    }
  }

  async onFechaChange() {
    await this.cargarCalendario();
  }

  async onSalaChange() {
    await this.cargarCalendario();
  }

  getReservasPorSala(salaId: number): ReservaCompleta[] {
    return this.reservas.filter(r => r.sala_id === salaId);
  }

  getHorasDisponibles(salaId: number): string[] {
    const disponibilidadSala = this.disponibilidad.find(d => d.sala_id === salaId);
    const horasOcupadas = disponibilidadSala?.horas_ocupadas || [];
    
    const todasLasHoras = this.generarHorasDelDia();
    return todasLasHoras.filter(hora => !horasOcupadas.includes(hora));
  }

  private generarHorasDelDia(): string[] {
    const horas = [];
    for (let i = 8; i <= 18; i++) {
      horas.push(`${i.toString().padStart(2, '0')}:00-${(i + 1).toString().padStart(2, '0')}:00`);
    }
    return horas;
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'confirmada': return 'success';
      case 'cancelada': return 'medium';
      case 'no_show': return 'danger';
      default: return 'primary';
    }
  }

  navegarAReservar(salaId?: number, hora?: string) {
    // TODO: Implementar navegación a página de reservar
    console.log('Navegar a reservar:', { salaId, hora, fecha: this.fechaSeleccionada });
  }
}