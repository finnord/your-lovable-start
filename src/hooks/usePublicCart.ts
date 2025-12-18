import { useState, useCallback, useMemo } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  deliveryType: 'ritiro' | 'consegna';
  deliveryDate: Date | undefined;
  deliveryTime: string | null;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
}

export function usePublicCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryType, setDeliveryType] = useState<'ritiro' | 'consegna'>('ritiro');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [deliveryTime, setDeliveryTime] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  const addItem = useCallback((product: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(item => item.productId === product.productId);
      if (existing) {
        return prev.map(item =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.productId !== productId);
    });
  }, []);

  const setItemQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(item => item.productId !== productId));
    } else {
      setItems(prev => prev.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      ));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemQuantity = useCallback((productId: string) => {
    return items.find(item => item.productId === productId)?.quantity || 0;
  }, [items]);

  const totalItems = useMemo(() => 
    items.reduce((sum, item) => sum + item.quantity, 0)
  , [items]);

  const totalAmount = useMemo(() => 
    items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  , [items]);

  const setItemsFromAI = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
  }, []);

  return {
    items,
    deliveryType,
    deliveryDate,
    deliveryTime,
    deliveryAddress,
    customerName,
    customerPhone,
    customerEmail,
    notes,
    setDeliveryType,
    setDeliveryDate,
    setDeliveryTime,
    setDeliveryAddress,
    setCustomerName,
    setCustomerPhone,
    setCustomerEmail,
    setNotes,
    addItem,
    removeItem,
    setItemQuantity,
    clearCart,
    getItemQuantity,
    totalItems,
    totalAmount,
    setItemsFromAI,
  };
}
