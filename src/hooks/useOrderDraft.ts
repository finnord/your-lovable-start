import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useProducts } from './useProducts';
import { useOrders } from './useOrders';
import {
  OrderDraft,
  DraftItem,
  WhatsAppParseResult,
  PhotoAnalysisResult,
  normalizeWhatsAppResult,
  normalizePhotoResult,
  matchProducts,
  validateDraft,
  getSelectedItems,
  calculateTotal,
} from '@/lib/order-extraction';

export function useOrderDraft() {
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const { products, refetch } = useProducts();
  const { addOrder, getNextOrderNumberForDate } = useOrders();
  const navigate = useNavigate();

  // Ensure products are loaded
  const ensureProducts = useCallback(async () => {
    if (products.length === 0) {
      await refetch();
    }
    return products;
  }, [products, refetch]);

  // Import from WhatsApp AI result
  const importFromWhatsApp = useCallback(async (
    result: WhatsAppParseResult,
    conversationId: string,
    phoneNumber?: string
  ) => {
    await ensureProducts();
    
    // Normalize the result
    const normalizedDraft = normalizeWhatsAppResult(result, conversationId, phoneNumber);
    
    // Match products
    const items = result.items || [];
    const matchedItems = matchProducts(items, products);
    
    // Set draft with matched items
    setDraft({
      ...normalizedDraft,
      items: matchedItems,
    });
    setIsDialogOpen(true);
  }, [products, ensureProducts]);

  // Import from photo analysis
  const importFromPhoto = useCallback(async (result: PhotoAnalysisResult) => {
    await ensureProducts();
    
    // Normalize the result
    const normalizedDraft = normalizePhotoResult(result);
    
    // Match products
    const matchedItems = matchProducts(result.items, products);
    
    // Set draft with matched items
    setDraft({
      ...normalizedDraft,
      items: matchedItems,
    });
    setIsDialogOpen(true);
  }, [products, ensureProducts]);

  // Update draft
  const updateDraft = useCallback((updates: Partial<OrderDraft>) => {
    setDraft(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Update single item
  const updateItem = useCallback((itemId: string, updates: Partial<DraftItem>) => {
    setDraft(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      };
    });
  }, []);

  // Remove item
  const removeItem = useCallback((itemId: string) => {
    setDraft(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
      };
    });
  }, []);

  // Toggle item selection
  const toggleItemSelection = useCallback((itemId: string) => {
    setDraft(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, selected: !item.selected } : item
        ),
      };
    });
  }, []);

  // Create order from draft
  const createOrder = useCallback(async () => {
    if (!draft) return false;

    // Validate
    const validation = validateDraft(draft);
    if (!validation.isValid) {
      validation.errors.forEach(err => toast.error(err));
      return false;
    }

    // Show warnings
    validation.warnings.forEach(warn => toast.warning(warn));

    setIsCreating(true);
    try {
      const selectedItems = getSelectedItems(draft);
      const orderNumber = getNextOrderNumberForDate(draft.delivery.date!);

      await addOrder({
        customerName: draft.customer.name || 'Cliente',
        customerPhone: draft.customer.phone || '',
        customerEmail: draft.customer.email || undefined,
        orderNumber,
        deliveryDate: draft.delivery.date!,
        deliveryTime: draft.delivery.time!,
        deliveryType: draft.delivery.type === 'consegna' ? 'delivery' : 'pickup',
        deliveryAddress: draft.delivery.address || undefined,
        items: selectedItems.map(item => ({
          id: crypto.randomUUID(),
          productId: item.matchedProduct!.id,
          name: item.matchedProduct!.name,
          quantity: item.quantity,
          price: item.matchedProduct!.price,
        })),
        totalAmount: calculateTotal(draft),
        notes: draft.notes || undefined,
      });

      toast.success('Ordine creato con successo!');
      setDraft(null);
      setIsDialogOpen(false);
      navigate('/ordini');
      return true;
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Errore nella creazione dell\'ordine');
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [draft, addOrder, getNextOrderNumberForDate, navigate]);

  // Clear draft
  const clearDraft = useCallback(() => {
    setDraft(null);
    setIsDialogOpen(false);
  }, []);

  return {
    draft,
    isDialogOpen,
    isCreating,
    setIsDialogOpen,
    importFromWhatsApp,
    importFromPhoto,
    updateDraft,
    updateItem,
    removeItem,
    toggleItemSelection,
    createOrder,
    clearDraft,
    // Expose helpers
    products,
    calculateTotal: () => draft ? calculateTotal(draft) : 0,
    validateDraft: () => draft ? validateDraft(draft) : { isValid: false, errors: ['Nessun draft'], warnings: [] },
  };
}
