import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, 
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonChip, IonLabel, 
  IonSpinner, IonList, IonItem, IonRefresher, IonRefresherContent,
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

interface ReservaCompleta {
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
}

@Component({
  selector: 'app-mis-reservas',
  templateUrl: './mis-reservas.page.html',
  styleUrls: ['./mis-reservas.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, 
    IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon, 
    IonChip, IonLabel, IonSpinner, IonList, IonItem, IonRefresher, 
    IonRefresherContent
  ]
})
export class MisReservasPage implements OnInit, ViewWillEnter {
  // Estado de la página
  fechaSeleccionada: Date = new Date();
  reservas: ReservaCompleta[] = [];
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
    console.log('🚀 Inicializando Mis Reservas');
  }

  async ionViewWillEnter() {
    console.log('🔄 Entrando a vista Mis Reservas');
    await this.cargarReservas();
  }

  /**
   * Carga las reservas según el rol del usuario
   * - admin/subdirector: todas las reservas del día
   * - funcionario: todas las reservas del día (solo lectura)
   */
  async cargarReservas(event?: any) {
    console.log('📅 Cargando reservas para fecha:', this.fechaFormateada);
    
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

      // Obtener fecha en formato YYYY-MM-DD
      const fechaConsulta = format(this.fechaSeleccionada, 'yyyy-MM-dd');
      console.log('🔍 Consultando reservas para fecha:', fechaConsulta);

      // Consulta según el rol del usuario
      let query;
      
      if (usuario.rol === 'funcionario') {
        console.log('🔒 Modo funcionario: consultando todas las reservas (solo lectura)');
        // Funcionarios ven todas las reservas del día (solo lectura)
        query = this.supabaseService.supabase
          .from('reservas')
          .select(`
            id,
            fecha,
            hora_inicio,
            hora_fin,
            proposito,
            estado,
            usuario_id,
            salas!inner(
              nombre,
              edificios!inner(nombre)
            ),
            usuarios!inner(
              nombre_completo,
              area
            )
          `)
          .eq('fecha', fechaConsulta)
          .eq('estado', 'confirmada')
          .order('hora_inicio', { ascending: true });
          
      } else if (usuario.rol === 'admin' || usuario.rol === 'subdirector') {
        console.log('🔧 Modo admin/subdirector: consultando todas las reservas (con permisos)');
        // Admin y subdirector ven todas las reservas del día (con permisos de edición)
        query = this.supabaseService.supabase
          .from('reservas')
          .select(`
            id,
            fecha,
            hora_inicio,
            hora_fin,
            proposito,
            estado,
            usuario_id,
            salas!inner(
              nombre,
              edificios!inner(nombre)
            ),
            usuarios!inner(
              nombre_completo,
              area
            )
          `)
          .eq('fecha', fechaConsulta)
          .eq('estado', 'confirmada')
          .order('hora_inicio', { ascending: true });
          
      } else {
        console.log('❓ Rol no reconocido, usando consulta por defecto');
        // Fallback: solo sus propias reservas
        query = this.supabaseService.supabase
          .from('reservas')
          .select(`
            id,
            fecha,
            hora_inicio,
            hora_fin,
            proposito,
            estado,
            usuario_id,
            salas!inner(
              nombre,
              edificios!inner(nombre)
            ),
            usuarios!inner(
              nombre_completo,
              area
            )
          `)
          .eq('fecha', fechaConsulta)
          .eq('usuario_id', usuario.id)
          .eq('estado', 'confirmada')
          .order('hora_inicio', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error en consulta:', error);
        throw error;
      }

      console.log('📊 Reservas obtenidas:', data?.length || 0);

      // Mapear datos a la interfaz
      this.reservas = (data || []).map((reserva: any) => ({
        id: reserva.id,
        fecha: reserva.fecha,
        hora_inicio: reserva.hora_inicio,
        hora_fin: reserva.hora_fin,
        proposito: reserva.proposito,
        estado: reserva.estado,
        sala_nombre: reserva.salas?.nombre || 'Sala no encontrada',
        edificio_nombre: reserva.salas?.edificios?.nombre || 'Edificio no encontrado',
        usuario_nombre: reserva.usuarios?.nombre_completo || 'Usuario no encontrado',
        usuario_area: reserva.usuarios?.area || 'Área no especificada',
        usuario_id: reserva.usuario_id
      }));

      this.totalReservas = this.reservas.length;
      console.log('✅ Reservas procesadas:', this.totalReservas);

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
   * Verifica si el usuario puede editar una reserva específica
   */
  puedeEditar(reserva: ReservaCompleta): boolean {
    const usuario = this.authService.user;
    if (!usuario) return false;

    // Admin puede editar todas las reservas
    if (usuario.rol === 'admin' || usuario.rol === 'super_admin') {
      return true;
    }

    // Subdirector puede editar todas las reservas
    if (usuario.rol === 'subdirector') {
      return true;
    }

    // Funcionarios no pueden editar
    return false;
  }

  /**
   * Verifica si el usuario puede cancelar una reserva específica
   */
  puedeCancelar(reserva: ReservaCompleta): boolean {
    const usuario = this.authService.user;
    if (!usuario) return false;

    // Admin puede cancelar todas las reservas
    if (usuario.rol === 'admin' || usuario.rol === 'super_admin') {
      return true;
    }

    // Subdirector puede cancelar todas las reservas
    if (usuario.rol === 'subdirector') {
      return true;
    }

    // Funcionarios no pueden cancelar
    return false;
  }

  /**
   * Verifica si una reserva pertenece al usuario actual
   */
  esMiReserva(reserva: ReservaCompleta): boolean {
    return reserva.usuario_id === this.authService.user?.id;
  }

  /**
   * Cancela una reserva (solo admin/subdirector)
   */
  async cancelarReserva(reserva: ReservaCompleta) {
    if (!this.puedeCancelar(reserva)) {
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

  private async confirmarCancelacion(reserva: ReservaCompleta) {
    try {
      console.log('🗑️ Cancelando reserva:', reserva.id);
      
      const { error } = await this.supabaseService.eliminarReserva(reserva.id);
      
      if (error) throw error;
      
      // Actualizar lista local
      this.reservas = this.reservas.filter(r => r.id !== reserva.id);
      this.totalReservas = this.reservas.length;
      
      this.mostrarExito('Reserva cancelada exitosamente');
      console.log('✅ Reserva cancelada');
      
    } catch (error) {
      console.error('❌ Error cancelando reserva:', error);
      this.mostrarError('Error al cancelar la reserva');
    }
  }

  // Getters para el template
  get fechaFormateada(): string {
    return format(this.fechaSeleccionada, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  }

  get puedeVerTodasLasReservas(): boolean {
    const rol = this.authService.user?.rol;
    return rol === 'admin' || rol === 'subdirector' || rol === 'funcionario';
  }

  get modoSoloLectura(): boolean {
    return this.authService.user?.rol === 'funcionario';
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