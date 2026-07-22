import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SettingsService } from './settings.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { signal } from '@angular/core';

describe('SettingsService', () => {
  let service: SettingsService;
  let httpTestingController: HttpTestingController;

  const mockAuthService = {
    accessToken: signal('mock-token'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
    service = TestBed.inject(SettingsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get deposit amount', () => {
    service.getDepositAmount().subscribe((amount) => {
      expect(amount).toBe(5000);
    });

    const req = httpTestingController.expectOne(`${environment.apiUrl}/settings/deposit-amount`);
    expect(req.request.method).toEqual('GET');
    req.flush(5000);
  });

  it('should update deposit amount with authorization header', () => {
    service.updateDepositAmount(6000).subscribe((res) => {
      expect(res.value).toBe('6000');
    });

    const req = httpTestingController.expectOne(`${environment.apiUrl}/settings/deposit-amount`);
    expect(req.request.method).toEqual('PUT');
    expect(req.request.headers.get('Authorization')).toEqual('Bearer mock-token');
    expect(req.request.body).toEqual({ amount: 6000 });
    req.flush({ key: 'deposit_amount', value: '6000' });
  });
});
