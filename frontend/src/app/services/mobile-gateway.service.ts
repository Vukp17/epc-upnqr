import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  MobileConversionResponse,
  MobileHistoryResponse,
  MobileInsightsResponse,
  MobileCapabilitiesResponse,
  MobileHealthResponse,
} from '../models/mobile.model';

@Injectable({
  providedIn: 'root'
})
export class MobileGatewayService {
  private baseUrl = environment.mobileApiBaseUrl;

  constructor(private http: HttpClient) {}

  checkHealth(): Observable<MobileHealthResponse> {
    return this.http.get<MobileHealthResponse>(`${this.baseUrl}/mobile/health`);
  }

  scanUpn(upnPayload: string): Observable<MobileConversionResponse> {
    return this.http.post<MobileConversionResponse>(`${this.baseUrl}/mobile/scan/upn`, {
      upn_payload: upnPayload,
    });
  }

  scanPdf(file: File): Observable<MobileConversionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MobileConversionResponse>(`${this.baseUrl}/mobile/scan/pdf`, formData);
  }

  getHistory(limit = 10): Observable<MobileHistoryResponse> {
    return this.http.get<MobileHistoryResponse>(`${this.baseUrl}/mobile/history`, {
      params: { limit: limit.toString() },
    });
  }

  getInsights(): Observable<MobileInsightsResponse> {
    return this.http.get<MobileInsightsResponse>(`${this.baseUrl}/mobile/insights`);
  }

  getCapabilities(): Observable<MobileCapabilitiesResponse> {
    return this.http.get<MobileCapabilitiesResponse>(`${this.baseUrl}/mobile/capabilities`);
  }
}
