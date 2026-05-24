export interface UPNParsedData {
  recipient_name: string | null;
  recipient_address: string | null;
  recipient_city: string | null;
  iban: string | null;
  amount: number | null;
  currency: string;
  purpose_code: string | null;
  purpose: string | null;
  reference: string | null;
  payer_name: string | null;
  payer_address: string | null;
  payer_city: string | null;
  due_date: string | null;
  control_code: string | null;
}

export interface ConvertResponse {
  source: string;
  upn_raw_payload: string;
  upn_parsed: UPNParsedData;
  epc_payload: string;
  epc_qr_png_base64: string;
}
