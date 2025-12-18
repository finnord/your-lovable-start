import { Product } from "@/types/order";
import { AIExtractedItem, DraftItem, ConfidenceLevel } from "./types";

/**
 * Calculate similarity between two strings (case insensitive)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1;
  
  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return shorter / longer;
  }
  
  // Word-based matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matchingWords = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) {
        matchingWords++;
        break;
      }
    }
  }
  
  const totalWords = Math.max(words1.length, words2.length);
  return matchingWords / totalWords;
}

/**
 * Determine confidence level based on similarity score
 */
function getConfidence(similarity: number): ConfidenceLevel {
  if (similarity >= 0.8) return 'high';
  if (similarity >= 0.5) return 'medium';
  return 'low';
}

/**
 * Find best matching product for an extracted item name
 */
function findBestMatch(
  extractedName: string,
  products: Product[]
): { product: Product | undefined; confidence: ConfidenceLevel } {
  let bestMatch: Product | undefined;
  let bestScore = 0;
  
  for (const product of products) {
    const score = calculateSimilarity(extractedName, product.name);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }
  
  // Only return match if score is above threshold
  if (bestScore >= 0.4) {
    return {
      product: bestMatch,
      confidence: getConfidence(bestScore),
    };
  }
  
  return { product: undefined, confidence: 'low' };
}

/**
 * Match extracted items to products in the database
 */
export function matchProducts(
  items: AIExtractedItem[],
  products: Product[]
): DraftItem[] {
  return items.map((item) => {
    const { product, confidence } = findBestMatch(item.name, products);
    
    return {
      id: crypto.randomUUID(),
      extractedName: item.name,
      quantity: item.quantity,
      confidence,
      matchedProduct: product,
      selected: !!product && confidence !== 'low',
    };
  });
}

/**
 * Re-match a single item when user selects a different product
 */
export function rematchItem(
  item: DraftItem,
  newProduct: Product
): DraftItem {
  return {
    ...item,
    matchedProduct: newProduct,
    confidence: 'high', // User manually selected, so it's high confidence
    selected: true,
  };
}
