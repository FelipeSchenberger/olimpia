import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SlotPricing } from '@prisma/client';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPrices(): Promise<SlotPricing[]> {
    return this.prisma.slotPricing.findMany({
      orderBy: { startTime: 'asc' },
    });
  }

  async getPrice(startTime: string): Promise<number> {
    const pricing = await this.prisma.slotPricing.findUnique({
      where: { startTime },
    });
    // Si no hay precio configurado para este horario, se cobra 0 por defecto.
    return pricing ? pricing.price : 0;
  }

  async getDepositForSlot(startTime: string): Promise<number> {
    const price = await this.getPrice(startTime);
    // El monto de seña es el 10% del precio del turno
    return price * 0.1;
  }

  async updatePricesBulk(
    prices: { startTime: string; price: number }[],
  ): Promise<void> {
    // Upsert para cada precio proporcionado
    for (const p of prices) {
      await this.prisma.slotPricing.upsert({
        where: { startTime: p.startTime },
        update: { price: p.price },
        create: { startTime: p.startTime, price: p.price },
      });
    }
  }
}
