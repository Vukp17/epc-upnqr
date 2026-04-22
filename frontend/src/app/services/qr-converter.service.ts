import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConvertResponse } from '../models/convert-response.model';

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
}
