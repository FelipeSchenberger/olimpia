import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { SettingsService } from '../settings/settings.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: SettingsService,
          useValue: {
            getDepositAmount: jest.fn().mockResolvedValue(5000),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
