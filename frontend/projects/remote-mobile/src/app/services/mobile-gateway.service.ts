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

@Injectable({ providedIn: 'root' })
export class MobileGatewayService {
  private base = environment.mobileApiBaseUrl;

  constructor(private http: HttpClient) {}

  checkHealth(): Observable<MobileHealthResponse> {
    return this.http.get<MobileHealthResponse>(`${this.base}/mobile/health`);
  }

  scanUpn(upnPayload: string): Observable<MobileConversionResponse> {
    return this.http.post<MobileConversionResponse>(`${this.base}/mobile/scan/upn`, {
      upn_payload: upnPayload,
    });
  }

  scanPdf(file: File): Observable<MobileConversionResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<MobileConversionResponse>(`${this.base}/mobile/scan/pdf`, form);
  }

  scanImage(file: File): Observable<MobileConversionResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<MobileConversionResponse>(`${this.base}/mobile/scan/image`, form);
  }

  getHistory(limit = 20): Observable<MobileHistoryResponse> {
    return this.http.get<MobileHistoryResponse>(`${this.base}/mobile/history`, {
      params: { limit: limit.toString() },
    });
  }

  getInsights(): Observable<MobileInsightsResponse> {
    return this.http.get<MobileInsightsResponse>(`${this.base}/mobile/insights`);
  }

  getCapabilities(): Observable<MobileCapabilitiesResponse> {
    return this.http.get<MobileCapabilitiesResponse>(`${this.base}/mobile/capabilities`);
  }
}
