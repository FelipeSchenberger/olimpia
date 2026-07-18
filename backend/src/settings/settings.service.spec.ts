import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  setting: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
};

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: mockPrisma },
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
});
