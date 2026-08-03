import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEPOSIT_AMOUNT_KEY = 'deposit_amount';
const DEPOSIT_AMOUNT_DEFAULT = '0';
const PROMO_PRICES_KEY = 'promo_prices';
const DEFAULT_PROMO_PRICES = [
  {
    title: 'Lunes a Viernes',
    subtitle: 'Hasta 17hs',
    price: '$ 42.000',
  },
  {
    title: 'Lunes a Viernes',
    subtitle: 'Desde 18hs',
    price: '$ 45.000',
  },
  {
    title: 'Sábados y Domingos',
    subtitle: 'Hasta 17hs',
    price: '$ 39.000',
  },
  {
    title: 'Sábados y Domingos',
    subtitle: 'Desde 18hs',
    price: '$ 42.000',
  },
  {
    title: 'Cumpleaños',
    subtitle: '2 Hs de Cancha',
    price: '$ 95.000',
  },
];

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

  async getPromoPrices(): Promise<
    { title: string; subtitle: string; price: string }[]
  > {
    const setting = await this.prisma.setting.findUnique({
      where: { key: PROMO_PRICES_KEY },
    });
    if (!setting?.value) {
      return DEFAULT_PROMO_PRICES;
    }
    try {
      return JSON.parse(setting.value) as {
        title: string;
        subtitle: string;
        price: string;
      }[];
    } catch {
      return DEFAULT_PROMO_PRICES;
    }
  }

  async updatePromoPrices(
    items: { title: string; subtitle: string; price: string }[],
  ): Promise<{ success: boolean; count: number }> {
    await this.prisma.setting.upsert({
      where: { key: PROMO_PRICES_KEY },
      create: {
        key: PROMO_PRICES_KEY,
        value: JSON.stringify(items),
      },
      update: {
        value: JSON.stringify(items),
      },
    });
    return { success: true, count: items.length };
  }
}
