import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem } from '@/types/order';

interface DbOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_date: string;
  delivery_time: string;
  delivery_type: string;
  delivery_address: string | null;
  notes: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const mapDbOrderToOrder = (dbOrder: DbOrder, items: OrderItem[]): Order => ({
  id: dbOrder.id,
  orderNumber: dbOrder.order_number,
  customerName: dbOrder.customer_name,
  customerPhone: dbOrder.customer_phone,
  customerEmail: dbOrder.customer_email || undefined,
  deliveryDate: dbOrder.delivery_date,
  deliveryTime: dbOrder.delivery_time,
  deliveryType: dbOrder.delivery_type as 'pickup' | 'delivery',
  deliveryAddress: dbOrder.delivery_address || undefined,
  notes: dbOrder.notes || undefined,
  totalAmount: Number(dbOrder.total_amount),
  items,
  createdAt: dbOrder.created_at,
  updatedAt: dbOrder.updated_at,
});

const mapDbItemToOrderItem = (dbItem: DbOrderItem): OrderItem => ({
  id: dbItem.id,
  productId: dbItem.product_id || undefined,
  name: dbItem.product_name,
  quantity: dbItem.quantity,
  price: Number(dbItem.unit_price),
});

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    console.log('[useOrders] fetchOrders called');
    try {
      setLoading(true);
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('[useOrders] fetchOrders error:', ordersError);
        throw ordersError;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*');

      if (itemsError) {
        console.error('[useOrders] fetchOrders items error:', itemsError);
        throw itemsError;
      }

      const mappedOrders = (ordersData || []).map((dbOrder) => {
        const orderItems = (itemsData || [])
          .filter((item) => item.order_id === dbOrder.id)
          .map(mapDbItemToOrderItem);
        return mapDbOrderToOrder(dbOrder as DbOrder, orderItems);
      });

      console.log('[useOrders] fetchOrders success:', mappedOrders.length, 'orders');
      setOrders(mappedOrders);
      setError(null);
    } catch (err) {
      console.error('[useOrders] fetchOrders failed:', err);
      setError('Errore nel caricamento degli ordini');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { orderNumber?: string }) => {
    console.log('[useOrders] addOrder called', { customerName: orderData.customerName, itemsCount: orderData.items.length, orderNumber: orderData.orderNumber });
    try {
      const insertData = {
        order_number: orderData.orderNumber || '',
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_email: orderData.customerEmail || null,
        delivery_date: orderData.deliveryDate,
        delivery_time: orderData.deliveryTime,
        delivery_type: orderData.deliveryType,
        delivery_address: orderData.deliveryAddress || null,
        notes: orderData.notes || null,
        status: 'pending', // Keep for DB compatibility but not used
        total_amount: orderData.totalAmount,
      };

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([insertData])
        .select()
        .single();

      if (orderError) {
        console.error('[useOrders] addOrder error:', orderError);
        throw orderError;
      }

      console.log('[useOrders] addOrder order created:', newOrder.order_number);

      if (orderData.items.length > 0) {
        const itemsToInsert = orderData.items.map((item) => ({
          order_id: newOrder.id,
          product_id: item.productId || null,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('[useOrders] addOrder items error:', itemsError);
          throw itemsError;
        }
        console.log('[useOrders] addOrder items created:', itemsToInsert.length);
      }

      await fetchOrders();
      console.log('[useOrders] addOrder success');
      return newOrder;
    } catch (err) {
      console.error('[useOrders] addOrder failed:', err);
      throw err;
    }
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    console.log('[useOrders] updateOrder called', { id, updates: Object.keys(updates) });
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.customerName) dbUpdates.customer_name = updates.customerName;
      if (updates.customerPhone) dbUpdates.customer_phone = updates.customerPhone;
      if (updates.customerEmail !== undefined) dbUpdates.customer_email = updates.customerEmail || null;
      if (updates.deliveryDate) dbUpdates.delivery_date = updates.deliveryDate;
      if (updates.deliveryTime) dbUpdates.delivery_time = updates.deliveryTime;
      if (updates.deliveryType) dbUpdates.delivery_type = updates.deliveryType;
      if (updates.deliveryAddress !== undefined) dbUpdates.delivery_address = updates.deliveryAddress || null;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
      if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
      if (updates.orderNumber) dbUpdates.order_number = updates.orderNumber;

      const { error: updateError } = await supabase
        .from('orders')
        .update(dbUpdates)
        .eq('id', id);

      if (updateError) {
        console.error('[useOrders] updateOrder error:', updateError);
        throw updateError;
      }

      if (updates.items) {
        await supabase.from('order_items').delete().eq('order_id', id);
        
        const itemsToInsert = updates.items.map((item) => ({
          order_id: id,
          product_id: item.productId || null,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('[useOrders] updateOrder items error:', itemsError);
          throw itemsError;
        }
      }

      await fetchOrders();
      console.log('[useOrders] updateOrder success');
    } catch (err) {
      console.error('[useOrders] updateOrder failed:', err);
      throw err;
    }
  };

  const deleteOrder = async (id: string) => {
    console.log('[useOrders] deleteOrder called', { id });
    try {
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', id);

      if (itemsError) {
        console.error('[useOrders] deleteOrder items error:', itemsError);
        throw itemsError;
      }
      console.log('[useOrders] deleteOrder items deleted');

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useOrders] deleteOrder error:', error);
        throw error;
      }
      console.log('[useOrders] deleteOrder success');
      await fetchOrders();
    } catch (err) {
      console.error('[useOrders] deleteOrder failed:', err);
      throw err;
    }
  };

  const getNextOrderNumber = (): string => {
    console.log('[useOrders] getNextOrderNumber called (legacy)');
    return '100';
  };

  // New function: get next order number for a specific date
  const getNextOrderNumberForDate = (date: string): string => {
    if (!date) return '';
    
    console.log('[useOrders] Getting next order number for date:', date);
    
    // Extract day from date
    const day = date.split('-')[2];
    
    // Filter orders for this specific date
    const ordersForDate = orders.filter(o => o.deliveryDate === date);
    
    if (ordersForDate.length === 0) {
      console.log('[useOrders] No orders for this date, starting from 100');
      return `${day}-100`;
    }
    
    // Find the maximum progressive number for this day
    const maxNumber = Math.max(
      ...ordersForDate.map((o) => {
        // Extract numeric part after hyphen (e.g., "24-101" → 101)
        const parts = o.orderNumber.split('-');
        const lastPart = parts[parts.length - 1];
        return parseInt(lastPart) || 99;
      })
    );
    
    const nextNumber = `${day}-${maxNumber + 1}`;
    console.log('[useOrders] Next order number for date:', nextNumber);
    return nextNumber;
  };

  const getOrderById = (id: string) => {
    return orders.find((order) => order.id === id);
  };

  return {
    orders,
    loading,
    error,
    addOrder,
    updateOrder,
    deleteOrder,
    getOrderById,
    getNextOrderNumber,
    getNextOrderNumberForDate,
    refetch: fetchOrders,
  };
}
