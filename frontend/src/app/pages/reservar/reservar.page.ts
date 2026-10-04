import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonButtons, IonItem, IonLabel, IonTextarea, IonSegment, IonSegmentButton, IonIcon, IonModal, IonDatetime, IonSpinner, IonFab, IonFabButton, IonGrid, IonRow, IonCol, IonAlert, AlertController, ToastController } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ResponsableSearchComponent } from '../../components/responsable-search/responsable-search.component';

@Component({
  selector: 'app-reservar',
  templateUrl: './reservar.page.html',
  styleUrls: ['./reservar.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonButtons, IonItem, IonLabel, IonTextarea, IonSegment, IonSegmentButton, IonIcon, IonModal, IonDatetime, IonSpinner, IonFab, IonFabButton, IonGrid, IonRow, IonCol, IonAlert, ResponsableSearchComponent]
})
export class ReservarPage implements OnInit, ViewWillEnter {
  @ViewChild(ResponsableSearchComponent) responsableSearch!: ResponsableSearchComponent;
  
  fechaSeleccionada: string = new Date().toISOString();
  fechaMinima = new Date().toISOString();
  
  // Debug del calendario
  abrirCalendario() {
    console.log('=== ABRIENDO CALENDARIO ===');
    console.log('Fecha actual antes de abrir:', this.fechaSeleccionada);
    console.log('Fecha mínima:', this.fechaMinima);
    
    // Forzar detección de cambios y usar setTimeout
    setTimeout(() => {
      this.mostrarCalendario = true;
      this.cdr.detectChanges();
      console.log('Modal abierto con timeout:', this.mostrarCalendario);
    }, 100);
  }
  
  cerrarCalendario() {
    console.log('=== CERRANDO CALENDARIO ===');
    console.log('Fecha al cerrar:', this.fechaSeleccionada);
    this.mostrarCalendario = false;
    this.cdr.detectChanges();
    console.log('Modal cerrado:', this.mostrarCalendario);
  }
  edificioSeleccionado = 1; // ID del edificio
  salaSeleccionada: number | null = null;
  horariosSeleccionados: string[] = [];
  proposito = '';
  responsableSeleccionado: any = null;
  mostrarCalendario = false;
  cargando = false;
  
  // Tooltip y modal para información de reservas
  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;
  tooltipData: any = null;
  mostrarModalReserva = false;
  modalData: any = null;
  esMobile = false;

  // Datos de la base de datos
  edificios: any[] = [];
  todasLasSalas: any[] = [];
  salas: any[] = [];

  // Horarios hasta las 19:00
  horarios = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
    '16:00-17:00', '17:00-18:00', '18:00-19:00'
  ];

  // Motivos sugeridos (chips) basados en el histórico real de uso
  motivosSugeridos = [
    'PMG',
    'Reunión Equipo Directivo',
    'Comisión Evaluadora',
    'Reunión de equipo',
    'Acopio de material'
  ];

  /** Formato compacto del horario para el encabezado: "08:00-09:00" -> "08-09". */
  horarioCorto(horario: string): string {
    const [inicio, fin] = horario.split('-');
    const h1 = inicio?.split(':')[0] ?? '';
    const h2 = fin?.split(':')[0] ?? '';
    return `${h1}-${h2}`;
  }

  /** Aplica un motivo sugerido al campo. Si ya estaba puesto, lo limpia (toggle). */
  seleccionarMotivo(motivo: string) {
    this.proposito = this.proposito.trim() === motivo ? '' : motivo;
    this.onPropositoChange();
  }

  /** Indica si un chip de motivo está activo (para resaltarlo). */
  esMotivoActivo(motivo: string): boolean {
    return this.proposito.trim() === motivo;
  }

  constructor(
    private supabaseService: SupabaseService,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    console.log('=== INICIANDO CARGA ===');
    console.log('Fecha inicial:', this.fechaSeleccionada);
    console.log('Fecha mínima:', this.fechaMinima);
    console.log('Usuario al iniciar:', this.supabaseService.user);
    
    // Detectar si es móvil (mejorado)
    this.detectarDispositivo();
    window.addEventListener('resize', () => this.detectarDispositivo());
    
    this.cargando = true;
    
    try {
      await this.cargarEdificios();
      await this.cargarSalas();
      await this.cargarDisponibilidad();
      console.log('=== CARGA COMPLETADA ===');
    } catch (error) {
      console.error('Error en ngOnInit:', error);
    } finally {
      this.cargando = false;
      console.log('Cargando = false');
    }
  }

  async ionViewWillEnter() {
    console.log('🔄 Entrando a vista Reservar - Refrescando disponibilidad');
    // Recargar disponibilidad cada vez que se entra a la página
    await this.cargarDisponibilidad();
  }



  async cargarDisponibilidad() {
    console.log('=== CARGANDO DISPONIBILIDAD ===');
    
    try {
      const { data, error } = await this.supabaseService.getReservasPorFechaYSala(this.fechaParaConsulta);
      if (error) throw error;
      
      this.reservasDelDia = data || [];
      console.log('Reservas del día:', this.reservasDelDia);
      this.calcularDisponibilidad();
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
      // Usar disponibilidad vacía si falla
      this.reservasDelDia = [];
      this.calcularDisponibilidad();
      this.cdr.detectChanges();
    }
    
    console.log('Disponibilidad cargada');
  }

  calcularDisponibilidad() {
    console.log('=== CALCULANDO DISPONIBILIDAD ===');
    console.log('Usuario actual:', this.supabaseService.user?.id);
    console.log('Reservas del día para calcular:', this.reservasDelDia);
    
    this.disponibilidad = {};
    
    // Para cada sala, calcular disponibilidad por horario
    this.todasLasSalas.forEach(sala => {
      const key = `${sala.edificio_id}-${sala.id}`;
      this.disponibilidad[key] = [];
      
      this.horarios.forEach((horario, index) => {
        const [horaInicio, horaFin] = horario.split('-');
        
        // Buscar si hay reserva CONFIRMADA en este horario (agregar :00 para coincidir con formato de BD)
        const reserva = this.reservasDelDia.find(r => 
          r.sala_id === sala.id && 
          r.hora_inicio === horaInicio + ':00' && 
          r.hora_fin === horaFin + ':00' &&
          r.estado === 'confirmada'
        );
        
        console.log(`Sala ${sala.id}, horario ${horario}: reserva encontrada:`, reserva);
        
        if (reserva) {
          // Si es mi reserva
          if (reserva.usuario_id === this.supabaseService.user?.id) {
            this.disponibilidad[key][index] = 'mi-reserva';
            console.log(`Marcando como mi-reserva: sala ${sala.id}, horario ${horario}`);
          } else {
            this.disponibilidad[key][index] = 'ocupado';
            console.log(`Marcando como ocupado: sala ${sala.id}, horario ${horario}`);
          }
        } else {
          this.disponibilidad[key][index] = 'disponible';
        }
      });
    });
    
    console.log('Disponibilidad calculada:', this.disponibilidad);
  }

  async cargarEdificios() {
    console.log('=== CARGANDO EDIFICIOS ===');
    
    // Usar datos de respaldo directamente
    this.edificios = [
      { id: 1, nombre: 'Blanco' },
      { id: 2, nombre: 'Cochrane' }
    ];
    this.edificioSeleccionado = 1;
    console.log('Edificios cargados:', this.edificios);
    console.log('Edificio seleccionado:', this.edificioSeleccionado);
  }

  async cargarSalas() {
    console.log('=== CARGANDO SALAS ===');
    
    try {
      console.log('Llamando a getSalas()...');
      const { data, error } = await this.supabaseService.getSalas();
      
      console.log('Respuesta getSalas - data:', data);
      console.log('Respuesta getSalas - error:', error);
      
      if (error) {
        console.error('Error cargando salas:', error);
        // Usar datos de respaldo si falla
        this.todasLasSalas = [
          { id: 1, nombre: 'Principal', edificio_id: 1, capacidad: 20 },
          { id: 2, nombre: 'Bandurrias', edificio_id: 1 },
          { id: 3, nombre: 'San Antonio', edificio_id: 1, capacidad: 12 },
          { id: 4, nombre: 'Principal', edificio_id: 2, capacidad: 25 },
          { id: 5, nombre: 'Secundaria', edificio_id: 2, capacidad: 10 }
        ];
        console.log('Usando datos de respaldo por error');
      } else {
        console.log('Datos recibidos de la BD:', data);
        // Mapear datos de la BD al formato esperado
        this.todasLasSalas = (data || []).map(sala => ({
          id: sala.id,
          nombre: sala.nombre,
          edificio_id: sala.edificio_id,
          capacidad: sala.capacidad
        }));
        console.log('Salas mapeadas:', this.todasLasSalas);
      }
      
      console.log('Todas las salas:', this.todasLasSalas);
      this.filtrarSalasPorEdificio();
      
    } catch (error) {
      console.error('Error en cargarSalas:', error);
      // Usar datos de respaldo
      this.todasLasSalas = [
        { id: 1, nombre: 'Principal', edificio_id: 1, capacidad: 20 },
        { id: 2, nombre: 'Bandurrias', edificio_id: 1 },
        { id: 3, nombre: 'San Antonio', edificio_id: 1, capacidad: 12 },
        { id: 4, nombre: 'Principal', edificio_id: 2, capacidad: 25 },
        { id: 5, nombre: 'Secundaria', edificio_id: 2, capacidad: 10 }
      ];
      console.log('Usando datos de respaldo por catch:', this.todasLasSalas);
      this.filtrarSalasPorEdificio();
    }
  }

  filtrarSalasPorEdificio() {
    console.log('Filtrando por edificio:', this.edificioSeleccionado);
    this.salas = this.todasLasSalas.filter(sala => sala.edificio_id === this.edificioSeleccionado);
    console.log('Salas filtradas:', this.salas);
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
  }

  // Disponibilidad real desde la base de datos
  reservasDelDia: any[] = [];
  disponibilidad: any = {};
  
  // Alert de cancelación
  public cancelAlertButtons = [
    {
      text: 'No',
      cssClass: 'alert-button-cancel',
      role: 'cancel'
    },
    {
      text: 'Sí, cancelar',
      cssClass: 'alert-button-confirm',
      handler: () => {
        if (this.reservaACancelar) {
          this.cancelarReserva(
            this.reservaACancelar.horaInicio, 
            this.reservaACancelar.horaFin, 
            this.reservaACancelar.salaId
          ).then(() => {
            // Solo recargar datos después de cancelar
            setTimeout(() => {
              this.recargarDatosSutil();
            }, 800);
          });
        }
      }
    }
  ];
  reservaACancelar: any = null;

  // Alert de confirmación
  public confirmAlertButtons = [
    {
      text: 'Cancelar',
      cssClass: 'alert-button-cancel',
      role: 'cancel'
    },
    {
      text: 'Confirmar',
      cssClass: 'alert-button-confirm',
      handler: () => {
        this.procesarReserva();
      }
    }
  ];

  get salasDelEdificio() {
    return this.salas;
  }

  get edificioNombre() {
    const edificio = this.edificios.find(e => e.id === this.edificioSeleccionado);
    return edificio ? `Edificio ${edificio.nombre}` : '';
  }

  get horariosTexto() {
    return this.horariosSeleccionados.join(', ');
  }

  get puedeConfirmar(): boolean {
    const resultado = this.proposito.trim().length === 0 || !this.responsableSeleccionado;
    console.log('=== PUEDE CONFIRMAR ===');
    console.log('Propósito actual:', `"${this.proposito}"`);
    console.log('Responsable seleccionado:', this.responsableSeleccionado);
    console.log('puedeConfirmar (botón deshabilitado?):', resultado);
    console.log('=== FIN PUEDE CONFIRMAR ===');
    return resultado;
  }

  get fechaFormateada(): string {
    const fecha = new Date(this.fechaSeleccionada);
    return fecha.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  get fechaParaConsulta(): string {
    const fecha = new Date(this.fechaSeleccionada);
    // Usar la fecha local para evitar problemas de zona horaria
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }



  async onFechaChange() {
    console.log('=== FECHA CAMBIADA ===');
    console.log('Fecha anterior:', this.fechaSeleccionada);
    console.log('Nuevo valor recibido:', arguments);
    console.log('Fecha después del cambio:', this.fechaSeleccionada);
    console.log('Tipo de fecha:', typeof this.fechaSeleccionada);
    console.log('Fecha válida?', !isNaN(new Date(this.fechaSeleccionada).getTime()));
    
    this.mostrarCalendario = false;
    console.log('Modal cerrado');
    
    this.limpiarSeleccion();
    console.log('Selección limpiada');
    
    await this.cargarDisponibilidad();
    console.log('=== FIN CAMBIO FECHA ===');
  }

  async onFechaSeleccionada(event: any) {
    console.log('=== FECHA CAMBIADA EN CALENDARIO ===');
    console.log('Nueva fecha seleccionada:', event.detail?.value);
    // Solo actualizar la variable, no cerrar el modal
  }

  async aceptarFecha() {
    console.log('=== ACEPTANDO FECHA ===');
    console.log('Fecha a aceptar:', this.fechaSeleccionada);
    
    this.cerrarCalendario();
    this.limpiarSeleccion();
    await this.cargarDisponibilidad();
    
    console.log('Fecha aceptada y modal cerrado');
  }

  async cambiarFecha(dias: number) {
    console.log('=== CAMBIAR FECHA CON FLECHAS ===');
    console.log('Días a cambiar:', dias);
    console.log('Fecha actual:', this.fechaSeleccionada);
    
    const fechaActual = new Date(this.fechaSeleccionada);
    console.log('Fecha parseada:', fechaActual);
    console.log('Fecha válida?', !isNaN(fechaActual.getTime()));
    
    fechaActual.setDate(fechaActual.getDate() + dias);
    console.log('Nueva fecha calculada:', fechaActual);
    
    // No permitir fechas pasadas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    console.log('Fecha de hoy:', hoy);
    console.log('Nueva fecha >= hoy?', fechaActual >= hoy);
    
    if (fechaActual >= hoy) {
      const nuevaFechaISO = fechaActual.toISOString();
      console.log('Nueva fecha ISO:', nuevaFechaISO);
      
      this.fechaSeleccionada = nuevaFechaISO;
      console.log('Fecha asignada:', this.fechaSeleccionada);
      
      this.limpiarSeleccion();
      await this.cargarDisponibilidad();
    } else {
      console.log('Fecha no permitida (es pasada)');
    }
    
    console.log('=== FIN CAMBIAR FECHA ===');
  }

  onEdificioChange() {
    console.log('Cambio de edificio a:', this.edificioSeleccionado);
    this.filtrarSalasPorEdificio();
    this.limpiarSeleccion();
    this.cdr.detectChanges();
  }

  private limpiarSeleccion() {
    this.salaSeleccionada = null;
    this.horariosSeleccionados = [];
  }

  onResponsableSelected(usuario: any) {
    console.log('=== EVENTO RESPONSABLE RECIBIDO ===');
    console.log('Usuario recibido:', usuario);
    this.responsableSeleccionado = usuario;
    console.log('responsableSeleccionado asignado:', this.responsableSeleccionado);
    this.cdr.detectChanges();
  }

  getEstadoHorario(salaId: number, index: number): string {
    const key = `${this.edificioSeleccionado}-${salaId}`;
    const estado = this.disponibilidad[key]?.[index] || 'disponible';
    
    // Debug para el problema específico
    if (salaId === 1 && this.horarios[index] === '09:00-10:00') {
      console.log(`DEBUG - Sala Principal (ID: 1), horario 09:00-10:00:`);
      console.log(`- Key: ${key}`);
      console.log(`- Estado calculado: ${estado}`);
      console.log(`- Disponibilidad completa para esta sala:`, this.disponibilidad[key]);
      console.log(`- Usuario actual:`, this.supabaseService.user?.id);
      console.log(`- Reservas del día:`, this.reservasDelDia.filter(r => r.sala_id === 1));
    }
    
    return estado;
  }

  toggleHorario(horario: string, salaId: number, index: number) {
    console.log('=== TOGGLE HORARIO ===');
    console.log('Horario clickeado:', horario);
    console.log('Sala ID:', salaId);
    console.log('Index:', index);
    console.log('Estado actual - salaSeleccionada:', this.salaSeleccionada);
    console.log('Estado actual - horariosSeleccionados:', this.horariosSeleccionados);
    
    const estado = this.getEstadoHorario(salaId, index);
    console.log('Estado del horario:', estado);
    
    // Si es ocupado por otro
    if (estado === 'ocupado') {
      if (this.esMobile) {
        console.log('📱 Móvil: Mostrando modal para reserva ocupada');
        this.mostrarInfoReserva(salaId, index);
      }
      return;
    }
    
    // Si es mi reserva
    if (estado === 'mi-reserva') {
      console.log('🟡 Es mi reserva');
      if (this.esMobile) {
        console.log('📱 Móvil: Mostrando modal para mi reserva');
        this.mostrarInfoReserva(salaId, index);
      } else {
        console.log('🖥️ Desktop: Mostrando opciones de cancelación');
        this.mostrarOpcionesCancelacion(horario, salaId);
      }
      return;
    }

    // Si es disponible, permitir selección
    console.log('✅ Horario disponible, procesando selección...');
    
    // Si cambia de sala, limpiar selección anterior
    if (this.salaSeleccionada !== null && this.salaSeleccionada !== salaId) {
      console.log('🔄 Cambiando de sala, limpiando selección anterior');
      console.log('Sala anterior:', this.salaSeleccionada, '-> Nueva sala:', salaId);
      this.horariosSeleccionados = [];
    }
    
    // Establecer sala seleccionada
    console.log('🏢 Estableciendo sala seleccionada:', salaId);
    this.salaSeleccionada = salaId;
    
    // Toggle del horario: agregar o quitar de la lista
    if (this.horariosSeleccionados.includes(horario)) {
      console.log('➖ Quitando horario de la selección:', horario);
      // Quitar horario si ya está seleccionado
      this.horariosSeleccionados = this.horariosSeleccionados.filter(h => h !== horario);
      
      // Si no quedan horarios seleccionados, limpiar sala
      if (this.horariosSeleccionados.length === 0) {
        console.log('🧹 No quedan horarios, limpiando sala seleccionada');
        this.salaSeleccionada = null;
      }
    } else {
      console.log('➕ Agregando horario a la selección:', horario);
      // Agregar horario a la selección
      this.horariosSeleccionados.push(horario);
      // Ordenar horarios seleccionados
      this.horariosSeleccionados.sort();
    }
    
    console.log('Estado final - salaSeleccionada:', this.salaSeleccionada);
    console.log('Estado final - horariosSeleccionados:', this.horariosSeleccionados);
    
    // Forzar actualización de la UI
    console.log('🔄 Forzando detección de cambios...');
    this.cdr.detectChanges();
    
    console.log('=== FIN TOGGLE HORARIO ===');
  }

  isHorarioSeleccionado(horario: string): boolean {
    return this.horariosSeleccionados.includes(horario);
  }

  getSalaNombre(salaId: number): string {
    const sala = this.salas.find((s: any) => s.id === salaId);
    return sala ? sala.nombre : '';
  }

  onPropositoChange() {
    console.log('📝 Propósito cambiado:', this.proposito);
    this.cdr.detectChanges();
  }

  confirmarReserva() {
    if (!this.salaSeleccionada || this.horariosSeleccionados.length === 0 || !this.proposito.trim() || !this.responsableSeleccionado) {
      const alertElement = document.getElementById('error-alert');
      if (alertElement) {
        (alertElement as any).present();
      }
      return;
    }

    if (!this.supabaseService.user) {
      return;
    }

    // Mostrar alert de confirmación
    const alertElement = document.getElementById('confirm-alert');
    if (alertElement) {
      (alertElement as any).present();
    }
  }

  async procesarReserva() {
    console.log('=== PROCESANDO RESERVA ===');
    this.cargando = true;

    try {
      const reservasCreadas = [];
      const errores = [];
      
      for (const horario of this.horariosSeleccionados) {
        const [horaInicio, horaFin] = horario.split('-');
        
        const reservaData = {
          fecha: this.fechaParaConsulta,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          sala_id: this.salaSeleccionada,
          usuario_id: this.supabaseService.user!.id,
          proposito: this.proposito,
          responsable_id: this.responsableSeleccionado?.id
        };
        
        console.log('📅 Datos de reserva a enviar:', {
          fechaSeleccionada: this.fechaSeleccionada,
          fechaParaConsulta: this.fechaParaConsulta,
          reservaData
        });
        
        const { data, error } = await this.supabaseService.crearReserva(reservaData);
        
        if (error) {
          errores.push(`${horario}: ${error.message}`);
        } else {
          reservasCreadas.push(horario);
        }
      }
      
      // Mostrar resultado
      if (reservasCreadas.length > 0) {
        this.reservasExitosas = reservasCreadas.length;
        this.salaReservada = this.getSalaNombre(this.salaSeleccionada!);
        
        const alertElement = document.getElementById('success-alert');
        if (alertElement) {
          (alertElement as any).present();
        }
      }
      
      // Limpiar formulario completamente (sin tocar reservasExitosas y salaReservada)
      this.horariosSeleccionados = [];
      this.salaSeleccionada = null;
      this.proposito = '';
      this.responsableSeleccionado = null;
      
      // Limpiar componente de búsqueda
      if (this.responsableSearch) {
        this.responsableSearch.clearSelection();
      }
      
      // Forzar limpieza del estado
      this.reservasDelDia = [];
      this.disponibilidad = {};
      
      // Recargar todo desde cero
      await this.cargarSalas();
      await this.cargarDisponibilidad();
      
      // Forzar re-filtrado de salas
      this.filtrarSalasPorEdificio();
      
      // Múltiples detecciones de cambios
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 300);
      
      // Asegurar que el loading esté en false antes del refresh
      this.cargando = false;
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      this.cargando = false;
    }
  }



  // Función para refrescar manualmente (debug)
  async refrescarDisponibilidad() {
    console.log('=== REFRESCANDO DISPONIBILIDAD MANUALMENTE ===');
    this.cargando = true;
    
    try {
      // Limpiar datos actuales
      this.reservasDelDia = [];
      this.disponibilidad = {};
      
      // Recargar todo
      await this.cargarDisponibilidad();
      
      console.log('Disponibilidad refrescada manualmente');
      this.mostrarExito('Disponibilidad actualizada');
    } catch (error) {
      console.error('Error refrescando:', error);
      this.mostrarError('Error al refrescar');
    } finally {
      this.cargando = false;
    }
  }

  mostrarOpcionesCancelacion(horario: string, salaId: number) {
    const [horaInicio, horaFin] = horario.split('-');
    
    // Preparar datos para el alert
    this.reservaACancelar = { horaInicio, horaFin, salaId };
    
    // Abrir el alert usando el trigger
    const alertElement = document.getElementById('cancel-alert');
    if (alertElement) {
      (alertElement as any).present();
    }
  }
  
  get cancelAlertMessage(): string {
    if (!this.reservaACancelar) return '';
    
    const horario = `${this.reservaACancelar.horaInicio}-${this.reservaACancelar.horaFin}`;
    const salaNombre = this.getSalaNombre(this.reservaACancelar.salaId);
    
    return `Sala: ${salaNombre} - Horario: ${horario} - Fecha: ${this.fechaFormateada}`;
  }

  get confirmAlertMessage(): string {
    if (!this.salaSeleccionada) return '';
    
    const salaNombre = this.getSalaNombre(this.salaSeleccionada);
    const horarios = this.horariosSeleccionados.join(', ');
    
    return `Sala: ${salaNombre} - Horarios: ${horarios} - Fecha: ${this.fechaFormateada}`;
  }

  reservasExitosas = 0;
  salaReservada = '';

  get successAlertMessage(): string {
    const horas = this.reservasExitosas === 1 ? 'hora' : 'horas';
    return `Reserva confirmada de ${this.reservasExitosas} ${horas} para ${this.salaReservada} el ${this.fechaFormateada}`;
  }

  get successAlertButtons() {
    return [{
      text: 'Aceptar', 
      role: 'cancel',
      handler: () => {
        // Solo recargar datos, no refresh completo
        this.recargarDatosSutil();
      }
    }];
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

  async cancelarReserva(horaInicio: string, horaFin: string, salaId: number): Promise<void> {
    console.log('=== CANCELANDO RESERVA ===');
    console.log('Buscando reserva con:');
    console.log('- sala_id:', salaId);
    console.log('- hora_inicio:', horaInicio + ':00');
    console.log('- hora_fin:', horaFin + ':00');
    console.log('- usuario_id:', this.supabaseService.user?.id);
    console.log('Reservas del día disponibles:', this.reservasDelDia);
    
    try {
      this.cargando = true;
      
      // Buscar la reserva a cancelar
      const reserva = this.reservasDelDia.find(r => 
        r.sala_id === salaId && 
        r.hora_inicio === horaInicio + ':00' && 
        r.hora_fin === horaFin + ':00' &&
        r.usuario_id === this.supabaseService.user?.id
      );
      
      console.log('Reserva encontrada:', reserva);
      
      if (!reserva) {
        this.mostrarError('No se encontró la reserva a cancelar');
        return;
      }
      
      console.log('Cancelando reserva ID:', reserva.id);
      
      // Eliminar la reserva de la base de datos
      const { data, error } = await this.supabaseService.eliminarReserva(reserva.id);
      
      console.log('Resultado del delete - data:', data);
      console.log('Resultado del delete - error:', error);
      
      if (error) {
        console.error('Error cancelando reserva:', error);
        this.mostrarError(`Error al cancelar la reserva: ${error.message}`);
        return;
      }
      
      console.log('Reserva cancelada exitosamente');
      this.mostrarExito('Reserva cancelada exitosamente');
      
      // Esperar un momento antes de recargar para evitar problemas de cache
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Limpiar cache y recargar
      this.reservasDelDia = [];
      this.disponibilidad = {};
      
      // Recargar disponibilidad
      await this.cargarDisponibilidad();
      
      // Forzar múltiples actualizaciones visuales
      this.cdr.detectChanges();
      setTimeout(() => {
        this.cdr.detectChanges();
        console.log('Primera detección de cambios forzada');
      }, 100);
      setTimeout(() => {
        this.cdr.detectChanges();
        console.log('Segunda detección de cambios forzada');
      }, 300);
      
    } catch (error) {
      console.error('Error:', error);
      this.mostrarError('Error inesperado al cancelar la reserva');
    } finally {
      this.cargando = false;
    }
  }

  private detectarDispositivo() {
    this.esMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    console.log('Dispositivo detectado como móvil:', this.esMobile);
  }

  mostrarTooltip(event: MouseEvent, salaId: number, index: number) {
    const estado = this.getEstadoHorario(salaId, index);
    
    // Mostrar tooltip si está ocupado o es mi reserva, y no es móvil
    if ((estado === 'ocupado' || estado === 'mi-reserva') && !this.esMobile) {
      const reservaInfo = this.getReservaInfo(salaId, index);
      if (reservaInfo) {
        const target = event.target as HTMLElement;
        
        this.tooltipData = reservaInfo;
        this.tooltipX = target.offsetLeft + (target.offsetWidth / 2);
        this.tooltipY = target.offsetTop + (target.offsetHeight / 2);
        this.tooltipVisible = true;
        
        console.log('Tooltip posición:', {
          x: this.tooltipX,
          y: this.tooltipY,
          offsetLeft: target.offsetLeft,
          offsetTop: target.offsetTop,
          width: target.offsetWidth,
          height: target.offsetHeight
        });
      }
    }
  }

  ocultarTooltip() {
    this.tooltipVisible = false;
    this.tooltipData = null;
    this.tooltipX = 0;
    this.tooltipY = 0;
  }

  mostrarInfoReserva(salaId: number, index: number) {
    const reservaInfo = this.getReservaInfo(salaId, index);
    if (reservaInfo) {
      const horario = this.horarios[index];
      const salaNombre = this.getSalaNombre(salaId);
      
      this.modalData = {
        ...reservaInfo,
        fecha: this.fechaFormateada,
        horario: horario,
        sala: salaNombre
      };
      this.mostrarModalReserva = true;
    }
  }

  cerrarModalReserva() {
    this.mostrarModalReserva = false;
    this.modalData = null;
  }

  private getReservaInfo(salaId: number, index: number) {
    const horario = this.horarios[index];
    const [horaInicio, horaFin] = horario.split('-');
    
    const reserva = this.reservasDelDia.find(r => 
      r.sala_id === salaId && 
      r.hora_inicio === horaInicio + ':00' && 
      r.hora_fin === horaFin + ':00' &&
      r.estado === 'confirmada'
    );
    
    console.log('Reserva encontrada para tooltip:', reserva);
    
    if (reserva) {
      return {
        responsable: reserva.responsable?.nombre_completo || 'No especificado',
        motivo: reserva.proposito || 'Sin motivo especificado'
      };
    }
    
    return null;
  }

  /**
   * Devuelve las iniciales del responsable de una reserva, para mostrar
   * en el reverso del bloque cuando hace flip (ej. "Lionel Claro" -> "LC").
   */
  getInicialesReserva(salaId: number, index: number): string {
    const info = this.getReservaInfo(salaId, index);
    if (!info || !info.responsable || info.responsable === 'No especificado') {
      return '•';
    }
    const partes = info.responsable.trim().split(/\s+/);
    // Inicial del primer NOMBRE y del primer APELLIDO (consistente con getNombreCortoReserva).
    // Ej: "Lionel Nolberto Claro López" -> primer nombre "Lionel" (L) + primer apellido "Claro" (C) = "LC".
    const inicialNombre = partes[0]?.charAt(0) || '';
    let inicialApellido = '';
    if (partes.length === 2) {
      inicialApellido = partes[1].charAt(0); // nombre + apellido
    } else if (partes.length > 2) {
      inicialApellido = partes[partes.length - 2].charAt(0); // penúltima = primer apellido
    }
    return (inicialNombre + inicialApellido).toUpperCase();
  }

  /**
   * Nombre corto del responsable: primer nombre + primer apellido.
   * Ej: "Pilar Andrea Torres Rojas" -> "Pilar Torres".
   */
  getNombreCortoReserva(salaId: number, index: number): string {
    const info = this.getReservaInfo(salaId, index);
    if (!info || !info.responsable || info.responsable === 'No especificado') {
      return 'Reserva';
    }
    const partes = info.responsable.trim().split(/\s+/);
    if (partes.length <= 2) return info.responsable;
    // Asume formato: nombre(s) + apellido(s). Toma primer nombre y primer apellido.
    const nombre = partes[0];
    const apellido = partes[partes.length - 2]; // penúltima suele ser primer apellido
    return `${nombre} ${apellido}`;
  }

  /**
   * Motivo truncado para el flip (evita textos largos que desbordan).
   */
  getMotivoCortoReserva(salaId: number, index: number, max = 28): string {
    const info = this.getReservaInfo(salaId, index);
    if (!info || !info.motivo) return '';
    const motivo = info.motivo.trim();
    return motivo.length > max ? motivo.slice(0, max).trimEnd() + '…' : motivo;
  }

  /**
   * Recarga solo los datos sin refresh completo de página
   */
  private async recargarDatosSutil() {
    console.log('🔄 Recargando datos sutilmente...');
    
    try {
      // Mostrar loading brevemente
      this.cargando = true;
      
      // Limpiar datos actuales
      this.reservasDelDia = [];
      this.disponibilidad = {};
      
      // Recargar salas y disponibilidad
      await this.cargarSalas();
      await this.cargarDisponibilidad();
      
      // Forzar re-filtrado
      this.filtrarSalasPorEdificio();
      
      // Múltiples detecciones de cambios
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
      
      console.log('✅ Datos recargados exitosamente');
      
    } catch (error) {
      console.error('❌ Error recargando datos:', error);
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }
}