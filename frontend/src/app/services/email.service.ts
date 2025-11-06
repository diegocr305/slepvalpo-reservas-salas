import { Injectable } from '@angular/core';
import { ReservaCompleta } from '../models/reserva.model';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor() { }

  // Placeholder para integración con Amazon SES
  async enviarNotificacionReservaCreada(reserva: ReservaCompleta): Promise<boolean> {
    console.log('📧 Enviando notificación de reserva creada:', {
      destinatario: reserva.usuario_email,
      asunto: 'Reserva Confirmada - SLEP Valparaíso',
      reserva: {
        fecha: reserva.fecha,
        hora: `${reserva.hora_inicio} - ${reserva.hora_fin}`,
        sala: `${reserva.sala_nombre} (${reserva.edificio_nombre})`,
        proposito: reserva.proposito
      }
    });

    // TODO: Implementar envío real con Amazon SES
    return this.simularEnvioEmail();
  }

  async enviarNotificacionReservaCancelada(reserva: ReservaCompleta): Promise<boolean> {
    console.log('📧 Enviando notificación de reserva cancelada:', {
      destinatario: reserva.usuario_email,
      asunto: 'Reserva Cancelada - SLEP Valparaíso',
      reserva: {
        fecha: reserva.fecha,
        hora: `${reserva.hora_inicio} - ${reserva.hora_fin}`,
        sala: `${reserva.sala_nombre} (${reserva.edificio_nombre})`
      }
    });

    return this.simularEnvioEmail();
  }

  async enviarRecordatorio(reserva: ReservaCompleta): Promise<boolean> {
    console.log('⏰ Enviando recordatorio de reserva:', {
      destinatario: reserva.usuario_email,
      asunto: 'Recordatorio: Tu reserva comienza en 15 minutos',
      reserva: {
        fecha: reserva.fecha,
        hora: `${reserva.hora_inicio} - ${reserva.hora_fin}`,
        sala: `${reserva.sala_nombre} (${reserva.edificio_nombre})`,
        proposito: reserva.proposito
      }
    });

    return this.simularEnvioEmail();
  }

  async enviarQRCheckin(reserva: ReservaCompleta, qrCode: string): Promise<boolean> {
    console.log('📱 Enviando código QR para check-in:', {
      destinatario: reserva.usuario_email,
      asunto: 'Código QR para Check-in - SLEP Valparaíso',
      qrCode: qrCode,
      reserva: {
        fecha: reserva.fecha,
        hora: `${reserva.hora_inicio} - ${reserva.hora_fin}`,
        sala: `${reserva.sala_nombre} (${reserva.edificio_nombre})`
      }
    });

    return this.simularEnvioEmail();
  }

  private async simularEnvioEmail(): Promise<boolean> {
    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simular éxito/fallo (95% éxito)
    return Math.random() > 0.05;
  }

  // Método para configurar Amazon SES (implementar cuando esté listo)
  private async enviarConAmazonSES(
    destinatario: string,
    asunto: string,
    cuerpoHtml: string,
    cuerpoTexto?: string
  ): Promise<boolean> {
    // TODO: Implementar integración con Amazon SES
    // Usar AWS SDK para JavaScript
    /*
    const ses = new AWS.SES({
      region: 'us-east-1',
      accessKeyId: environment.awsAccessKeyId,
      secretAccessKey: environment.awsSecretAccessKey
    });

    const params = {
      Destination: {
        ToAddresses: [destinatario]
      },
      Message: {
        Body: {
          Html: { Data: cuerpoHtml },
          Text: { Data: cuerpoTexto || '' }
        },
        Subject: { Data: asunto }
      },
      Source: 'noreply@slepvalparaiso.cl'
    };

    try {
      await ses.sendEmail(params).promise();
      return true;
    } catch (error) {
      console.error('Error enviando email con SES:', error);
      return false;
    }
    */
    
    return false;
  }
}