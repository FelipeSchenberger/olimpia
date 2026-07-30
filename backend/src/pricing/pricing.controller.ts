import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  getAllPrices() {
    return this.pricingService.getAllPrices();
  }

  @UseGuards(SupabaseAuthGuard)
  @Put()
  updatePricesBulk(
    @Body() body: { prices: { startTime: string; price: number }[] },
  ) {
    return this.pricingService.updatePricesBulk(body.prices);
  }
}
