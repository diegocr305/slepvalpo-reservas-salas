export interface Edificio {
  id: number;
  nombre: string;
  direccion?: string;
  created_at: string;
}

export interface Sala {
  id: number;
  nombre: string;
  edificio_id: number;
  capacidad: number;
  equipamiento?: string[];
  activa: boolean;
  created_at: string;
  edificio?: Edificio;
}

export interface DisponibilidadSala {
  sala_id: number;
  sala_nombre: string;
  edificio_nombre: string;
  fecha: string;
  horas_ocupadas: string[];
}