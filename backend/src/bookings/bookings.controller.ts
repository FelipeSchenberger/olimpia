import { Controller, Post, Body } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('intent')
  async createIntent(
    @Body('date') date: string,
    @Body('startTime') startTime: string,
    @Body('clientName') clientName: string,
    @Body('clientPhone') clientPhone: string,
  ) {
    return this.bookingsService.createIntent(
      date,
      startTime,
      clientName,
      clientPhone,
    );
  }

  @Post('webhook')
  async handleWebhook(@Body() data: any) {
    return this.bookingsService.handleWebhook(data);
  }
}
