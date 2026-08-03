import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

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

    // Automatically sync these baseline prices to SlotPricing
    const hasta17Item = items.find(i => i.subtitle.toLowerCase().includes('17hs'));
    const desde18Item = items.find(i => i.subtitle.toLowerCase().includes('18hs'));

    if (hasta17Item && desde18Item) {
      const priceHasta17 = Number(hasta17Item.price.replace(/[^0-9]/g, ''));
      const priceDesde18 = Number(desde18Item.price.replace(/[^0-9]/g, ''));

      if (!isNaN(priceHasta17) && !isNaN(priceDesde18)) {
        const bulkPrices: { startTime: string; price: number }[] = [];
        const hours = [
          '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
          '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00'
        ];

        for (const h of hours) {
          const hourNum = parseInt(h.split(':')[0], 10);
          let price = priceDesde18;

          // If hour is between 09 and 17, use the 'Hasta 17hs' price
          if (hourNum >= 9 && hourNum <= 17) {
            price = priceHasta17;
          }

          bulkPrices.push({ startTime: h, price });
        }

        await this.pricingService.updatePricesBulk(bulkPrices);
      }
    }

    return { success: true, count: items.length };
  }
}
