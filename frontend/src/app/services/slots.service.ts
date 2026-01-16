import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  providedIn: 'root'
})
export class SlotsService {
  private apiUrl = 'http://localhost:3000/slots';

  constructor(private http: HttpClient) { }

  getSlots(date: string, courtId: number = 1): Observable<Slot[]> {
     // Pasar courtId como query param
    return this.http.get<Slot[]>(`${this.apiUrl}?date=${date}&courtId=${courtId}`);
  }

  getPublicSlots(date: string): Observable<{ startTime: string, status: string }[]> {
      return this.http.get<{ startTime: string, status: string }[]>(`${this.apiUrl}/public?date=${date}`);
  }

  generateSlots(start: string, end: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate`, { start, end });
  }

  updateStatus(id: number, status: string, clientName?: string, type?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { status, clientName, type });
  }
  
  createFixedSlot(data: any): Observable<any> {
      return this.http.post(`${this.apiUrl}/fixed`, data);
  }
}
