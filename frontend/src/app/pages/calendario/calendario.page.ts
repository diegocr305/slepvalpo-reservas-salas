import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-calendario',
  templateUrl: './calendario.page.html',
  styleUrls: ['./calendario.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class CalendarioPage implements OnInit {
  fechaSeleccionada: string = new Date().toISOString();
  salaSeleccionada: number | null = null;
  cargando = false;
  salas: any[] = [
    { id: 1, nombre: 'Principal', capacidad: 20, edificio: { nombre: 'Edificio Blanco' } },
    { id: 2, nombre: 'Guayaquil', capacidad: 15, edificio: { nombre: 'Edificio Blanco' } },
    { id: 3, nombre: 'San Antonio', capacidad: 10, edificio: { nombre: 'Edificio Blanco' } },
    { id: 4, nombre: 'Principal', capacidad: 25, edificio: { nombre: 'Edificio Cochrane' } },
    { id: 5, nombre: 'Secundaria', capacidad: 12, edificio: { nombre: 'Edificio Cochrane' } }
  ];
  reservas: any[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.cargarReservas();
  }

  onFechaChange() {
    this.cargarReservas();
  }

  onSalaChange() {
    this.cargarReservas();
  }

  cargarReservas() {
    // Simulación de carga
    this.cargando = true;
    setTimeout(() => {
      this.cargando = false;
    }, 500);
  }

  getReservasPorSala(salaId: number) {
    return this.reservas.filter(r => r.sala_id === salaId);
  }

  getHorasDisponibles(salaId: number) {
    const horasCompletas = [
      '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
      '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
      '16:00-17:00', '17:00-18:00', '18:00-19:00'
    ];
    const reservadas = this.getReservasPorSala(salaId).map(r => `${r.hora_inicio}-${r.hora_fin}`);
    return horasCompletas.filter(h => !reservadas.includes(h));
  }

  getColorEstado(estado: string) {
    switch(estado) {
      case 'confirmada': return 'success';
      case 'pendiente': return 'warning';
      case 'cancelada': return 'danger';
      default: return 'medium';
    }
  }

  navegarAReservar(salaId?: number, hora?: string) {
    if (salaId && hora) {
      this.router.navigate(['/reservar'], { 
        queryParams: { sala: salaId, hora: hora, fecha: this.fechaSeleccionada } 
      });
    } else {
      this.router.navigate(['/reservar']);
    }
  }
}