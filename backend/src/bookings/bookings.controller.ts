import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

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

  @UseGuards(SupabaseAuthGuard)
  @Get()
  async getBookings(
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.bookingsService.getBookings({ status, date });
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch(':id/confirm')
  async confirmBooking(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.confirmBooking(id);
  }

  @Post('webhook')
  async handleWebhook(
    @Body()
    data: {
      type?: string;
      data?: { id?: string; external_reference?: string };
    },
  ) {
    return this.bookingsService.handleWebhook(data);
  }

  @UseGuards(SupabaseAuthGuard)
  @Delete(':id/hold')
  async releaseHold(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.releaseHold(id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('payments')
  async getPaymentHistory() {
    return this.bookingsService.getPaymentHistory();
  }
}
