import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { UpdatePricesBulkDto } from './dto/update-prices-bulk.dto';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  getAllPrices() {
    return this.pricingService.getAllPrices();
  }

  @UseGuards(SupabaseAuthGuard)
  @Put()
  async updatePricesBulk(@Body() body: UpdatePricesBulkDto) {
    await this.pricingService.updatePricesBulk(body.prices);
    return { success: true, count: body.prices.length };
  }
}
