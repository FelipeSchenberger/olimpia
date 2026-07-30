import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface SlotPricing {
  id?: number;
  startTime: string;
  price: number;
}

@Injectable({
  providedIn: 'root',
})
export class PricingService {
  private apiUrl = `${environment.apiUrl}/pricing`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private get authHeaders(): HttpHeaders {
    const token = this.authService.accessToken();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  getPrices(): Observable<SlotPricing[]> {
    return this.http.get<SlotPricing[]>(this.apiUrl);
  }

  updatePrices(prices: { startTime: string; price: number }[]): Observable<void> {
    return this.http.put<void>(
      this.apiUrl,
      { prices },
      { headers: this.authHeaders },
    );
  }
}
