import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';

const mockPrisma = {
  setting: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
};

const mockPricingService = {
  updatePricesBulk: jest.fn().mockResolvedValue(undefined),
};

describe('[Fase 1] SettingsService', () => {
  let service: SettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PricingService, useValue: mockPricingService },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    jest.clearAllMocks();
  });

  describe('getDepositAmount', () => {
    it('returns the stored amount as a number', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue({
        key: 'deposit_amount',
        value: '1500',
      });

      const result = await service.getDepositAmount();

      expect(result).toBe(1500);
      expect(mockPrisma.setting.findUnique).toHaveBeenCalledWith({
        where: { key: 'deposit_amount' },
      });
    });

    it('returns 0 when no setting exists yet', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue(null);

      const result = await service.getDepositAmount();

      expect(result).toBe(0);
    });
  });

  describe('updateDepositAmount', () => {
    it('upserts the deposit_amount setting and returns key/value', async () => {
      mockPrisma.setting.upsert.mockResolvedValue({
        key: 'deposit_amount',
        value: '2000',
        updatedAt: new Date(),
      });

      const result = await service.updateDepositAmount(2000);

      expect(result).toEqual({ key: 'deposit_amount', value: '2000' });
      expect(mockPrisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'deposit_amount' },
        create: { key: 'deposit_amount', value: '2000' },
        update: { value: '2000' },
      });
    });

    it('converts the numeric amount to string when persisting', async () => {
      mockPrisma.setting.upsert.mockResolvedValue({
        key: 'deposit_amount',
        value: '500',
        updatedAt: new Date(),
      });

      await service.updateDepositAmount(500);

      expect(mockPrisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'deposit_amount' },
        create: { key: 'deposit_amount', value: '500' },
        update: { value: '500' },
      });
    });
  });

  describe('getPromoPrices', () => {
    it('returns default promo prices when no setting exists', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue(null);

      const result = await service.getPromoPrices();

      expect(result).toHaveLength(5);
      expect(result[0].title).toBe('Lunes a Viernes');
    });

    it('returns default promo prices when setting value is empty', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue({
        key: 'promo_prices',
        value: '',
      });

      const result = await service.getPromoPrices();

      expect(result).toHaveLength(5);
    });

    it('returns stored promo prices as parsed JSON', async () => {
      const stored = [
        {
          title: 'Lunes a Viernes',
          subtitle: 'Todo el día',
          price: '$ 50.000',
        },
      ];
      mockPrisma.setting.findUnique.mockResolvedValue({
        key: 'promo_prices',
        value: JSON.stringify(stored),
      });

      const result = await service.getPromoPrices();

      expect(result).toEqual(stored);
    });

    it('returns defaults when stored JSON is invalid', async () => {
      mockPrisma.setting.findUnique.mockResolvedValue({
        key: 'promo_prices',
        value: 'not-valid-json{{{',
      });

      const result = await service.getPromoPrices();

      expect(result).toHaveLength(5);
    });
  });

  describe('updatePromoPrices', () => {
    it('upserts promo prices as JSON and returns count', async () => {
      mockPrisma.setting.upsert.mockResolvedValue({
        key: 'promo_prices',
        value: '[]',
      });

      const items = [
        { title: 'Lunes a Viernes', subtitle: 'Hasta 17hs', price: '$ 42.000' },
        { title: 'Cumpleaños', subtitle: '2 Hs de Cancha', price: '$ 95.000' },
      ];

      const result = await service.updatePromoPrices(items);

      expect(result).toEqual({ success: true, count: 2 });
      expect(mockPrisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'promo_prices' },
        create: { key: 'promo_prices', value: JSON.stringify(items) },
        update: { value: JSON.stringify(items) },
      });
    });

    it('returns count 0 when updating with empty array', async () => {
      mockPrisma.setting.upsert.mockResolvedValue({
        key: 'promo_prices',
        value: '[]',
      });

      const result = await service.updatePromoPrices([]);

      expect(result).toEqual({ success: true, count: 0 });
    });
  });
});
