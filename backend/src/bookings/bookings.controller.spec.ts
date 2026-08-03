import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

const mockBookingsService = {
  createIntent: jest.fn(),
  getBookings: jest.fn(),
  confirmBooking: jest.fn(),
  handleWebhook: jest.fn(),
  releaseHold: jest.fn(),
  getPaymentHistory: jest.fn(),
};

describe('BookingsController', () => {
  let controller: BookingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: mockBookingsService }],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BookingsController>(BookingsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createIntent', () => {
    it('delegates to service with correct params and returns initPoint', async () => {
      mockBookingsService.createIntent.mockResolvedValue({
        initPoint: 'http://mp.com/pay',
      });

      const result = await controller.createIntent({
        date: '2026-01-01',
        startTime: '18:00',
        clientName: 'Test User',
        clientPhone: '1234567890',
      });

      expect(result).toEqual({ initPoint: 'http://mp.com/pay' });
      expect(mockBookingsService.createIntent).toHaveBeenCalledWith(
        '2026-01-01',
        '18:00',
        'Test User',
        '1234567890',
      );
    });
  });

  describe('handleWebhook', () => {
    it('delegates the raw payload to service', async () => {
      mockBookingsService.handleWebhook.mockResolvedValue({ received: true });

      const payload = { type: 'payment', data: { id: 'mp-123' } };
      const result = await controller.handleWebhook(payload);

      expect(result).toEqual({ received: true });
      expect(mockBookingsService.handleWebhook).toHaveBeenCalledWith(payload);
    });
  });
});
