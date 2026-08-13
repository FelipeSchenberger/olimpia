import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { CronService } from './cron/cron.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async checkHealth() {
    // Hace una consulta muy ligera a la base de datos
    // Esto asegura que Supabase registre "actividad" y no pause el proyecto
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('cron/clean-pending')
  async runCronJob() {
    // Para ser llamado desde el CronJob de Hostinger cada minuto
    const cronService = new CronService(this.prisma);
    await cronService.handleExpiredPendingAppointments();
    return { status: 'success', message: 'Cron job executed' };
  }
}
