import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon, IonItem, IonLabel, IonList, IonChip, IonSpinner } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { ReservaCompleta } from '../../models/reserva.model';

@Component({
  selector: 'app-checkin',
  templateUrl: './checkin.page.html',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon, IonItem, IonLabel, IonList, IonChip, IonSpinner]
})
export class CheckinPage implements OnInit {
  reservaId: string = '';
  reserva: ReservaCompleta | null = null;
  cargando = false;
  procesando = false;
  checkinRealizado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabase: SupabaseService,
    private auth: AuthService,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    this.reservaId = this.route.snapshot.paramMap.get('id') || '';
    if (this.reservaId) {
      await this.cargarReserva();
    }
  }

  async cargarReserva() {
    this.cargando = true;
    
    try {
      const { data, error } = await this.supabase.getReservasCompletas({
        id: this.reservaId
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        this.reserva = data[0];
        this.checkinRealizado = this.reserva.checkin_realizado;
      } else {
        throw new Error('Reserva no encontrada');
      }
      
    } catch (error) {
      console.error('Error cargando reserva:', error);
      this.mostrarError('Reserva no encontrada');
      this.router.navigate(['/mis-reservas']);
    } finally {
      this.cargando = false;
    }
  }

  async realizarCheckin() {
    if (!this.reserva || !this.puedeHacerCheckin()) return;

    this.procesando = true;

    try {
      const ahora = new Date();
      
      const { error } = await this.supabase.update('reservas', this.reserva.id, {
        checkin_realizado: true,
        checkin_timestamp: ahora.toISOString(),
        updated_at: ahora.toISOString()
      });
      
      if (error) throw error;
      
      this.checkinRealizado = true;
      this.reserva.checkin_realizado = true;
      this.reserva.checkin_timestamp = ahora.toISOString();
      
      this.mostrarExito('¡Check-in realizado exitosamente!');
      
    } catch (error) {
      console.error('Error en check-in:', error);
      this.mostrarError('Error al realizar check-in');
    } finally {
      this.procesando = false;
    }
  }

  puedeHacerCheckin(): boolean {
    if (!this.reserva || this.reserva.checkin_realizado) return false;
    
    const ahora = new Date();
    const fechaReserva = new Date(this.reserva.fecha + ' ' + this.reserva.hora_inicio);
    const fechaFin = new Date(this.reserva.fecha + ' ' + this.reserva.hora_fin);
    
    // Permitir check-in desde 15 minutos antes hasta 15 minutos después del inicio
    const inicioPermitido = new Date(fechaReserva.getTime() - 15 * 60 * 1000);
    const finPermitido = new Date(fechaReserva.getTime() + 15 * 60 * 1000);
    
    return ahora >= inicioPermitido && ahora <= finPermitido && this.reserva.estado === 'confirmada';
  }

  getTiempoRestante(): string {
    if (!this.reserva) return '';
    
    const ahora = new Date();
    const fechaReserva = new Date(this.reserva.fecha + ' ' + this.reserva.hora_inicio);
    const diferencia = fechaReserva.getTime() - ahora.getTime();
    
    if (diferencia <= 0) {
      const fechaFin = new Date(this.reserva.fecha + ' ' + this.reserva.hora_fin);
      const tiempoRestante = fechaFin.getTime() - ahora.getTime();
      
      if (tiempoRestante > 0) {
        const minutos = Math.floor(tiempoRestante / (1000 * 60));
        return `Reunión en curso (${minutos} min restantes)`;
      } else {
        return 'Reunión finalizada';
      }
    }
    
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(minutos / 60);
    
    if (horas > 0) {
      return `Comienza en ${horas}h ${minutos % 60}min`;
    } else {
      return `Comienza en ${minutos} minutos`;
    }
  }

  getEstadoCheckin(): string {
    if (!this.reserva) return '';
    
    if (this.reserva.checkin_realizado) {
      return 'Check-in completado';
    }
    
    if (this.puedeHacerCheckin()) {
      return 'Disponible para check-in';
    }
    
    const ahora = new Date();
    const fechaReserva = new Date(this.reserva.fecha + ' ' + this.reserva.hora_inicio);
    
    if (ahora < fechaReserva) {
      return 'Muy temprano para check-in';
    } else {
      return 'Tiempo de check-in expirado';
    }
  }

  getColorEstado(): string {
    if (!this.reserva) return 'medium';
    
    if (this.reserva.checkin_realizado) return 'success';
    if (this.puedeHacerCheckin()) return 'primary';
    return 'warning';
  }

  private async mostrarError(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    toast.present();
  }

  private async mostrarExito(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: 'success',
      position: 'top'
    });
    toast.present();
  }
}