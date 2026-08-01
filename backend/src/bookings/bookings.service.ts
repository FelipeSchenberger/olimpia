import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { Prisma } from '@prisma/client';

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
    // 1. Find the first AVAILABLE slot for this date/time (supports multi-court)
    const candidate = await this.prisma.appointment.findFirst({
      where: { date: new Date(date), startTime, status: 'AVAILABLE' },
      select: { id: true },
    });

    if (!candidate) {
      throw new ConflictException(
        'No hay canchas disponibles para este horario',
      );
    }

    // 2. Atomic update: only succeeds if the slot is still AVAILABLE (prevents TOCTOU race)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const result = await this.prisma.appointment.updateMany({
      where: { id: candidate.id, status: 'AVAILABLE' },
      data: {
        status: 'PENDING',
        clientName,
        clientPhone,
        expiresAt,
      },
    });

    if (result.count === 0) {
      throw new ConflictException(
        'El turno fue tomado por otro usuario. Intentá de nuevo.',
      );
    }

    // 3. Fetch the updated slot to get its full data
    const slot = await this.prisma.appointment.findUnique({
      where: { id: candidate.id },
    });

    if (!slot) {
      throw new ConflictException('Error interno al procesar la reserva');
    }

    // 4. Create MP Preference
    const preference = await this.paymentsService.createPreference(
      slot.id,
      date,
      startTime,
    );

    // 5. Save Preference ID & depositPaid
    await this.prisma.appointment.update({
      where: { id: slot.id },
      data: {
        preferenceId: preference.preferenceId,
        depositPaid: preference.depositAmount,
      },
    });

    return {
      initPoint: preference.initPoint,
    };
  }

  async getBookings(filters: { status?: string; date?: string }) {
    const where: Prisma.AppointmentWhereInput = {};

    if (filters.status) {
      const statuses = filters.status.split(',').map((s) => s.trim());
      where.status = { in: statuses };
    } else {
      // Por defecto, excluir AVAILABLE para mostrar solo lo relevante
      where.status = { in: ['PENDING', 'BOOKED', 'FIXED'] };
    }

    if (filters.date) {
      const dateObj = new Date(filters.date);
      where.date = { equals: dateObj };
    }

    return this.prisma.appointment.findMany({
      where,
      orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
      take: 200,
    });
  }

  async confirmBooking(id: number) {
    const slot = await this.prisma.appointment.findUnique({ where: { id } });

    if (!slot) {
      throw new NotFoundException('Turno no encontrado');
    }

    if (slot.status !== 'PENDING') {
      throw new BadRequestException(
        `El turno no está en estado PENDING (estado actual: ${slot.status})`,
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: 'BOOKED', expiresAt: null },
    });
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

  async releaseHold(id: number) {
    const slot = await this.prisma.appointment.findUnique({ where: { id } });
    if (!slot) {
      throw new NotFoundException('Turno no encontrado');
    }
    if (slot.status !== 'PENDING') {
      throw new BadRequestException('El turno no está en estado PENDING');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'AVAILABLE',
        clientName: null,
        clientPhone: null,
        expiresAt: null,
        preferenceId: null,
        paymentId: null,
        depositPaid: null,
      },
    });
  }

  async getPaymentHistory() {
    return this.prisma.appointment.findMany({
      where: {
        paymentId: { not: null },
        status: 'BOOKED',
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }
}
