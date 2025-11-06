export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  area?: string;
  es_admin: boolean;
  activo: boolean;
  created_at: string;
}

export interface PerfilUsuario {
  nombre_completo: string;
  area?: string;
}