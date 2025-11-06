import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonButton, IonIcon, IonChip, IonBadge, IonList, IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { EstadisticasSala, ReservaCompleta } from '../../models/reserva.model';
import { Sala } from '../../models/sala.model';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonButton, IonIcon, IonChip, IonBadge, IonList, IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent]
})
export class AdminPage implements OnInit {
  vistaActual = 'estadisticas';
  estadisticas: EstadisticasSala[] = [];
  reservasRecientes: ReservaCompleta[] = [];
  salas: Sala[] = [];
  cargando = false;

  // Métricas generales
  totalReservasHoy = 0;
  totalReservasMes = 0;
  tasaNoShow = 0;
  salasMasUsadas: any[] = [];

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  async ngOnInit() {
    if (!this.auth.isAdmin) {
      console.error('Acceso denegado: No es administrador');
      return;
    }
    await this.cargarDatos();
  }

  async cargarDatos(event?: any) {
    this.cargando = true;
    
    try {
      await Promise.all([
        this.cargarEstadisticas(),
        this.cargarReservasRecientes(),
        this.cargarSalas(),
        this.calcularMetricas()
      ]);
    } catch (error) {
      console.error('Error cargando datos admin:', error);
    } finally {
      this.cargando = false;
      if (event) event.target.complete();
    }
  }

  async cargarEstadisticas() {
    try {
      const { data, error } = await this.supabase.getEstadisticasSalas();
      if (error) throw error;
      this.estadisticas = data || [];
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }

  async cargarReservasRecientes() {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const { data, error } = await this.supabase.getReservasCompletas({
        fecha_inicio: hoy
      });
      
      if (error) throw error;
      this.reservasRecientes = (data || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
    } catch (error) {
      console.error('Error cargando reservas recientes:', error);
    }
  }

  async cargarSalas() {
    try {
      const { data, error } = await this.supabase.select('salas', `
        *,
        edificios:edificio_id (nombre)
      `);
      
      if (error) throw error;
      this.salas = data || [];
    } catch (error) {
      console.error('Error cargando salas:', error);
    }
  }

  async calcularMetricas() {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      
      // Reservas de hoy
      const { data: reservasHoy } = await this.supabase.getReservasCompletas({
        fecha_inicio: hoy,
        fecha_fin: hoy
      });
      this.totalReservasHoy = reservasHoy?.length || 0;

      // Reservas del mes
      const { data: reservasMes } = await this.supabase.getReservasCompletas({
        fecha_inicio: inicioMes,
        fecha_fin: hoy
      });
      this.totalReservasMes = reservasMes?.length || 0;

      // Tasa de no-show
      const noShows = reservasMes?.filter(r => r.estado === 'no_show').length || 0;
      this.tasaNoShow = this.totalReservasMes > 0 ? (noShows / this.totalReservasMes) * 100 : 0;

      // Salas más usadas
      const usoSalas = {};
      reservasMes?.forEach(r => {
        const key = `${r.sala_nombre} (${r.edificio_nombre})`;
        usoSalas[key] = (usoSalas[key] || 0) + 1;
      });
      
      this.salasMasUsadas = Object.entries(usoSalas)
        .map(([sala, count]) => ({ sala, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    } catch (error) {
      console.error('Error calculando métricas:', error);
    }
  }

  onSegmentChange(event: any) {
    this.vistaActual = event.detail.value;
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'confirmada': return 'success';
      case 'cancelada': return 'medium';
      case 'no_show': return 'danger';
      default: return 'primary';
    }
  }

  async toggleSalaActiva(sala: Sala) {
    try {
      const { error } = await this.supabase.update('salas', sala.id, {
        activa: !sala.activa
      });
      
      if (error) throw error;
      
      sala.activa = !sala.activa;
    } catch (error) {
      console.error('Error actualizando sala:', error);
    }
  }

  generarQRSala(salaId: number) {
    // TODO: Implementar generación de QR
    console.log('Generar QR para sala:', salaId);
  }
}