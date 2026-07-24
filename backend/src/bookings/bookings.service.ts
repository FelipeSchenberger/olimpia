import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async createIntent(
    date: string,
    startTime: string,
    clientName: string,
    clientPhone: string,
  ) {
    // 1. Verify slot exists and is AVAILABLE
    let slot = await this.prisma.appointment.findFirst({
      where: { date: new Date(date), startTime },
    });

    if (!slot) {
      throw new NotFoundException('El turno no existe');
    }

    if (slot.status !== 'AVAILABLE') {
      throw new ConflictException('El turno ya no está disponible');
    }

    // 2. Mark as PENDING with 15 minutes expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    slot = await this.prisma.appointment.update({
      where: { id: slot.id },
      data: {
        status: 'PENDING',
        clientName,
        clientPhone,
        expiresAt,
      },
    });

    // 3. Create MP Preference
    const preference = await this.paymentsService.createPreference(
      slot.id,
      date,
      startTime,
    );

    // 4. Save Preference ID
    await this.prisma.appointment.update({
      where: { id: slot.id },
      data: { preferenceId: preference.preferenceId },
    });

    return {
      initPoint: preference.initPoint,
    };
  }

  async handleWebhook(data: {
    type?: string;
    data?: { id?: string; external_reference?: string };
  }) {
    if (data.type === 'payment' && data.data && data.data.id) {
      const paymentId = data.data.id;

      // Mock para testing local sin token
      if (paymentId === 'mock-payment') {
        const appointmentId = Number(data.data.external_reference);
        if (!isNaN(appointmentId)) {
          await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'BOOKED', paymentId: String(paymentId) },
          });
          console.log(`Mock: Appointment ${appointmentId} confirmed.`);
        }
        return { received: true };
      }

      try {
        const paymentInfo = await this.paymentsService.getPayment(paymentId);

        if (paymentInfo.status === 'approved') {
          const appointmentId = Number(paymentInfo.external_reference);

          if (!isNaN(appointmentId)) {
            await this.prisma.appointment.update({
              where: { id: appointmentId },
              data: {
                status: 'BOOKED',
                paymentId: String(paymentId),
              },
            });
            console.log(`Appointment ${appointmentId} confirmed via MP.`);
          }
        }
      } catch (error) {
        console.error('Error handling MP webhook:', error);
      }
    }
    return { received: true };
  }
}
