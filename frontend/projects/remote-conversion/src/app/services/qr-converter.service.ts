import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConvertResponse } from '../models/convert-response.model';

@Injectable({ providedIn: 'root' })
export class QrConverterService {
  private base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  checkHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.base}/health`);
  }

  convertPdf(file: File): Observable<ConvertResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ConvertResponse>(`${this.base}/api/convert/pdf`, form);
  }

  convertUpnString(payload: string): Observable<ConvertResponse> {
    return this.http.post<ConvertResponse>(`${this.base}/api/convert/upn-string`, {
      upn_payload: payload,
    });
  }
}
