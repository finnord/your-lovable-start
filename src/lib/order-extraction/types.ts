import { Product } from "@/types/order";

export type OrderSource = 'whatsapp' | 'photo' | 'voice' | 'manual';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type DeliveryType = 'ritiro' | 'consegna';

export interface DraftCustomer {
  name: string | null;
  phone: string | null;
  email?: string | null;
  matchedCustomerId?: string;
}

export interface DraftDelivery {
  date: string | null;
  time: string | null;
  type: DeliveryType | null;
  address?: string | null;
}

export interface DraftItem {
  id: string;
  extractedName: string;
  quantity: number;
  confidence: ConfidenceLevel;
  matchedProduct?: Product;
  selected: boolean;
}

export interface OrderDraft {
  source: OrderSource;
  sourceId?: string;
  customer: DraftCustomer;
  items: DraftItem[];
  delivery: DraftDelivery;
  notes: string | null;
  rawText?: string;
}

// Input types from AI parsers
export interface AIExtractedItem {
  name: string;
  quantity: number;
}

export interface WhatsAppParseResult {
  customer_name?: string;
  customer_phone?: string;
  items?: AIExtractedItem[];
  delivery_date?: string;
  delivery_time?: string;
  delivery_type?: string;
  notes?: string;
  raw_text?: string;
}

export interface PhotoAnalysisResult {
  items: AIExtractedItem[];
}
