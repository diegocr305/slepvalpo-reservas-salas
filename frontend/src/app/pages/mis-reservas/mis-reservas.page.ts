import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, 
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton, IonIcon, IonChip, IonLabel, 
  IonSpinner, IonList, IonItem, IonRefresher, IonRefresherContent, IonAlert, IonAvatar,
  AlertController, ActionSheetController, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  chevronBackOutline, chevronForwardOutline, calendarOutline, timeOutline, 
  businessOutline, personOutline, documentTextOutline, createOutline, 
  trashOutline, eyeOutline, closeCircle 
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
    IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton, IonIcon, 
    IonChip, IonLabel, IonSpinner, IonList, IonItem, IonRefresher, 
    IonRefresherContent, IonAlert, IonAvatar
  ]
})
export class MisReservasPage implements OnInit, ViewWillEnter {
  // Estado de la página
  fechaSeleccionada: Date = new Date();
  reservas: ReservaCompleta[] = [];
  cargando = false;
  totalReservas = 0;
  
  // Edición con chips
  mostrandoEdicion = false;
  reservaAEditar: ReservaCompleta | null = null;
  bloquesParaEditar: any[] = [];

  constructor(
    private supabaseService: SupabaseService,
    public authService: AuthService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    // Registrar iconos de Ionic
    addIcons({ 
      chevronBackOutline, chevronForwardOutline, calendarOutline, timeOutline, 
      businessOutline, personOutline, documentTextOutline, createOutline, 
      trashOutline, eyeOutline, closeCircle 
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
          usuario_id: reserva.usuario_id
        }));

        // Agrupar reservas consecutivas para funcionarios también
        this.reservas = this.agruparReservasConsecutivas(this.reservas);
        this.totalReservas = this.reservas.length;
        
        console.log('✅ Reservas procesadas y agrupadas (funcionario):', this.reservas.length);
        return; // Salir temprano para funcionarios
          
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

      // Agrupar reservas consecutivas ANTES de contar
      this.reservas = this.agruparReservasConsecutivas(this.reservas);
      this.totalReservas = this.reservas.length;
      
      console.log('✅ Reservas procesadas y agrupadas:', this.reservas.length);

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
   * Edita una reserva (permite eliminar bloques individuales)
   */
  async editarReserva(reserva: ReservaCompleta) {
    if (!this.puedeEditar(reserva)) {
      this.mostrarError('No tienes permisos para editar esta reserva');
      return;
    }

    const esAgrupada = reserva.id.startsWith('agrupada-');
    
    if (esAgrupada) {
      // Para reservas agrupadas, mostrar alert con opciones
      await this.mostrarAlertEdicion(reserva);
    } else {
      // Para reservas individuales, solo permitir cancelar
      await this.cancelarReserva(reserva);
    }
  }

  /**
   * Muestra alert con opciones de edición para reservas agrupadas
   */
  private async mostrarAlertEdicion(reserva: ReservaCompleta) {
    try {
      // Obtener todas las reservas individuales del grupo
      const fechaConsulta = format(this.fechaSeleccionada, 'yyyy-MM-dd');
      
      const { data: reservasIndividuales, error } = await this.supabaseService.supabase
        .from('reservas')
        .select('id, hora_inicio, hora_fin')
        .eq('fecha', fechaConsulta)
        .eq('usuario_id', reserva.usuario_id)
        .eq('estado', 'confirmada')
        .order('hora_inicio');
        
      console.log('Reservas individuales encontradas:', reservasIndividuales);
      
      // Filtrar solo las que están en el rango de la reserva agrupada
      const reservasFiltradas = reservasIndividuales?.filter(res => 
        res.hora_inicio >= reserva.hora_inicio && res.hora_fin <= reserva.hora_fin
      ) || [];
      
      console.log('Reservas filtradas:', reservasFiltradas);
        
      if (error) throw error;
      
      if (!reservasFiltradas || reservasFiltradas.length === 0) {
        this.mostrarError('No se encontraron reservas para editar');
        return;
      }

      // Preparar bloques para edición con chips (eliminar duplicados por horario)
      const bloquesUnicos = new Map();
      reservasFiltradas.forEach(res => {
        const key = `${res.hora_inicio}-${res.hora_fin}`;
        if (!bloquesUnicos.has(key)) {
          bloquesUnicos.set(key, {
            id: res.id,
            horario: `${res.hora_inicio} - ${res.hora_fin}`,
            hora_inicio: res.hora_inicio,
            hora_fin: res.hora_fin
          });
        }
      });
      
      this.bloquesParaEditar = Array.from(bloquesUnicos.values());
      console.log('Bloques únicos para editar:', this.bloquesParaEditar);
      
      this.reservaAEditar = reserva;
      this.mostrandoEdicion = true;
      
    } catch (error) {
      console.error('Error obteniendo reservas individuales:', error);
      this.mostrarError('Error al cargar los detalles de la reserva');
    }
  }

  /**
   * Cierra la edición de chips
   */
  cerrarEdicion() {
    this.mostrandoEdicion = false;
    this.reservaAEditar = null;
    this.bloquesParaEditar = [];
  }

  /**
   * Elimina un chip de bloque (elimina el bloque de la reserva)
   */
  async eliminarChipBloque(bloque: any) {
    await this.eliminarBloqueIndividual(bloque.id, bloque.horario);
    
    // Remover el bloque de la lista local
    this.bloquesParaEditar = this.bloquesParaEditar.filter(b => b.id !== bloque.id);
    
    // Si no quedan bloques, cerrar edición
    if (this.bloquesParaEditar.length === 0) {
      this.cerrarEdicion();
    }
  }

  /**
   * Elimina un bloque individual de una reserva agrupada
   */
  private async eliminarBloqueIndividual(reservaId: string, horario: string) {
    const alert = await this.alertController.create({
      header: 'Eliminar bloque',
      message: `¿Estás seguro de eliminar el bloque ${horario}?`,
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí, eliminar',
          handler: async () => {
            try {
              console.log('🗑️ Eliminando bloque individual:', reservaId);
              
              const { error } = await this.supabaseService.eliminarReserva(reservaId);
              
              if (error) throw error;
              
              this.mostrarExito(`Bloque ${horario} eliminado exitosamente`);
              
              // Recargar reservas para actualizar la agrupación
              await this.cargarReservas();
              
            } catch (error) {
              console.error('Error eliminando bloque:', error);
              this.mostrarError('Error al eliminar el bloque');
            }
          }
        }
      ]
    });
    
    await alert.present();
  }

  /**
   * Cancela una reserva (solo admin/subdirector)
   */
  async cancelarReserva(reserva: ReservaCompleta) {
    if (!this.puedeCancelar(reserva)) {
      this.mostrarError('No tienes permisos para cancelar esta reserva');
      return;
    }

    const esAgrupada = reserva.id.startsWith('agrupada-');
    const mensaje = esAgrupada 
      ? `¿Estás seguro de cancelar TODAS las reservas agrupadas de ${reserva.usuario_nombre} en ${reserva.sala_nombre} (${reserva.hora_inicio}-${reserva.hora_fin})?`
      : `¿Estás seguro de cancelar la reserva de ${reserva.usuario_nombre} en ${reserva.sala_nombre}?`;

    const alert = await this.alertController.create({
      header: 'Cancelar Reserva',
      message: mensaje,
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
      const esAgrupada = reserva.id.startsWith('agrupada-');
      
      if (esAgrupada) {
        console.log('🗑️ Cancelando reserva agrupada para:', reserva.usuario_nombre);
        
        // Para reservas agrupadas, necesitamos encontrar todas las reservas individuales
        // y cancelarlas una por una
        const fechaConsulta = format(this.fechaSeleccionada, 'yyyy-MM-dd');
        
        // Buscar todas las reservas del usuario en esa sala y horario
        const { data: reservasIndividuales, error: errorBusqueda } = await this.supabaseService.supabase
          .from('reservas')
          .select('id')
          .eq('fecha', fechaConsulta)
          .eq('usuario_id', reserva.usuario_id)
          .gte('hora_inicio', reserva.hora_inicio)
          .lte('hora_fin', reserva.hora_fin)
          .eq('estado', 'confirmada');
          
        if (errorBusqueda) throw errorBusqueda;
        
        // Cancelar cada reserva individual
        for (const reservaInd of reservasIndividuales || []) {
          const { error } = await this.supabaseService.eliminarReserva(reservaInd.id);
          if (error) {
            console.error('Error cancelando reserva individual:', reservaInd.id, error);
          }
        }
        
        this.mostrarExito(`${reservasIndividuales?.length || 0} reservas canceladas exitosamente`);
        
      } else {
        console.log('🗑️ Cancelando reserva individual:', reserva.id);
        
        const { error } = await this.supabaseService.eliminarReserva(reserva.id);
        
        if (error) throw error;
        
        this.mostrarExito('Reserva cancelada exitosamente');
      }
      
      // Recargar todas las reservas para actualizar la vista
      await this.cargarReservas();
      
      console.log('✅ Cancelación completada');
      
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

  /**
   * Agrupa reservas consecutivas del mismo usuario en la misma sala
   * Ejemplo: 09:00-10:00, 10:00-11:00, 11:00-12:00 → 09:00-12:00
   */
  private agruparReservasConsecutivas(reservas: ReservaCompleta[]): ReservaCompleta[] {
    if (reservas.length === 0) return reservas;

    console.log('🔗 Agrupando reservas consecutivas...');
    
    // Agrupar por usuario + sala + propósito
    const grupos: { [key: string]: ReservaCompleta[] } = {};
    
    reservas.forEach(reserva => {
      const key = `${reserva.usuario_id}-${reserva.sala_nombre}-${reserva.proposito}`;
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(reserva);
    });

    const reservasAgrupadas: ReservaCompleta[] = [];

    Object.values(grupos).forEach(grupoReservas => {
      if (grupoReservas.length === 1) {
        // Solo una reserva, no agrupar
        reservasAgrupadas.push(grupoReservas[0]);
        return;
      }

      // Ordenar por hora de inicio
      grupoReservas.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

      let bloqueActual: ReservaCompleta[] = [grupoReservas[0]];
      
      for (let i = 1; i < grupoReservas.length; i++) {
        const reservaAnterior = bloqueActual[bloqueActual.length - 1];
        const reservaActual = grupoReservas[i];
        
        // Verificar si son consecutivas (hora_fin anterior = hora_inicio actual)
        if (reservaAnterior.hora_fin === reservaActual.hora_inicio) {
          // Son consecutivas, agregar al bloque actual
          bloqueActual.push(reservaActual);
        } else {
          // No son consecutivas, procesar bloque actual y empezar uno nuevo
          if (bloqueActual.length > 1) {
            // Crear reserva agrupada
            const reservaAgrupada = this.crearReservaAgrupada(bloqueActual);
            reservasAgrupadas.push(reservaAgrupada);
          } else {
            // Solo una reserva en el bloque
            reservasAgrupadas.push(bloqueActual[0]);
          }
          
          // Empezar nuevo bloque
          bloqueActual = [reservaActual];
        }
      }
      
      // Procesar último bloque
      if (bloqueActual.length > 1) {
        const reservaAgrupada = this.crearReservaAgrupada(bloqueActual);
        reservasAgrupadas.push(reservaAgrupada);
      } else {
        reservasAgrupadas.push(bloqueActual[0]);
      }
    });

    // Ordenar resultado final por hora de inicio
    reservasAgrupadas.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    
    console.log(`🔗 Agrupación completada: ${reservas.length} → ${reservasAgrupadas.length} reservas`);
    
    return reservasAgrupadas;
  }

  /**
   * Crea una reserva agrupada combinando múltiples reservas consecutivas
   */
  private crearReservaAgrupada(reservas: ReservaCompleta[]): ReservaCompleta {
    const primera = reservas[0];
    const ultima = reservas[reservas.length - 1];
    
    console.log(`🔗 Agrupando ${reservas.length} reservas: ${primera.hora_inicio}-${ultima.hora_fin}`);
    
    return {
      ...primera,
      hora_fin: ultima.hora_fin, // Extender hasta la última hora
      id: `agrupada-${primera.id}`, // ID especial para reservas agrupadas
      proposito: primera.proposito + (reservas.length > 1 ? ` (${reservas.length} horas)` : '')
    };
  }
}