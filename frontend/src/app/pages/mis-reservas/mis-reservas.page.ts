import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, 
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton, IonIcon, IonChip, IonLabel, 
  IonSpinner, IonList, IonItem, IonRefresher, IonRefresherContent, IonAlert, IonAvatar,
  IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonSearchbar,
  IonModal, IonButtons,
  AlertController, ActionSheetController, ToastController 
} from '@ionic/angular/standalone';
import { IonDatetime } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  chevronBackOutline, chevronForwardOutline, calendarOutline, timeOutline, 
  businessOutline, personOutline, documentTextOutline, createOutline, 
  trashOutline, eyeOutline, closeCircle, searchOutline, todayOutline,
  calendarClearOutline 
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
  responsable_nombre?: string;
}

@Component({
  selector: 'app-mis-reservas',
  templateUrl: './mis-reservas.page.html',
  styleUrls: ['./mis-reservas.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, 
    IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton, IonIcon, 
    IonChip, IonLabel, IonSpinner, IonList, IonItem, IonRefresher, 
    IonRefresherContent, IonAlert, IonAvatar, IonSegment, IonSegmentButton, 
    IonSelect, IonSelectOption, IonSearchbar, IonModal, IonButtons, IonDatetime
  ]
})
export class MisReservasPage implements OnInit, ViewWillEnter {
  // Estado de la página
  fechaSeleccionada: Date = new Date();
  reservas: ReservaCompleta[] = [];
  reservasFiltradas: ReservaCompleta[] = [];
  gruposReservas: any[] = [];
  cargando = false;
  totalReservas = 0;
  
  // Filtros
  rangoFechaSeleccionado = 'hoy';
  edificioFiltro = 'todos';
  textoBusqueda = '';
  // Búsqueda por fecha específica
  fechaEspecifica: string = new Date().toISOString();
  mostrarSelectorFecha = false;
  
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
      trashOutline, eyeOutline, closeCircle, searchOutline, todayOutline,
      calendarClearOutline 
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

      // Calcular rango de fechas según filtro
      const { fechaInicio, fechaFin } = this.calcularRangoFechas();
      console.log('🔍 Consultando reservas desde:', fechaInicio, 'hasta:', fechaFin);

      // Para rangos amplios, usar consulta directa en lugar de RPC
      let allData, error;
      
      if (this.rangoFechaSeleccionado === 'hoy') {
        // Solo para "hoy" usar RPC
        const result = await this.supabaseService.getReservasDelDia(fechaInicio);
        allData = result.data;
        error = result.error;
      } else if (this.rangoFechaSeleccionado === 'fecha') {
        // Fecha específica: usar el RPC del día con la fecha elegida
        const result = await this.supabaseService.getReservasDelDia(fechaInicio);
        allData = result.data;
        error = result.error;
      } else {
        // Para rangos amplios, consulta directa
        const result = await this.supabaseService.supabase
          .from('reservas')
          .select(`
            id, fecha, hora_inicio, hora_fin, proposito, estado, usuario_id,
            salas!inner(nombre, edificios!inner(nombre)),
            usuarios!reservas_usuario_id_fkey(nombre_completo, area),
            responsable:usuarios!responsable_id(nombre_completo)
          `)
          .gte('fecha', fechaInicio)
          .lte('fecha', fechaFin)
          .eq('estado', 'confirmada')
          .order('fecha')
          .order('hora_inicio');
          
        // Mapear a estructura RPC
        allData = (result.data || []).map((reserva: any) => ({
          id: reserva.id,
          fecha: reserva.fecha,
          hora_inicio: reserva.hora_inicio,
          hora_fin: reserva.hora_fin,
          proposito: reserva.proposito,
          estado: reserva.estado,
          sala_nombre: reserva.salas?.nombre,
          edificio_nombre: reserva.salas?.edificios?.nombre,
          usuario_nombre: reserva.usuarios?.nombre_completo,
          usuario_area: reserva.usuarios?.area,
          usuario_id: reserva.usuario_id,
          responsable_nombre: reserva.responsable?.nombre_completo
        }));
        error = result.error;
      }
      
      if (error) {
        console.error('❌ Error en RPC:', error);
        throw error;
      }

      console.log('📊 Reservas obtenidas:', allData?.length || 0);
      console.log('🔍 Rango usado:', { fechaInicio, fechaFin, filtro: this.rangoFechaSeleccionado });

      // Filtrar solo MIS reservas para todos los roles
      const misReservas = (allData || []).filter((reserva: any) => reserva.usuario_id === usuario.id);
      
      // Mapear datos usando estructura RPC (igual que reservas-dia)
      this.reservas = misReservas.map((reserva: any) => ({
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

      // Contar horas totales antes de agrupar
      const totalHoras = this.reservas.length;
      
      // Debug: verificar datos del responsable
      console.log('🔍 Debug reservas antes de agrupar:', this.reservas.map(r => ({
        id: r.id,
        sala: r.sala_nombre,
        responsable: r.responsable_nombre,
        proposito: r.proposito
      })));
      
      // Agrupar reservas consecutivas ANTES de contar reservas
      this.reservas = this.agruparReservasConsecutivas(this.reservas);
      this.totalReservas = this.reservas.length;
      
      console.log(`📊 Resumen: ${totalHoras} horas → ${this.totalReservas} reservas agrupadas`);
      
      console.log('✅ Reservas procesadas y agrupadas:', this.reservas.length);
      
      // Aplicar filtros y agrupar
      this.aplicarFiltros();
      
      // Forzar detección de cambios para actualizar el contador
      this.cdr.detectChanges();

    } catch (error) {
      console.error('❌ Error cargando reservas:', error);
      this.mostrarError('Error al cargar las reservas');
      this.reservas = [];
      this.reservasFiltradas = [];
      this.gruposReservas = [];
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
    console.log('🗑️ Iniciando eliminación de chip:', bloque);
    
    // Mostrar alert de confirmación ANTES de eliminar
    const alert = await this.alertController.create({
      header: 'Eliminar bloque',
      message: `¿Estás seguro de eliminar el bloque ${bloque.horario}?`,
      buttons: [
        { 
          text: 'No', 
          role: 'cancel',
          handler: () => {
            console.log('❌ Eliminación cancelada');
          }
        },
        {
          text: 'Sí, eliminar',
          handler: async () => {
            console.log('✅ Confirmando eliminación del bloque');
            await this.procesarEliminacionBloque(bloque);
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  /**
   * Procesa la eliminación del bloque después de confirmar
   */
  private async procesarEliminacionBloque(bloque: any) {
    try {
      console.log('🔄 Eliminando bloque de la BD:', bloque.id);
      
      const { error } = await this.supabaseService.eliminarReserva(bloque.id);
      
      if (error) throw error;
      
      this.mostrarExito(`Bloque ${bloque.horario} eliminado exitosamente`);
      
      // Remover el bloque de la lista local
      this.bloquesParaEditar = this.bloquesParaEditar.filter(b => b.id !== bloque.id);
      
      // Si no quedan bloques, cerrar edición
      if (this.bloquesParaEditar.length === 0) {
        this.cerrarEdicion();
      }
      
      // Recargar reservas para actualizar la vista
      await this.cargarReservas();
      
    } catch (error) {
      console.error('❌ Error eliminando bloque:', error);
      this.mostrarError('Error al eliminar el bloque');
    }
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

  /**
   * Formatea el horario sin segundos y agrega "hrs"
   */
  formatearHorario(horaInicio: string, horaFin: string): string {
    const inicio = horaInicio.substring(0, 5); // Quitar :00
    const fin = horaFin.substring(0, 5); // Quitar :00
    return `${inicio} - ${fin} hrs`;
  }
  
  formatearFecha(fecha: string): string {
    return format(new Date(fecha), "d 'de' MMM", { locale: es });
  }
  
  aplicarFiltroFecha() {
    // Si el usuario elige "Fecha", abrir el selector; si no, recargar directo
    if (this.rangoFechaSeleccionado === 'fecha') {
      this.mostrarSelectorFecha = true;
      return;
    }
    this.cargarReservas();
  }

  /** Confirma la fecha específica elegida y recarga */
  confirmarFechaEspecifica() {
    this.mostrarSelectorFecha = false;
    this.cargarReservas();
  }

  /** Etiqueta legible de la fecha específica para mostrar en el botón */
  get fechaEspecificaLabel(): string {
    return format(new Date(this.fechaEspecifica), "d 'de' MMM yyyy", { locale: es });
  }
  
  aplicarFiltros() {
    // Ya no necesitamos filtrar por fecha aquí porque se carga desde BD
    let reservasFiltradas = [...this.reservas];
    
    // Filtro por edificio
    if (this.edificioFiltro !== 'todos') {
      const nombreEdificio = this.edificioFiltro === '1' ? 'Blanco' : 'Cochrane';
      reservasFiltradas = reservasFiltradas.filter(r => 
        r.edificio_nombre === nombreEdificio
      );
    }
    
    // Filtro por texto de búsqueda
    if (this.textoBusqueda.trim()) {
      const texto = this.textoBusqueda.toLowerCase();
      reservasFiltradas = reservasFiltradas.filter(r => 
        r.proposito?.toLowerCase().includes(texto) ||
        r.responsable_nombre?.toLowerCase().includes(texto) ||
        r.sala_nombre.toLowerCase().includes(texto)
      );
    }
    
    this.reservasFiltradas = reservasFiltradas;
    this.agruparReservas();
  }
  
  private agruparReservas() {
    const grupos: any[] = [];
    const hoy = new Date();
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);
    
    // Agrupar por fecha
    const reservasPorFecha = new Map<string, ReservaCompleta[]>();
    
    this.reservasFiltradas.forEach(reserva => {
      // Asegurar que la fecha sea string en formato YYYY-MM-DD
      const fecha = typeof reserva.fecha === 'string' ? reserva.fecha : format(new Date(reserva.fecha), 'yyyy-MM-dd');
      if (!reservasPorFecha.has(fecha)) {
        reservasPorFecha.set(fecha, []);
      }
      reservasPorFecha.get(fecha)!.push(reserva);
    });
    
    // Crear grupos ordenados
    const fechasOrdenadas = Array.from(reservasPorFecha.keys()).sort();
    
    fechasOrdenadas.forEach(fecha => {
      const reservasFecha = reservasPorFecha.get(fecha)!;
      // Crear fecha correctamente desde string YYYY-MM-DD
      const fechaObj = new Date(fecha + 'T00:00:00');
      
      let titulo = '';
      let icono = 'calendar-outline';
      
      const fechaReservaStr = format(fechaObj, 'yyyy-MM-dd');
      const fechaHoyStr = format(hoy, 'yyyy-MM-dd');
      const fechaMañanaStr = format(mañana, 'yyyy-MM-dd');
      
      console.log('Debug fechas:', {
        fechaReserva: fechaReservaStr,
        fechaHoy: fechaHoyStr,
        fechaMañana: fechaMañanaStr,
        esHoy: fechaReservaStr === fechaHoyStr
      });
      
      if (fechaReservaStr === fechaHoyStr) {
        titulo = 'HOY';
        icono = 'today-outline';
      } else if (fechaReservaStr === fechaMañanaStr) {
        titulo = 'MAÑANA';
        icono = 'calendar-clear-outline';
      } else {
        titulo = format(fechaObj, "EEEE d 'de' MMMM", { locale: es }).toUpperCase();
      }
      
      // Agrupar por edificio
      const edificios = [
        { nombre: 'Edificio Blanco', reservas: [] as ReservaCompleta[] },
        { nombre: 'Edificio Cochrane', reservas: [] as ReservaCompleta[] }
      ];
      
      reservasFecha.forEach(reserva => {
        if (reserva.edificio_nombre === 'Blanco') {
          edificios[0].reservas.push(reserva);
        } else if (reserva.edificio_nombre === 'Cochrane') {
          edificios[1].reservas.push(reserva);
        }
      });
      
      grupos.push({
        titulo,
        icono,
        total: reservasFecha.length,
        edificios
      });
    });
    
    this.gruposReservas = grupos;
  }
  
  private calcularRangoFechas(): { fechaInicio: string, fechaFin: string } {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    switch (this.rangoFechaSeleccionado) {
      case 'fecha':
        // Búsqueda por una fecha específica elegida por el usuario
        const fechaElegida = format(new Date(this.fechaEspecifica), 'yyyy-MM-dd');
        return { fechaInicio: fechaElegida, fechaFin: fechaElegida };

      case 'hoy':
        const fechaHoy = format(hoy, 'yyyy-MM-dd');
        return { fechaInicio: fechaHoy, fechaFin: fechaHoy };
        
      case 'todos':
      default:
        // Últimos 6 meses hasta próximos 6 meses para mayor rango
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1);
        const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 6, 0);
        
        console.log('Debug todos:', {
          inicio: format(inicio, 'yyyy-MM-dd'),
          fin: format(fin, 'yyyy-MM-dd')
        });
        
        return {
          fechaInicio: format(inicio, 'yyyy-MM-dd'),
          fechaFin: format(fin, 'yyyy-MM-dd')
        };
    }
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
    
    // Agrupar por usuario + sala + propósito + responsable
    const grupos: { [key: string]: ReservaCompleta[] } = {};
    
    reservas.forEach(reserva => {
      const key = `${reserva.usuario_id}-${reserva.sala_nombre}-${reserva.proposito}-${reserva.responsable_nombre || 'sin-responsable'}`;
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