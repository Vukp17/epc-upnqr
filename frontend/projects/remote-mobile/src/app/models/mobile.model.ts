export interface MobilePayment {
  recipient: string | null;
  iban: string | null;
  amount: number | null;
  currency: string | null;
  purpose_code?: string | null;
  purpose: string | null;
  reference: string | null;
  payer_name?: string | null;
  payer_address?: string | null;
  payer_city?: string | null;
  recipient_address?: string | null;
  recipient_city?: string | null;
  due_date?: string | null;
  control_code?: string | null;
}

export interface MobileConversionResponse {
  status: string;
  channel: string;
  payment: MobilePayment;
  qr: { epc_payload: string; epc_qr_png_base64: string };
}

export interface MobileHistoryItem {
  id: string;
  source: string;
  created_at: string;
  recipient_name: string | null;
  iban: string | null;
  amount: number | null;
  currency: string;
}

export interface MobileHistoryResponse {
  status: string;
  channel: string;
  count: number;
  items: MobileHistoryItem[];
}

export interface MobileInsightsResponse {
  status: string;
  channel: string;
  stats: Record<string, unknown>;
}

export interface MobileCapabilitiesResponse {
  status: string;
  channel: string;
  features: string[];
}

export interface MobileHealthResponse {
  status: string;
  gateway: string;
  dependency?: unknown;
}
