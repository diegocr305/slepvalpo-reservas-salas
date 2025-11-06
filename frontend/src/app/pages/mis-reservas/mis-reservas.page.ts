import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon, IonChip, IonLabel, IonItem, IonList, IonRefresher, IonRefresherContent, IonFab, IonFabButton, AlertController, ToastController } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { EmailService } from '../../services/email.service';
import { ReservaCompleta } from '../../models/reserva.model';

@Component({
  selector: 'app-mis-reservas',
  templateUrl: './mis-reservas.page.html',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon, IonChip, IonLabel, IonItem, IonList, IonRefresher, IonRefresherContent, IonFab, IonFabButton]
})
export class MisReservasPage implements OnInit {
  reservas: ReservaCompleta[] = [];
  cargando = false;

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private email: EmailService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    await this.cargarReservas();
  }

  async cargarReservas(event?: any) {
    this.cargando = true;
    
    try {
      const usuario = this.auth.userProfile;
      if (!usuario) return;

      const { data, error } = await this.supabase.getReservasCompletas({
        usuario_id: usuario.id
      });
      
      if (error) throw error;
      
      this.reservas = (data || []).sort((a, b) => 
        new Date(b.fecha + ' ' + b.hora_inicio).getTime() - 
        new Date(a.fecha + ' ' + a.hora_inicio).getTime()
      );
      
    } catch (error) {
      console.error('Error cargando reservas:', error);
      this.mostrarError('Error cargando las reservas');
    } finally {
      this.cargando = false;
      if (event) event.target.complete();
    }
  }

  async cancelarReserva(reserva: ReservaCompleta) {
    const alert = await this.alertController.create({
      header: 'Cancelar Reserva',
      message: `¿Estás seguro de cancelar la reserva del ${reserva.fecha} en ${reserva.sala_nombre}?`,
      buttons: [
        { text: 'No', role: 'cancel' },
        { 
          text: 'Sí, Cancelar', 
          handler: () => this.confirmarCancelacion(reserva)
        }
      ]
    });
    await alert.present();
  }

  private async confirmarCancelacion(reserva: ReservaCompleta) {
    try {
      const { error } = await this.supabase.update('reservas', reserva.id, {
        estado: 'cancelada',
        updated_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      await this.email.enviarNotificacionReservaCancelada(reserva);
      await this.cargarReservas();
      this.mostrarExito('Reserva cancelada exitosamente');
      
    } catch (error) {
      console.error('Error cancelando reserva:', error);
      this.mostrarError('Error al cancelar la reserva');
    }
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'confirmada': return 'success';
      case 'cancelada': return 'medium';
      case 'no_show': return 'danger';
      default: return 'primary';
    }
  }

  getIconoEstado(estado: string): string {
    switch (estado) {
      case 'confirmada': return 'checkmark-circle';
      case 'cancelada': return 'close-circle';
      case 'no_show': return 'warning';
      default: return 'time';
    }
  }

  esReservaPasada(reserva: ReservaCompleta): boolean {
    const fechaReserva = new Date(reserva.fecha + ' ' + reserva.hora_fin);
    return fechaReserva < new Date();
  }

  puedeEditar(reserva: ReservaCompleta): boolean {
    return reserva.estado === 'confirmada' && !this.esReservaPasada(reserva);
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