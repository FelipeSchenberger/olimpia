import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SlotsService } from './slots.service';
import type { CreateFixedSlotDto } from './slots.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  getSlots(@Query('date') date: string, @Query('courtId') courtId: string) {
    return this.slotsService.getSlotsForDate(date, Number(courtId || 1));
  }

  @Get('public')
  getPublicSlots(@Query('date') date: string) {
    return this.slotsService.getPublicSlots(date);
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  generate(@Body() body: { start: string; end: string }) {
    return this.slotsService.generateSlots(body.start, body.end);
  }

  @UseGuards(JwtAuthGuard)
  @Post('fixed')
  createFixed(@Body() body: CreateFixedSlotDto) {
    return this.slotsService.createFixedSlot(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; clientName?: string; type?: string },
  ) {
    return this.slotsService.updateSlotStatus(
      Number(id),
      body.status,
      body.clientName,
      body.type,
    );
  }
}
