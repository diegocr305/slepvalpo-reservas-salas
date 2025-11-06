import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class QRService {

  constructor(private supabase: SupabaseService) {}

  async generarCodigoCheckin(reservaId: string): Promise<string> {
    try {
      // Generar código único
      const codigo = this.generarCodigoUnico();
      
      // Fecha de expiración (2 horas desde ahora)
      const expiracion = new Date();
      expiracion.setHours(expiracion.getHours() + 2);
      
      const qrData = {
        reserva_id: reservaId,
        codigo: codigo,
        expires_at: expiracion.toISOString(),
        usado: false
      };
      
      const { data, error } = await this.supabase.insert('qr_checkin', qrData);
      
      if (error) throw error;
      
      return codigo;
      
    } catch (error) {
      console.error('Error generando código QR:', error);
      throw error;
    }
  }

  async validarCodigoQR(codigo: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.select('qr_checkin', '*', {
        codigo: codigo,
        usado: false
      });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return null; // Código no válido
      }
      
      const qrRecord = data[0];
      
      // Verificar si no ha expirado
      const ahora = new Date();
      const expiracion = new Date(qrRecord.expires_at);
      
      if (ahora > expiracion) {
        return null; // Código expirado
      }
      
      // Marcar como usado
      await this.supabase.update('qr_checkin', qrRecord.id, {
        usado: true
      });
      
      return qrRecord.reserva_id;
      
    } catch (error) {
      console.error('Error validando código QR:', error);
      return null;
    }
  }

  generarURLCheckin(reservaId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/checkin/${reservaId}`;
  }

  async generarQRParaSala(salaId: number): Promise<string> {
    // Generar QR genérico para la sala (para check-in rápido)
    const baseUrl = window.location.origin;
    return `${baseUrl}/checkin/sala/${salaId}`;
  }

  private generarCodigoUnico(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`.toUpperCase();
  }

  // Método para generar QR visual (requiere librería qrcode)
  async generarQRImage(texto: string): Promise<string> {
    try {
      // TODO: Implementar con librería qrcode
      // const QRCode = require('qrcode');
      // return await QRCode.toDataURL(texto);
      
      // Por ahora retornar placeholder
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">
            QR Code
          </text>
          <text x="100" y="120" text-anchor="middle" font-size="8" fill="gray">
            ${texto.substring(0, 20)}...
          </text>
        </svg>
      `)}`;
      
    } catch (error) {
      console.error('Error generando imagen QR:', error);
      throw error;
    }
  }
}