import { Test, TestingModule } from '@nestjs/testing';
import { SlotsService } from './slots.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  appointment: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
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

describe('SlotsService', () => {
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
    mockPrismaService.appointment.count.mockResolvedValueOnce(15).mockResolvedValueOnce(2);
    mockPrismaService.appointment.count.mockResolvedValueOnce(15).mockResolvedValueOnce(2);
    mockPrismaService.appointment.findMany.mockResolvedValueOnce(new Array(15).fill({})).mockResolvedValueOnce(new Array(2).fill({}));


    
    const result = await service.getSlotsForDate(dateStr, 1);
    
    expect(prisma.appointment.findMany).toHaveBeenCalled();
    expect(prisma.appointment.create).not.toHaveBeenCalled(); // No slots were generated
    expect(result).toHaveLength(17);
  });
});
