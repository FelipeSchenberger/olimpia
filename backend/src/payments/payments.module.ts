import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [PricingModule],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
