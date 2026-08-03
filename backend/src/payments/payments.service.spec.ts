import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PricingService } from '../pricing/pricing.service';

const mockPricingService = {
  getDepositForSlot: jest.fn(),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PricingService, useValue: mockPricingService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPreference', () => {
    it('throws when deposit amount is 0', async () => {
      mockPricingService.getDepositForSlot.mockResolvedValue(0);

      await expect(
        service.createPreference(1, '2026-01-01', '18:00'),
      ).rejects.toThrow('El monto de la seña debe ser mayor a 0');
    });

    it('throws when deposit amount is negative', async () => {
      mockPricingService.getDepositForSlot.mockResolvedValue(-100);

      await expect(
        service.createPreference(1, '2026-01-01', '18:00'),
      ).rejects.toThrow('El monto de la seña debe ser mayor a 0');
    });

    it('calls getDepositForSlot to determine the deposit amount', async () => {
      mockPricingService.getDepositForSlot.mockResolvedValue(5000);

      // Result may come from MP or mock depending on env; what matters is pricing is consulted
      const result = await service.createPreference(42, '2026-01-01', '18:00').catch(
        () => null,
      );

      expect(mockPricingService.getDepositForSlot).toHaveBeenCalledWith('18:00');
      // depositAmount should be what pricing returned
      if (result) {
        expect(result.depositAmount).toBe(5000);
      }
    });

    it('calls getDepositForSlot with the correct startTime', async () => {
      mockPricingService.getDepositForSlot.mockResolvedValue(3000);

      // May reach MP if token is set; what matters is the service called pricing
      await service.createPreference(99, '2026-06-15', '10:00').catch(() => {
        // OK if MP call fails in test env – the pricing call is what we assert
      });

      expect(mockPricingService.getDepositForSlot).toHaveBeenCalledWith('10:00');
    });
  });
});

