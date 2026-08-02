import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Booking {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'PENDING_PAYMENT' | 'BOOKED' | 'FIXED' | 'AVAILABLE';
  type?: string;
  clientName?: string;
  clientPhone?: string;
  courtId: number;
  preferenceId?: string;
  paymentId?: string;
  expiresAt?: string;
  depositPaid?: number;
  createdAt: string;
}

export interface BookingsFilter {
  status?: string;
  date?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminBookingsService {
  private apiUrl = `${environment.apiUrl}/bookings`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private get authHeaders(): HttpHeaders {
    const token = this.authService.accessToken();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  getBookings(filters: BookingsFilter = {}): Observable<Booking[]> {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.date) params.set('date', filters.date);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<Booking[]>(`${this.apiUrl}${query}`, {
      headers: this.authHeaders,
    });
  }

  confirmBooking(id: number): Observable<Booking> {
    return this.http.patch<Booking>(
      `${this.apiUrl}/${id}/confirm`,
      {},
      { headers: this.authHeaders },
    );
  }

  releaseHold(id: number): Observable<Booking> {
    return this.http.delete<Booking>(
      `${this.apiUrl}/${id}/hold`,
      { headers: this.authHeaders },
    );
  }

  getPaymentHistory(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/payments`, {
      headers: this.authHeaders,
    });
  }
}
