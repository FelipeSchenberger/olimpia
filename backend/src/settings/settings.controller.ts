import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('deposit-amount')
  getDepositAmount() {
    return this.settingsService.getDepositAmount();
  }

  @UseGuards(SupabaseAuthGuard)
  @Put('deposit-amount')
  updateDepositAmount(@Body() body: { amount: number }) {
    return this.settingsService.updateDepositAmount(body.amount);
  }
}
