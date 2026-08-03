import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

const mockPrisma = {
  appointment: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  },
};

const mockPaymentsService = {
  createPreference: jest.fn(),
  getPayment: jest.fn(),
};

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PaymentsService, useValue: mockPaymentsService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createIntent', () => {
    it('throws ConflictException when no AVAILABLE slot exists', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue(null);

      await expect(
        service.createIntent(
          '2026-01-01',
          '18:00',
          'Test Client',
          '1111111111',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when updateMany returns count 0 (race condition)', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.appointment.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.createIntent(
          '2026-01-01',
          '18:00',
          'Test Client',
          '1111111111',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when findUnique returns null after update', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue({ id: 1 });
      mockPrisma.appointment.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      await expect(
        service.createIntent(
          '2026-01-01',
          '18:00',
          'Test Client',
          '1111111111',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('returns initPoint on successful intent creation', async () => {
      const fakeSlot = { id: 42, startTime: '18:00' };
      mockPrisma.appointment.findFirst.mockResolvedValue({ id: 42 });
      mockPrisma.appointment.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.appointment.findUnique.mockResolvedValue(fakeSlot);
      mockPrisma.appointment.update.mockResolvedValue(fakeSlot);
      mockPaymentsService.createPreference.mockResolvedValue({
        preferenceId: 'pref-42',
        initPoint: 'http://mp.com/init',
        depositAmount: 5000,
      });

      const result = await service.createIntent(
        '2026-01-01',
        '18:00',
        'Test Client',
        '1111111111',
      );

      expect(result).toEqual({ initPoint: 'http://mp.com/init' });
      expect(mockPaymentsService.createPreference).toHaveBeenCalledWith(
        42,
        '2026-01-01',
        '18:00',
      );
    });
  });

  describe('getBookings', () => {
    it('returns appointments without AVAILABLE when no filter provided', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await service.getBookings({});

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: { in: ['PENDING', 'BOOKED', 'FIXED'] } },
        }),
      );
    });

    it('filters by single status', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await service.getBookings({ status: 'BOOKED' });

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({ status: { in: ['BOOKED'] } }),
        }),
      );
    });

    it('filters by comma-separated statuses', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await service.getBookings({ status: 'PENDING,BOOKED' });

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            status: { in: ['PENDING', 'BOOKED'] },
          }),
        }),
      );
    });

    it('filters by date when provided', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await service.getBookings({ date: '2026-01-01' });

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            date: { equals: new Date('2026-01-01') },
          }),
        }),
      );
    });
  });

  describe('confirmBooking', () => {
    it('throws NotFoundException when slot does not exist', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      await expect(service.confirmBooking(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when slot is not PENDING', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        id: 1,
        status: 'BOOKED',
      });

      await expect(service.confirmBooking(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('updates slot to BOOKED when in PENDING state', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        id: 1,
        status: 'PENDING',
      });
      mockPrisma.appointment.update.mockResolvedValue({
        id: 1,
        status: 'BOOKED',
      });

      await service.confirmBooking(1);

      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'BOOKED', expiresAt: null },
      });
    });
  });

  describe('releaseHold', () => {
    it('throws NotFoundException when slot does not exist', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      await expect(service.releaseHold(999)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when slot is not PENDING', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        id: 1,
        status: 'AVAILABLE',
      });

      await expect(service.releaseHold(1)).rejects.toThrow(BadRequestException);
    });

    it('resets all booking fields when releasing a PENDING hold', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        id: 1,
        status: 'PENDING',
      });
      mockPrisma.appointment.update.mockResolvedValue({ id: 1 });

      await service.releaseHold(1);

      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'AVAILABLE',
          clientName: null,
          clientPhone: null,
          expiresAt: null,
          preferenceId: null,
          paymentId: null,
          depositPaid: null,
        },
      });
    });
  });

  describe('handleWebhook', () => {
    it('returns received:true and does nothing for non-payment event', async () => {
      const result = await service.handleWebhook({ type: 'other' });

      expect(result).toEqual({ received: true });
      expect(mockPrisma.appointment.update).not.toHaveBeenCalled();
    });

    it('handles mock-payment and confirms appointment', async () => {
      mockPrisma.appointment.update.mockResolvedValue({});

      const result = await service.handleWebhook({
        type: 'payment',
        data: { id: 'mock-payment', external_reference: '10' },
      });

      expect(result).toEqual({ received: true });
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { status: 'BOOKED', paymentId: 'mock-payment' },
      });
    });

    it('confirms appointment when MP payment is approved', async () => {
      mockPaymentsService.getPayment.mockResolvedValue({
        status: 'approved',
        external_reference: '7',
      });
      mockPrisma.appointment.update.mockResolvedValue({});

      await service.handleWebhook({
        type: 'payment',
        data: { id: 'mp-pay-123' },
      });

      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { status: 'BOOKED', paymentId: 'mp-pay-123' },
      });
    });

    it('does not update appointment when MP payment is pending', async () => {
      mockPaymentsService.getPayment.mockResolvedValue({
        status: 'pending',
        external_reference: '7',
      });

      await service.handleWebhook({
        type: 'payment',
        data: { id: 'mp-pay-456' },
      });

      expect(mockPrisma.appointment.update).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentHistory', () => {
    it('queries only BOOKED slots with a paymentId', async () => {
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await service.getPaymentHistory();

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith({
        where: { paymentId: { not: null }, status: 'BOOKED' },
        orderBy: { date: 'desc' },
        take: 100,
      });
    });
  });
});
