import { OrderDraft, DraftItem } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Get selected items from draft
 */
export function getSelectedItems(draft: OrderDraft): DraftItem[] {
  return draft.items.filter(item => item.selected && item.matchedProduct);
}

/**
 * Calculate total amount for selected items
 */
export function calculateTotal(draft: OrderDraft): number {
  return getSelectedItems(draft).reduce((sum, item) => {
    return sum + (item.matchedProduct!.price * item.quantity);
  }, 0);
}

/**
 * Validate draft before creating order
 */
export function validateDraft(draft: OrderDraft): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check customer info
  if (!draft.customer.name?.trim()) {
    errors.push("Nome cliente richiesto");
  }
  if (!draft.customer.phone?.trim()) {
    warnings.push("Telefono cliente non specificato");
  }
  
  // Check items
  const selectedItems = getSelectedItems(draft);
  if (selectedItems.length === 0) {
    errors.push("Seleziona almeno un prodotto");
  }
  
  // Check delivery
  if (!draft.delivery.date) {
    errors.push("Data di consegna richiesta");
  }
  if (!draft.delivery.time) {
    errors.push("Ora di consegna richiesta");
  }
  
  // Warnings for unmatched items
  const unmatchedItems = draft.items.filter(i => !i.matchedProduct);
  if (unmatchedItems.length > 0) {
    warnings.push(`${unmatchedItems.length} prodotti non riconosciuti`);
  }
  
  // Warnings for low confidence matches
  const lowConfidence = draft.items.filter(
    i => i.matchedProduct && i.confidence === 'low'
  );
  if (lowConfidence.length > 0) {
    warnings.push(`${lowConfidence.length} prodotti con matching incerto`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
