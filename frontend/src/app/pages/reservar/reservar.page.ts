import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonItem, IonLabel, IonTextarea, IonSegment, IonSegmentButton, IonIcon, IonPopover, IonDatetime } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reservar',
  templateUrl: './reservar.page.html',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonItem, IonLabel, IonTextarea, IonSegment, IonSegmentButton, IonIcon, IonPopover, IonDatetime]
})
export class ReservarPage {
  fechaSeleccionada = new Date().toISOString().split('T')[0];
  fechaMinima = new Date().toISOString().split('T')[0];
  edificioSeleccionado = 'blanco';
  salaSeleccionada = '';
  horariosSeleccionados: string[] = [];
  proposito = '';
  mostrarCalendario = false;

  // DATOS HARD CODED (se reemplazarán por Supabase)
  salas: any = {
    blanco: [
      { id: 'principal', nombre: 'Sala Principal', capacidad: 20 },
      { id: 'guayaquil', nombre: 'Sala Guayaquil', capacidad: 15 },
      { id: 'sanantonio', nombre: 'Sala San Antonio', capacidad: 12 }
    ],
    cochrane: [
      { id: 'principal', nombre: 'Sala Principal', capacidad: 25 },
      { id: 'secundaria', nombre: 'Sala Secundaria', capacidad: 10 }
    ]
  };

  // Horarios hasta las 19:00
  horarios = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
    '16:00-17:00', '17:00-18:00', '18:00-19:00'
  ];

  // DISPONIBILIDAD SIMULADA (se reemplazará por datos reales de Supabase)
  disponibilidad: any = {
    'blanco-principal': ['disponible', 'ocupado', 'disponible', 'ocupado', 'disponible', 'disponible', 'mi-reserva', 'disponible', 'ocupado', 'disponible', 'disponible'],
    'blanco-guayaquil': ['disponible', 'disponible', 'ocupado', 'disponible', 'disponible', 'ocupado', 'disponible', 'disponible', 'disponible', 'ocupado', 'disponible'],
    'blanco-sanantonio': ['ocupado', 'disponible', 'disponible', 'disponible', 'ocupado', 'disponible', 'disponible', 'ocupado', 'disponible', 'disponible', 'ocupado'],
    'cochrane-principal': ['disponible', 'ocupado', 'disponible', 'disponible', 'disponible', 'ocupado', 'disponible', 'disponible', 'ocupado', 'disponible', 'disponible'],
    'cochrane-secundaria': ['disponible', 'disponible', 'disponible', 'ocupado', 'disponible', 'disponible', 'disponible', 'disponible', 'disponible', 'ocupado', 'mi-reserva']
  };

  get salasDelEdificio() {
    return this.salas[this.edificioSeleccionado] || [];
  }

  get edificioNombre() {
    return this.edificioSeleccionado === 'blanco' ? 'Edificio Blanco' : 'Edificio Cochrane';
  }

  get horariosTexto() {
    return this.horariosSeleccionados.join(', ');
  }

  get puedeConfirmar(): boolean {
    return !this.proposito.trim();
  }

  get fechaFormateada(): string {
    const fecha = new Date(this.fechaSeleccionada + 'T00:00:00');
    return fecha.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Navegación de fechas con flechas
  cambiarFecha(dias: number) {
    const fechaActual = new Date(this.fechaSeleccionada + 'T00:00:00');
    fechaActual.setDate(fechaActual.getDate() + dias);
    
    // No permitir fechas pasadas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaActual >= hoy) {
      this.fechaSeleccionada = fechaActual.toISOString().split('T')[0];
      this.limpiarSeleccion();
    }
  }

  // Abrir calendario
  abrirCalendario() {
    this.mostrarCalendario = true;
  }

  // Cuando cambia la fecha en el calendario
  onFechaChange() {
    this.mostrarCalendario = false;
    this.limpiarSeleccion();
  }

  onEdificioChange() {
    this.limpiarSeleccion();
  }

  private limpiarSeleccion() {
    this.salaSeleccionada = '';
    this.horariosSeleccionados = [];
  }

  getEstadoHorario(salaId: string, index: number): string {
    const key = `${this.edificioSeleccionado}-${salaId}`;
    return this.disponibilidad[key]?.[index] || 'disponible';
  }

  toggleHorario(horario: string, salaId: string, index: number) {
    const estado = this.getEstadoHorario(salaId, index);
    if (estado === 'ocupado') return;

    if (this.salaSeleccionada !== salaId) {
      this.salaSeleccionada = salaId;
      this.horariosSeleccionados = [];
    }

    const horarioIndex = this.horariosSeleccionados.indexOf(horario);
    if (horarioIndex > -1) {
      this.horariosSeleccionados.splice(horarioIndex, 1);
    } else {
      this.horariosSeleccionados.push(horario);
    }
  }

  isHorarioSeleccionado(horario: string): boolean {
    return this.horariosSeleccionados.includes(horario);
  }

  getSalaNombre(salaId: string): string {
    const sala = this.salasDelEdificio.find((s: any) => s.id === salaId);
    return sala ? sala.nombre : '';
  }

  confirmarReserva() {
    if (!this.salaSeleccionada || this.horariosSeleccionados.length === 0 || !this.proposito.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    // TODO: Aquí se enviará a Supabase cuando esté conectado
    const reserva = {
      fecha: this.fechaSeleccionada,
      edificio: this.edificioSeleccionado,
      sala: this.salaSeleccionada,
      horarios: this.horariosSeleccionados,
      proposito: this.proposito
    };

    console.log('Reserva confirmada:', reserva);
    alert(`✅ Reserva confirmada para ${this.getSalaNombre(this.salaSeleccionada)} el ${this.fechaSeleccionada}`);
    
    // Limpiar formulario
    this.horariosSeleccionados = [];
    this.salaSeleccionada = '';
    this.proposito = '';
  }
}