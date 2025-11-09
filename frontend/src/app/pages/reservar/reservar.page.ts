import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonButtons, IonItem, IonLabel, IonTextarea, IonSegment, IonSegmentButton, IonIcon, IonModal, IonDatetime, IonSpinner, IonFab, IonFabButton, IonGrid, IonRow, IonCol, IonAlert, AlertController } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reservar',
  templateUrl: './reservar.page.html',
  styleUrls: ['./reservar.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonButtons, IonItem, IonLabel, IonTextarea, IonSegment, IonSegmentButton, IonIcon, IonModal, IonDatetime, IonSpinner, IonFab, IonFabButton, IonGrid, IonRow, IonCol, IonAlert]
})
export class ReservarPage implements OnInit, ViewWillEnter {
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
  mostrarCalendario = false;
  cargando = false;

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

  constructor(
    private supabaseService: SupabaseService,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    console.log('=== INICIANDO CARGA ===');
    console.log('Fecha inicial:', this.fechaSeleccionada);
    console.log('Fecha mínima:', this.fechaMinima);
    console.log('Usuario al iniciar:', this.supabaseService.user);
    
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
          { id: 2, nombre: 'Guayaquil', edificio_id: 1, capacidad: 15 },
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
        { id: 2, nombre: 'Guayaquil', edificio_id: 1, capacidad: 15 },
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
          );
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
    const resultado = this.proposito.trim().length === 0;
    console.log('=== PUEDE CONFIRMAR ===');
    console.log('Propósito actual:', `"${this.proposito}"`);
    console.log('Propósito trimmed:', `"${this.proposito.trim()}"`);
    console.log('Length:', this.proposito.trim().length);
    console.log('puedeConfirmar (botón deshabilitado?):', resultado);
    console.log('Sala seleccionada:', this.salaSeleccionada);
    console.log('Horarios seleccionados:', this.horariosSeleccionados);
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
    return new Date(this.fechaSeleccionada).toISOString().split('T')[0];
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
    
    // Si es ocupado por otro, no hacer nada
    if (estado === 'ocupado') {
      console.log('❌ Horario ocupado por otro usuario, no se puede hacer nada');
      return;
    }
    
    // Si es mi reserva, mostrar opción de cancelar
    if (estado === 'mi-reserva') {
      console.log('🟡 Es mi reserva, mostrando opciones de cancelación');
      this.mostrarOpcionesCancelacion(horario, salaId);
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
    if (!this.salaSeleccionada || this.horariosSeleccionados.length === 0 || !this.proposito.trim()) {
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
          proposito: this.proposito
        };
        
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
      alert('Disponibilidad actualizada');
    } catch (error) {
      console.error('Error refrescando:', error);
      alert('Error al refrescar');
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

  async cancelarReserva(horaInicio: string, horaFin: string, salaId: number) {
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
        alert('❌ No se encontró la reserva a cancelar');
        return;
      }
      
      console.log('Cancelando reserva ID:', reserva.id);
      
      // Eliminar la reserva de la base de datos
      const { data, error } = await this.supabaseService.eliminarReserva(reserva.id);
      
      console.log('Resultado del delete - data:', data);
      console.log('Resultado del delete - error:', error);
      
      if (error) {
        console.error('Error cancelando reserva:', error);
        alert(`❌ Error al cancelar la reserva: ${error.message}`);
        return;
      }
      
      console.log('Reserva cancelada exitosamente');
      alert('✅ Reserva cancelada exitosamente');
      
      // Recargar disponibilidad
      await this.cargarDisponibilidad();
      
      // Forzar actualización visual
      setTimeout(() => {
        this.cdr.detectChanges();
        console.log('Detección de cambios forzada después de cancelar reserva');
      }, 100);
      
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error inesperado al cancelar la reserva');
    } finally {
      this.cargando = false;
    }
  }
}