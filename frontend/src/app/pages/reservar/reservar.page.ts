import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { EmailService } from '../../services/email.service';
import { NuevaReserva } from '../../models/reserva.model';
import { Sala } from '../../models/sala.model';

@Component({
  selector: 'app-reservar',
  templateUrl: './reservar.page.html',
  styleUrls: ['./reservar.page.scss']
})
export class ReservarPage implements OnInit {
  reserva: NuevaReserva = {
    fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '09:00',
    hora_fin: '10:00',
    sala_id: 0,
    proposito: ''
  };

  salas: Sala[] = [];
  horasDisponibles: string[] = [];
  cargando = false;
  guardando = false;

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private email: EmailService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    await this.cargarSalas();
    this.generarHorasDisponibles();
  }

  async cargarSalas() {
    try {
      const { data, error } = await this.supabase.select('salas', `
        *,
        edificios:edificio_id (
          id,
          nombre
        )
      `, { activa: true });
      
      if (error) throw error;
      this.salas = data || [];
      
      if (this.salas.length > 0) {
        this.reserva.sala_id = this.salas[0].id;
      }
    } catch (error) {
      console.error('Error cargando salas:', error);
      this.mostrarError('Error cargando las salas disponibles');
    }
  }

  generarHorasDisponibles() {
    this.horasDisponibles = [];
    for (let i = 8; i <= 18; i++) {
      this.horasDisponibles.push(`${i.toString().padStart(2, '0')}:00`);
    }
  }

  async onFechaChange() {
    await this.verificarDisponibilidad();
  }

  async onSalaChange() {
    await this.verificarDisponibilidad();
  }

  async onHoraInicioChange() {
    // Ajustar hora fin automáticamente (mínimo 1 hora)
    const horaInicio = parseInt(this.reserva.hora_inicio.split(':')[0]);
    const horaFin = horaInicio + 1;
    
    if (horaFin <= 18) {
      this.reserva.hora_fin = `${horaFin.toString().padStart(2, '0')}:00`;
    }
    
    await this.verificarDisponibilidad();
  }

  async verificarDisponibilidad() {
    if (!this.reserva.sala_id || !this.reserva.fecha) return;

    try {
      const { data, error } = await this.supabase.getReservasCompletas({
        fecha_inicio: this.reserva.fecha,
        fecha_fin: this.reserva.fecha,
        sala_id: this.reserva.sala_id
      });

      if (error) throw error;

      // Verificar conflictos de horario
      const reservasExistentes = data || [];
      const hayConflicto = reservasExistentes.some(r => 
        r.estado === 'confirmada' &&
        this.hayConflictoHorario(
          this.reserva.hora_inicio,
          this.reserva.hora_fin,
          r.hora_inicio,
          r.hora_fin
        )
      );

      if (hayConflicto) {
        this.mostrarAdvertencia('El horario seleccionado no está disponible');
      }

    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
    }
  }

  private hayConflictoHorario(
    inicio1: string, fin1: string,
    inicio2: string, fin2: string
  ): boolean {
    return (inicio1 < fin2) && (fin1 > inicio2);
  }

  async guardarReserva() {
    if (!this.validarFormulario()) return;

    this.guardando = true;

    try {
      const usuario = this.auth.userProfile;
      if (!usuario) throw new Error('Usuario no autenticado');

      // Verificar disponibilidad una vez más
      await this.verificarDisponibilidad();

      const nuevaReserva = {
        ...this.reserva,
        usuario_id: usuario.id,
        estado: 'confirmada'
      };

      const { data, error } = await this.supabase.insert('reservas', nuevaReserva);
      
      if (error) throw error;

      // Enviar notificación por email
      if (data && data.length > 0) {
        const reservaCompleta = await this.obtenerReservaCompleta(data[0].id);
        if (reservaCompleta) {
          await this.email.enviarNotificacionReservaCreada(reservaCompleta);
        }
      }

      await this.mostrarExito('Reserva creada exitosamente');
      this.router.navigate(['/mis-reservas']);

    } catch (error) {
      console.error('Error guardando reserva:', error);
      this.mostrarError('Error al crear la reserva. Inténtalo nuevamente.');
    } finally {
      this.guardando = false;
    }
  }

  private async obtenerReservaCompleta(reservaId: string) {
    try {
      const { data, error } = await this.supabase.getReservasCompletas({ id: reservaId });
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error obteniendo reserva completa:', error);
      return null;
    }
  }

  private validarFormulario(): boolean {
    if (!this.reserva.fecha) {
      this.mostrarError('Selecciona una fecha');
      return false;
    }

    if (!this.reserva.sala_id) {
      this.mostrarError('Selecciona una sala');
      return false;
    }

    if (!this.reserva.proposito.trim()) {
      this.mostrarError('Describe el propósito de la reunión');
      return false;
    }

    if (this.reserva.hora_inicio >= this.reserva.hora_fin) {
      this.mostrarError('La hora de fin debe ser posterior a la hora de inicio');
      return false;
    }

    return true;
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

  private async mostrarAdvertencia(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: 'warning',
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

  getSalaNombre(salaId: number): string {
    const sala = this.salas.find(s => s.id === salaId);
    return sala ? `${sala.nombre} - ${sala.edificio?.nombre}` : '';
  }
}