import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RecentConversionsResponse } from '../models/recent-conversions.model';
import { StatsResponse } from '../models/stats.model';

@Injectable({ providedIn: 'root' })
export class QrConverterService {
  private base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getRecentConversions(limit = 20): Observable<RecentConversionsResponse> {
    return this.http.get<RecentConversionsResponse>(
      `${this.base}/api/conversions/recent`,
      { params: { limit: limit.toString() } }
    );
  }

  getStats(): Observable<StatsResponse> {
    return this.http.get<StatsResponse>(`${this.base}/api/conversions/stats`);
  }

  deleteConversions(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/api/conversions`);
  }

  getPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/api/conversions/${id}/pdf`, { responseType: 'blob' });
  }
}
