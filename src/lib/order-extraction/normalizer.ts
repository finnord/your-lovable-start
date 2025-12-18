import {
  OrderDraft,
  WhatsAppParseResult,
  PhotoAnalysisResult,
  DeliveryType,
} from "./types";

/**
 * Normalize delivery type from various string inputs
 */
function normalizeDeliveryType(type?: string): DeliveryType | null {
  if (!type) return null;
  
  const lower = type.toLowerCase();
  if (lower.includes('consegna') || lower.includes('delivery')) {
    return 'consegna';
  }
  if (lower.includes('ritiro') || lower.includes('pickup') || lower.includes('asporto')) {
    return 'ritiro';
  }
  
  return null;
}

/**
 * Normalize WhatsApp parse result into OrderDraft
 */
export function normalizeWhatsAppResult(
  result: WhatsAppParseResult,
  conversationId: string,
  phoneNumber?: string
): OrderDraft {
  return {
    source: 'whatsapp',
    sourceId: conversationId,
    customer: {
      name: result.customer_name || null,
      phone: result.customer_phone || phoneNumber || null,
    },
    items: [], // Will be filled by matchProducts
    delivery: {
      date: result.delivery_date || null,
      time: result.delivery_time || null,
      type: normalizeDeliveryType(result.delivery_type),
    },
    notes: result.notes || null,
    rawText: result.raw_text,
  };
}

/**
 * Normalize photo analysis result into OrderDraft
 */
export function normalizePhotoResult(result: PhotoAnalysisResult): OrderDraft {
  return {
    source: 'photo',
    customer: {
      name: null,
      phone: null,
    },
    items: [], // Will be filled by matchProducts
    delivery: {
      date: null,
      time: null,
      type: null,
    },
    notes: null,
  };
}

/**
 * Create empty draft for manual entry
 */
export function createEmptyDraft(): OrderDraft {
  return {
    source: 'manual',
    customer: {
      name: null,
      phone: null,
    },
    items: [],
    delivery: {
      date: null,
      time: null,
      type: 'ritiro',
    },
    notes: null,
  };
}
