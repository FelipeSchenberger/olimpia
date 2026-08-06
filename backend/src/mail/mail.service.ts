import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendBookingNotification(
    clientName: string,
    date: Date,
    startTime: string,
    depositPaid: number,
    paymentId: string,
  ) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      this.logger.warn('Faltan credenciales de correo (EMAIL_USER / EMAIL_PASS). No se enviará la notificación.');
      return;
    }

    const formattedDate = new Date(date).toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const mailOptions = {
      from: `"Olimpia Fútbol 5" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Envía al mismo administrador
      subject: `⚽ Nueva Reserva Confirmada: ${clientName} (${startTime})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="color: #4CAF50; text-align: center;">¡Nueva Reserva de Cancha!</h2>
          <p style="font-size: 16px; color: #333;">Se ha abonado la seña para un nuevo turno en Olimpia Fútbol 5. A continuación los detalles:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; width: 35%;">Cliente:</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${clientName || 'Desconocido'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Fecha:</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; text-transform: capitalize;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Horario:</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">${startTime}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Seña Pagada:</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #2e7d32; font-weight: bold;">$ ${depositPaid}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">ID Recibo (MP):</td>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">#${paymentId}</td>
            </tr>
          </table>
          
          <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #888;">
            Este es un correo automático. El turno ya figura en rojo (ocupado) en tu panel administrativo.
          </p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Notificación enviada con éxito: ${info.messageId}`);
    } catch (error) {
      this.logger.error('Error al enviar la notificación por correo:', error);
    }
  }
}
