import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: {
            appointment: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: PaymentsService,
          useValue: {
            createPreference: jest.fn().mockResolvedValue({
              preferenceId: 'test-pref',
              initPoint: 'http://test-url',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
