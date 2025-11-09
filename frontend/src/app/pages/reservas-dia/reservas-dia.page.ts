import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, 
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton, IonIcon, IonSpinner, IonList, 
  IonItem, IonLabel, IonRefresher, IonRefresherContent, IonChip, IonAccordion, IonAccordionGroup,
  AlertController, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  chevronBackOutline, chevronForwardOutline, calendarOutline, timeOutline, 
  businessOutline, personOutline, documentTextOutline, createOutline, 
  trashOutline, eyeOutline 
} from 'ionicons/icons';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

interface ReservaDia {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  proposito: string;
  estado: string;
  sala_nombre: string;
  edificio_nombre: string;
  usuario_nombre: string;
  usuario_area: string;
  usuario_id: string;
  responsable_nombre?: string;
}

@Component({
  selector: 'app-reservas-dia',
  templateUrl: './reservas-dia.page.html',
  styleUrls: ['./reservas-dia.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, 
    IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton, IonIcon, 
    IonSpinner, IonList, IonItem, IonLabel, IonRefresher, 
    IonRefresherContent, IonChip, IonAccordion, IonAccordionGroup
  ]
})
export class ReservasDiaPage implements OnInit, ViewWillEnter {
  // Estado de la página
  fechaSeleccionada: Date = new Date();
  reservas: ReservaDia[] = [];
  cargando = false;
  totalReservas = 0;

  constructor(
    private supabaseService: SupabaseService,
    public authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    // Registrar iconos de Ionic
    addIcons({ 
      chevronBackOutline, chevronForwardOutline, calendarOutline, timeOutline, 
      businessOutline, personOutline, documentTextOutline, createOutline, 
      trashOutline, eyeOutline 
    });
  }

  async ngOnInit() {
    console.log('🚀 Inicializando Reservas del Día');
    console.log('👤 Rol del usuario:', this.authService.user?.rol);
  }

  async ionViewWillEnter() {
    console.log('🔄 Entrando a vista Reservas del Día');
    await this.cargarReservas();
  }

  /**
   * Carga las reservas del día según el rol del usuario
   * - admin/subdirector: todas las reservas del día con permisos de edición
   * - funcionario: todas las reservas del día (solo lectura)
   */
  async cargarReservas(event?: any) {
    const fechaConsulta = format(this.fechaSeleccionada, 'yyyy-MM-dd');
    console.log('📅 Cargando reservas para fecha:', fechaConsulta);
    
    this.cargando = true;
    
    try {
      // Verificar usuario autenticado
      const usuario = this.authService.user;
      if (!usuario) {
        console.log('❌ Usuario no autenticado');
        this.mostrarError('Usuario no autenticado');
        return;
      }

      console.log('👤 Usuario detectado:', usuario.email, 'Rol:', usuario.rol);

      let query;
      
      if (usuario.rol === 'funcionario') {
        console.log('🔒 Modo funcionario: consultando todas las reservas (solo lectura)');
        // Funcionarios usan función RPC que bypassa RLS
        const { data, error } = await this.supabaseService.supabase
          .rpc('get_reservas_del_dia', { fecha_consulta: fechaConsulta });
        
        if (error) {
          console.error('❌ Error en RPC:', error);
          throw error;
        }

        console.log('📊 Reservas obtenidas (RPC):', data?.length || 0);

        // Mapear datos directamente
        this.reservas = (data || []).map((reserva: any) => ({
          id: reserva.id,
          fecha: reserva.fecha,
          hora_inicio: reserva.hora_inicio,
          hora_fin: reserva.hora_fin,
          proposito: reserva.proposito,
          estado: reserva.estado,
          sala_nombre: reserva.sala_nombre,
          edificio_nombre: reserva.edificio_nombre,
          usuario_nombre: reserva.usuario_nombre,
          usuario_area: reserva.usuario_area || 'Área no especificada',
          usuario_id: reserva.usuario_id,
          responsable_nombre: reserva.responsable_nombre
        }));
        
      } else if (usuario.rol === 'admin' || usuario.rol === 'subdirector' || usuario.rol === 'super_admin') {
        console.log('🔧 Modo admin/subdirector: consultando todas las reservas (con permisos)');
        // Admin y subdirector también usan RPC para ver todas las reservas
        const { data, error } = await this.supabaseService.supabase
          .rpc('get_reservas_del_dia', { fecha_consulta: fechaConsulta });
        
        if (error) {
          console.error('❌ Error en RPC:', error);
          throw error;
        }

        console.log('📊 Reservas obtenidas (RPC Admin):', data?.length || 0);

        // Mapear datos directamente
        this.reservas = (data || []).map((reserva: any) => {
          console.log('📊 Mapeando reserva:', {
            id: reserva.id,
            usuario_id: reserva.usuario_id,
            usuario_nombre: reserva.usuario_nombre,
            sala: reserva.sala_nombre,
            horario: `${reserva.hora_inicio}-${reserva.hora_fin}`
          });
          
          return {
            id: reserva.id,
            fecha: reserva.fecha,
            hora_inicio: reserva.hora_inicio,
            hora_fin: reserva.hora_fin,
            proposito: reserva.proposito,
            estado: reserva.estado,
            sala_nombre: reserva.sala_nombre,
            edificio_nombre: reserva.edificio_nombre,
            usuario_nombre: reserva.usuario_nombre,
            usuario_area: reserva.usuario_area || 'Área no especificada',
            usuario_id: reserva.usuario_id,
            responsable_nombre: reserva.responsable_nombre
          };
        });
      }

      this.totalReservas = this.reservas.length;
      console.log('✅ Total de reservas cargadas:', this.totalReservas);
      
      // Agrupar reservas por sala
      this.agruparReservasPorSala();

    } catch (error) {
      console.error('❌ Error cargando reservas:', error);
      this.mostrarError('Error al cargar las reservas');
      this.reservas = [];
      this.totalReservas = 0;
    } finally {
      this.cargando = false;
      if (event) event.target.complete();
      this.cdr.detectChanges();
    }
  }

  /**
   * Cambia el día seleccionado
   * @param direction 'next' para día siguiente, 'prev' para día anterior
   */
  changeDay(direction: 'next' | 'prev') {
    console.log(`📅 Cambiando día: ${direction}`);
    
    if (direction === 'next') {
      this.fechaSeleccionada = addDays(this.fechaSeleccionada, 1);
    } else {
      this.fechaSeleccionada = subDays(this.fechaSeleccionada, 1);
    }
    
    console.log('📅 Nueva fecha seleccionada:', this.fechaFormateada);
    this.cargarReservas();
  }

  /**
   * Verifica si el usuario puede editar reservas
   */
  puedeEditar(): boolean {
    const usuario = this.authService.user;
    if (!usuario) return false;

    // Admin y subdirector pueden editar
    return usuario.rol === 'admin' || usuario.rol === 'super_admin' || usuario.rol === 'subdirector';
  }

  /**
   * Verifica si el usuario puede cancelar reservas
   */
  puedeCancelar(): boolean {
    const usuario = this.authService.user;
    if (!usuario) return false;

    // Solo admin y super_admin pueden cancelar cualquier reserva
    return usuario.rol === 'admin' || usuario.rol === 'super_admin';
  }

  /**
   * Verifica si el usuario puede cancelar una reserva específica
   * Admin: puede cancelar cualquier reserva
   * Subdirector: solo puede cancelar sus propias reservas
   */
  puedeCancelarReserva(reserva: ReservaDia): boolean {
    const usuario = this.authService.user;
    if (!usuario) {
      console.log('🚫 No hay usuario autenticado');
      return false;
    }

    console.log('🔍 Verificando permisos para cancelar:');
    console.log('- Usuario ID:', usuario.id);
    console.log('- Rol usuario:', usuario.rol);
    console.log('- Reserva usuario ID:', reserva.usuario_id);
    console.log('- Es mi reserva?:', this.esMiReserva(reserva));

    // Admin y super_admin pueden cancelar cualquier reserva
    if (usuario.rol === 'admin' || usuario.rol === 'super_admin') {
      console.log('✅ Admin/Super_admin: puede cancelar cualquier reserva');
      return true;
    }

    // Subdirector solo puede cancelar sus propias reservas
    if (usuario.rol === 'subdirector') {
      const esMia = this.esMiReserva(reserva);
      console.log(`🟡 Subdirector: puede cancelar solo sus reservas - Resultado: ${esMia}`);
      return esMia;
    }

    console.log('❌ Sin permisos para cancelar');
    return false;
  }

  /**
   * Verifica si una reserva pertenece al usuario actual
   */
  esMiReserva(reserva: ReservaDia): boolean {
    const resultado = reserva.usuario_id === this.authService.user?.id;
    console.log(`🔎 esMiReserva - Reserva ID: ${reserva.usuario_id}, Mi ID: ${this.authService.user?.id}, Resultado: ${resultado}`);
    return resultado;
  }

  /**
   * Cancela una reserva (según permisos por rol)
   */
  async cancelarReserva(reserva: ReservaDia) {
    if (!this.puedeCancelarReserva(reserva)) {
      this.mostrarError('No tienes permisos para cancelar esta reserva');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Cancelar Reserva',
      message: `¿Estás seguro de cancelar la reserva de ${reserva.usuario_nombre} en ${reserva.sala_nombre}?`,
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

  private async confirmarCancelacion(reserva: ReservaDia) {
    try {
      console.log('🗑️ Cancelando reserva:', reserva.id);
      
      const { error } = await this.supabaseService.eliminarReserva(reserva.id);
      
      if (error) throw error;
      
      this.mostrarExito('Reserva cancelada exitosamente');
      
      // Recargar reservas para actualizar la vista
      await this.cargarReservas();
      
      // Forzar actualización de la UI
      this.cdr.detectChanges();
      
      console.log('✅ Cancelación completada');
      
      // Verificar que la reserva se eliminó
      const reservaEliminada = this.reservas.find(r => r.id === reserva.id);
      console.log('🔍 Reserva eliminada del array?', !reservaEliminada);
      
    } catch (error) {
      console.error('❌ Error cancelando reserva:', error);
      this.mostrarError('Error al cancelar la reserva');
    }
  }

  // Getters para el template
  get fechaFormateada(): string {
    return format(this.fechaSeleccionada, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  }

  get modoSoloLectura(): boolean {
    return this.authService.user?.rol === 'funcionario';
  }

  // Agrupación por salas
  reservasPorSala: { [key: string]: ReservaDia[] } = {};
  salasConReservas: string[] = [];

  /**
   * Agrupa las reservas por sala para mostrar en acordeones
   */
  private agruparReservasPorSala() {
    this.reservasPorSala = {};
    
    this.reservas.forEach(reserva => {
      const salaKey = `${reserva.edificio_nombre} - ${reserva.sala_nombre}`;
      
      if (!this.reservasPorSala[salaKey]) {
        this.reservasPorSala[salaKey] = [];
      }
      
      this.reservasPorSala[salaKey].push(reserva);
    });
    
    // Ordenar reservas dentro de cada sala por hora
    Object.keys(this.reservasPorSala).forEach(sala => {
      this.reservasPorSala[sala].sort((a, b) => 
        a.hora_inicio.localeCompare(b.hora_inicio)
      );
    });
    
    this.salasConReservas = Object.keys(this.reservasPorSala).sort();
    console.log('🏢 Reservas agrupadas por sala:', this.reservasPorSala);
  }

  /**
   * Obtiene el número de reservas por sala
   */
  getReservasPorSala(sala: string): number {
    return this.reservasPorSala[sala]?.length || 0;
  }

  // Métodos de utilidad
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