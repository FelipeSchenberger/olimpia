import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private apiUrl = `${environment.apiUrl}/settings`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private get authHeaders(): HttpHeaders {
    const token = this.authService.accessToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  getDepositAmount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/deposit-amount`);
  }

  updateDepositAmount(amount: number): Observable<{ key: string; value: string }> {
    return this.http.put<{ key: string; value: string }>(
      `${this.apiUrl}/deposit-amount`,
      { amount },
      { headers: this.authHeaders }
    );
  }
}
