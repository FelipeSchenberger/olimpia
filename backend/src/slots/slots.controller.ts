import { Body, Controller, Get, Post, Query, Param, Put } from '@nestjs/common';
import { SlotsService } from './slots.service';

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

  @Post('generate')
  generate(@Body() body: { start: string; end: string }) {
    return this.slotsService.generateSlots(body.start, body.end);
  }

  @Post('fixed')
  createFixed(@Body() body: any) {
    return this.slotsService.createFixedSlot(body);
  }

  @Put(':id')
  updateStatus(@Param('id') id: string, @Body() body: { status: string, clientName?: string, type?: string }) {
    return this.slotsService.updateSlotStatus(
      Number(id),
      body.status,
      body.clientName,
      body.type
    );
  }
}
