// Types
export type {
  OrderSource,
  ConfidenceLevel,
  DeliveryType,
  DraftCustomer,
  DraftDelivery,
  DraftItem,
  OrderDraft,
  AIExtractedItem,
  WhatsAppParseResult,
  PhotoAnalysisResult,
} from "./types";

// Normalizers
export {
  normalizeWhatsAppResult,
  normalizePhotoResult,
  createEmptyDraft,
} from "./normalizer";

// Product Matcher
export {
  matchProducts,
  rematchItem,
} from "./product-matcher";

// Validator
export {
  validateDraft,
  getSelectedItems,
  calculateTotal,
} from "./validator";
export type { ValidationResult } from "./validator";
