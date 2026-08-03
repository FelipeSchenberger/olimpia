import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

const mockSettingsService = {
  getDepositAmount: jest.fn(),
  updateDepositAmount: jest.fn(),
  getPromoPrices: jest.fn(),
  updatePromoPrices: jest.fn(),
};

describe('SettingsController', () => {
  let controller: SettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SettingsController>(SettingsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDepositAmount', () => {
    it('delegates to service and returns the amount', async () => {
      mockSettingsService.getDepositAmount.mockResolvedValue(1500);

      const result = await controller.getDepositAmount();

      expect(result).toBe(1500);
      expect(mockSettingsService.getDepositAmount).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateDepositAmount', () => {
    it('delegates to service and returns updated setting', async () => {
      mockSettingsService.updateDepositAmount.mockResolvedValue({
        key: 'deposit_amount',
        value: '2000',
      });

      const result = await controller.updateDepositAmount({ amount: 2000 });

      expect(result).toEqual({ key: 'deposit_amount', value: '2000' });
      expect(mockSettingsService.updateDepositAmount).toHaveBeenCalledWith(2000);
    });
  });

  describe('getPromoPrices', () => {
    it('delegates to service and returns promo price list', async () => {
      const prices = [
        { title: 'Lunes a Viernes', subtitle: 'Hasta 17hs', price: '$ 42.000' },
      ];
      mockSettingsService.getPromoPrices.mockResolvedValue(prices);

      const result = await controller.getPromoPrices();

      expect(result).toEqual(prices);
      expect(mockSettingsService.getPromoPrices).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePromoPrices', () => {
    it('delegates items to service and returns count', async () => {
      mockSettingsService.updatePromoPrices.mockResolvedValue({
        success: true,
        count: 3,
      });

      const body = {
        items: [
          { title: 'Lunes a Viernes', subtitle: 'Hasta 17hs', price: '$ 42.000' },
          { title: 'Sábados y Domingos', subtitle: 'Todo el día', price: '$ 40.000' },
          { title: 'Cumpleaños', subtitle: '2 Hs de Cancha', price: '$ 95.000' },
        ],
      };

      const result = await controller.updatePromoPrices(body);

      expect(result).toEqual({ success: true, count: 3 });
      expect(mockSettingsService.updatePromoPrices).toHaveBeenCalledWith(body.items);
    });
  });
});
