import { Test, TestingModule } from '@nestjs/testing';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

const mockSlotsService = {
  getSlotsForDate: jest.fn(),
  getPublicSlots: jest.fn(),
  generateSlots: jest.fn(),
  createFixedSlot: jest.fn(),
  deleteFixedSlot: jest.fn(),
  updateSlotStatus: jest.fn(),
};

describe('SlotsController', () => {
  let controller: SlotsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SlotsController],
      providers: [{ provide: SlotsService, useValue: mockSlotsService }],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SlotsController>(SlotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('deleteFixed', () => {
    it('should delegate to SlotsService.deleteFixedSlot', async () => {
      mockSlotsService.deleteFixedSlot.mockResolvedValue({ deleted: 1, freed: 4 });

      const result = await controller.deleteFixed('1', '3', '18:00');

      expect(mockSlotsService.deleteFixedSlot).toHaveBeenCalledWith(1, 3, '18:00');
      expect(result).toEqual({ deleted: 1, freed: 4 });
    });
  });
});
