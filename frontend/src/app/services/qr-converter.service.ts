import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConvertResponse } from '../models/convert-response.model';
import { RecentConversionsResponse } from '../models/recent-conversions.model';
import { StatsResponse } from '../models/stats.model';

@Injectable({
  providedIn: 'root'
})
export class QrConverterService {
  private apiBaseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  checkHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.apiBaseUrl}/health`);
  }

  convertPdf(file: File): Observable<ConvertResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ConvertResponse>(`${this.apiBaseUrl}/api/convert/pdf`, formData);
  }

  convertUpnString(payload: string): Observable<ConvertResponse> {
    return this.http.post<ConvertResponse>(`${this.apiBaseUrl}/api/convert/upn-string`, {
      upn_payload: payload
    });
  }

  getRecentConversions(limit = 10): Observable<RecentConversionsResponse> {
    return this.http.get<RecentConversionsResponse>(
      `${this.apiBaseUrl}/api/conversions/recent`,
      { params: { limit: limit.toString() } }
    );
  }

  getStats(): Observable<StatsResponse> {
    return this.http.get<StatsResponse>(`${this.apiBaseUrl}/api/conversions/stats`);
  }

  deleteConversions(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiBaseUrl}/api/conversions`);
  }

  getPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiBaseUrl}/api/conversions/${id}/pdf`, { responseType: 'blob' });
  }
}
