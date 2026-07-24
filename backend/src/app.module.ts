import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SlotsModule } from './slots/slots.module';
import { SettingsModule } from './settings/settings.module';
import { PaymentsModule } from './payments/payments.module';
import { BookingsModule } from './bookings/bookings.module';
import { CronModule } from './cron/cron.module';

import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    PrismaModule,
    SlotsModule,
    SettingsModule,
    PaymentsModule,
    BookingsModule,
    CronModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
