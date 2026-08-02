import { Test, TestingModule } from '@nestjs/testing';
import { SlotsService } from './slots.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  appointment: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  fixedSlot: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

describe('[Fase 1] SlotsService', () => {
  let service: SlotsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SlotsService>(SlotsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch slots for a date without generating if already exists', async () => {
    const dateStr = '2025-01-01';

    // Simulate that all 15 regular + 2 late night slots exist
    // Simulate that all 15 regular + 2 late night slots exist
    mockPrismaService.appointment.count
      .mockResolvedValueOnce(15)
      .mockResolvedValueOnce(2);
    // When generated is NOT called, these are the findMany calls for getSlotsForDate return:
    mockPrismaService.appointment.findMany
      .mockResolvedValueOnce(new Array(15).fill({}))
      .mockResolvedValueOnce(new Array(2).fill({}));

    const result = await service.getSlotsForDate(dateStr, 1);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.appointment.findMany).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.appointment.createMany).not.toHaveBeenCalled(); // No slots were generated
    expect(result).toHaveLength(17);
  });

  it('should generate missing slots using createMany', async () => {
    const dateStr = '2025-01-01';

    // Simulate missing slots: count returns 0
    mockPrismaService.appointment.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    // fixedSlots findMany
    mockPrismaService.fixedSlot.findMany.mockResolvedValueOnce([]);

    // generateDaySlots -> existingMain, existingLate
    mockPrismaService.appointment.findMany
      .mockResolvedValueOnce([]) // existingMain
      .mockResolvedValueOnce([]) // existingLate
      // getSlotsForDate return (Hoy + Madrugada)
      .mockResolvedValueOnce(new Array(15).fill({}))
      .mockResolvedValueOnce(new Array(2).fill({}));

    await service.getSlotsForDate(dateStr, 1);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.appointment.createMany).toHaveBeenCalledTimes(2); // One for regular, one for late hours
  });
});
