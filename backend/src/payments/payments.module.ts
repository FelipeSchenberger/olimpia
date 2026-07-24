import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
