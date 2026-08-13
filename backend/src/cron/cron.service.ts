import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private readonly prisma: PrismaService) {}

  // @Cron(CronExpression.EVERY_MINUTE)
  // Desactivamos el cron interno para evitar el "Prisma Panic: timer has gone away" en Hostinger
  // En su lugar, expondremos un endpoint para llamarlo desde el panel de Hostinger.
  async handleExpiredPendingAppointments() {
    this.logger.debug('Checking for expired pending appointments...');

    const now = new Date();

    const result = await this.prisma.appointment.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now, // Less than now means it has expired
        },
      },
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

    if (result.count > 0) {
      this.logger.log(`Released ${result.count} expired pending appointments.`);
    }
  }
}
