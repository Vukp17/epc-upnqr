export interface RecentConversionItem {
  id: string;
  source: string;
  created_at: string;
  recipient_name: string | null;
  iban: string | null;
  amount: number | null;
  currency: string;
  has_pdf: boolean;
}

export interface RecentConversionsResponse {
  count: number;
  items: RecentConversionItem[];
}
