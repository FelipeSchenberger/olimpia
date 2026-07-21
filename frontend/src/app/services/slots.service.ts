import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Slot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED' | 'FIXED';
  type?: string;
  clientName?: string;
  clientPhone?: string;
  courtId: number;
}

@Injectable({
  providedIn: 'root',
})
export class SlotsService {
  private apiUrl = `${environment.apiUrl}/slots`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private get authHeaders(): HttpHeaders {
    const token = this.authService.accessToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  getSlots(date: string, courtId: number = 1): Observable<Slot[]> {
    return this.http.get<Slot[]>(`${this.apiUrl}?date=${date}&courtId=${courtId}`, {
      headers: this.authHeaders,
    });
  }

  getPublicSlots(date: string): Observable<{ startTime: string; status: string }[]> {
    return this.http.get<{ startTime: string; status: string }[]>(
      `${this.apiUrl}/public?date=${date}`,
    );
  }

  generateSlots(start: string, end: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate`, { start, end }, { headers: this.authHeaders });
  }

  updateStatus(
    id: number,
    status: string,
    clientName?: string,
    type?: string,
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}`,
      { status, clientName, type },
      { headers: this.authHeaders },
    );
  }

  createFixedSlot(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/fixed`, data, { headers: this.authHeaders });
  }
}
