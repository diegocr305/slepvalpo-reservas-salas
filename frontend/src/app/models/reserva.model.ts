export interface Reserva {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  sala_id: number;
  usuario_id: string;
  proposito: string;
  estado: 'confirmada' | 'cancelada' | 'no_show';
  checkin_realizado: boolean;
  checkin_timestamp?: string;
  recordatorio_enviado: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReservaCompleta extends Reserva {
  sala_nombre: string;
  edificio_nombre: string;
  usuario_nombre: string;
  usuario_email: string;
  usuario_area?: string;
}

export interface NuevaReserva {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  sala_id: number;
  proposito: string;
}

export interface QRCheckin {
  id: string;
  reserva_id: string;
  codigo: string;
  usado: boolean;
  expires_at: string;
  created_at: string;
}

export interface EstadisticasSala {
  sala_nombre: string;
  edificio_nombre: string;
  mes: string;
  total_reservas: number;
  confirmadas: number;
  canceladas: number;
  no_shows: number;
  con_checkin: number;
  porcentaje_checkin: number;
}