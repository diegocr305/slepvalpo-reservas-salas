import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  subject: string;
  template: 'reserva-creada' | 'reserva-cancelada' | 'recordatorio';
  data: {
    usuario_nombre: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    sala_nombre: string;
    edificio_nombre: string;
    proposito?: string;
    reserva_id: string;
    base_url: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, template, data }: EmailRequest = await req.json()

    // Validar datos requeridos
    if (!to || !subject || !template || !data) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generar contenido del email según template
    const emailContent = generateEmailContent(template, data);

    // TODO: Integrar con Amazon SES
    const emailSent = await sendWithAmazonSES(to, subject, emailContent);

    if (emailSent) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email enviado exitosamente',
          to: to,
          template: template
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      throw new Error('Error enviando email');
    }

  } catch (error) {
    console.error('Error en función sendEmail:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateEmailContent(template: string, data: any): string {
  const baseTemplate = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SLEP Valparaíso - Sistema de Reservas</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>SLEP Valparaíso</h1>
                <p>Sistema de Reservas de Salas</p>
            </div>
            <div class="content">
                {{CONTENT}}
            </div>
            <div class="footer">
                <p>Servicio Local de Educación Pública de Valparaíso</p>
                <p><a href="${data.base_url}">reservas.slepvalparaiso.cl</a></p>
            </div>
        </div>
    </body>
    </html>
  `;

  let content = '';

  switch (template) {
    case 'reserva-creada':
      content = `
        <h2>✅ Reserva Confirmada</h2>
        <p>Hola ${data.usuario_nombre},</p>
        <p>Tu reserva ha sido confirmada exitosamente:</p>
        <ul>
          <li><strong>Fecha:</strong> ${data.fecha}</li>
          <li><strong>Horario:</strong> ${data.hora_inicio} - ${data.hora_fin}</li>
          <li><strong>Sala:</strong> ${data.sala_nombre} (${data.edificio_nombre})</li>
          <li><strong>Propósito:</strong> ${data.proposito}</li>
        </ul>
        <p>Recibirás un recordatorio 15 minutos antes del inicio.</p>
        <p><a href="${data.base_url}/mis-reservas">Ver mis reservas</a></p>
      `;
      break;

    case 'reserva-cancelada':
      content = `
        <h2>❌ Reserva Cancelada</h2>
        <p>Hola ${data.usuario_nombre},</p>
        <p>Tu reserva ha sido cancelada:</p>
        <ul>
          <li><strong>Fecha:</strong> ${data.fecha}</li>
          <li><strong>Horario:</strong> ${data.hora_inicio} - ${data.hora_fin}</li>
          <li><strong>Sala:</strong> ${data.sala_nombre} (${data.edificio_nombre})</li>
        </ul>
        <p>Puedes hacer una nueva reserva cuando lo necesites.</p>
        <p><a href="${data.base_url}/calendario">Ver calendario</a></p>
      `;
      break;

    case 'recordatorio':
      content = `
        <h2>⏰ Recordatorio de Reserva</h2>
        <p>Hola ${data.usuario_nombre},</p>
        <p>Tu reserva comienza en 15 minutos:</p>
        <ul>
          <li><strong>Fecha:</strong> ${data.fecha}</li>
          <li><strong>Horario:</strong> ${data.hora_inicio} - ${data.hora_fin}</li>
          <li><strong>Sala:</strong> ${data.sala_nombre} (${data.edificio_nombre})</li>
          <li><strong>Propósito:</strong> ${data.proposito}</li>
        </ul>
        <p>No olvides hacer check-in cuando llegues a la sala.</p>
        <p><a href="${data.base_url}/checkin/${data.reserva_id}">Hacer Check-in</a></p>
      `;
      break;

    default:
      content = '<p>Plantilla de email no encontrada.</p>';
  }

  return baseTemplate.replace('{{CONTENT}}', content);
}

async function sendWithAmazonSES(to: string, subject: string, htmlContent: string): Promise<boolean> {
  // TODO: Implementar integración real con Amazon SES
  // Por ahora, simular envío exitoso
  
  console.log('📧 Simulando envío de email:', {
    to,
    subject,
    contentLength: htmlContent.length
  });

  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simular éxito (95% de las veces)
  return Math.random() > 0.05;

  /* Implementación real con Amazon SES:
  
  import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
  
  const sesClient = new SESClient({
    region: Deno.env.get('AWS_REGION') || 'us-east-1',
    credentials: {
      accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
      secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
    },
  });

  const command = new SendEmailCommand({
    Source: Deno.env.get('FROM_EMAIL') || 'noreply@slepvalparaiso.cl',
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlContent,
          Charset: 'UTF-8',
        },
      },
    },
  });

  try {
    await sesClient.send(command);
    return true;
  } catch (error) {
    console.error('Error enviando email con SES:', error);
    return false;
  }
  */
}