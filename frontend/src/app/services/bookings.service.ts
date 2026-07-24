import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BookingIntentRequest {
  date: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
}

export interface BookingIntentResponse {
  initPoint: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingsService {

  constructor(private http: HttpClient) { }

  createIntent(request: BookingIntentRequest): Observable<BookingIntentResponse> {
    return this.http.post<BookingIntentResponse>(`${environment.apiUrl}/bookings/intent`, request);
  }
}
