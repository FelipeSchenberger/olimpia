import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEPOSIT_AMOUNT_KEY = 'deposit_amount';
const DEPOSIT_AMOUNT_DEFAULT = '0';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDepositAmount(): Promise<number> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: DEPOSIT_AMOUNT_KEY },
    });
    return Number(setting?.value ?? DEPOSIT_AMOUNT_DEFAULT);
  }

  async updateDepositAmount(
    amount: number,
  ): Promise<{ key: string; value: string }> {
    const setting = await this.prisma.setting.upsert({
      where: { key: DEPOSIT_AMOUNT_KEY },
      create: { key: DEPOSIT_AMOUNT_KEY, value: String(amount) },
      update: { value: String(amount) },
    });
    return { key: setting.key, value: setting.value };
  }
}
