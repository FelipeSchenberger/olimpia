import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  slotPricing: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllPrices', () => {
    it('returns all prices ordered by startTime', async () => {
      const prices = [
        { startTime: '09:00', price: 40000 },
        { startTime: '18:00', price: 45000 },
      ];
      mockPrisma.slotPricing.findMany.mockResolvedValue(prices);

      const result = await service.getAllPrices();

      expect(result).toEqual(prices);
      expect(mockPrisma.slotPricing.findMany).toHaveBeenCalledWith({
        orderBy: { startTime: 'asc' },
      });
    });
  });

  describe('getPrice', () => {
    it('returns the price for a configured startTime', async () => {
      mockPrisma.slotPricing.findUnique.mockResolvedValue({
        startTime: '18:00',
        price: 45000,
      });

      const result = await service.getPrice('18:00');

      expect(result).toBe(45000);
      expect(mockPrisma.slotPricing.findUnique).toHaveBeenCalledWith({
        where: { startTime: '18:00' },
      });
    });

    it('returns 0 when no price is configured for the startTime', async () => {
      mockPrisma.slotPricing.findUnique.mockResolvedValue(null);

      const result = await service.getPrice('03:00');

      expect(result).toBe(0);
    });
  });

  describe('getDepositForSlot', () => {
    it('returns 10% of the slot price as deposit', async () => {
      mockPrisma.slotPricing.findUnique.mockResolvedValue({
        startTime: '18:00',
        price: 50000,
      });

      const result = await service.getDepositForSlot('18:00');

      expect(result).toBe(5000);
    });

    it('returns 0 when slot has no configured price', async () => {
      mockPrisma.slotPricing.findUnique.mockResolvedValue(null);

      const result = await service.getDepositForSlot('03:00');

      expect(result).toBe(0);
    });
  });

  describe('updatePricesBulk', () => {
    it('calls upsert for each price entry and wraps in a transaction', async () => {
      mockPrisma.slotPricing.upsert.mockResolvedValue({});
      mockPrisma.$transaction.mockResolvedValue([]);

      const prices = [
        { startTime: '09:00', price: 40000 },
        { startTime: '18:00', price: 45000 },
      ];

      await service.updatePricesBulk(prices);

      expect(mockPrisma.slotPricing.upsert).toHaveBeenCalledTimes(2);
      expect(mockPrisma.slotPricing.upsert).toHaveBeenCalledWith({
        where: { startTime: '09:00' },
        update: { price: 40000 },
        create: { startTime: '09:00', price: 40000 },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('handles empty price array without errors', async () => {
      mockPrisma.$transaction.mockResolvedValue([]);

      await service.updatePricesBulk([]);

      expect(mockPrisma.slotPricing.upsert).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).toHaveBeenCalledWith([]);
    });
  });
});
