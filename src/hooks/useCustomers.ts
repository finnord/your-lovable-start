import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizePhone, phonesMatch } from '@/lib/phone-utils';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  created_at: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingCustomer: Customer | null;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    console.log('[useCustomers] fetchCustomers called');
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('[useCustomers] fetchCustomers error:', error);
        return;
      }
      
      console.log('[useCustomers] fetchCustomers success:', data?.length, 'customers');
      setCustomers(data || []);
    } catch (err) {
      console.error('[useCustomers] fetchCustomers failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  /**
   * Check if a phone number already exists in the database
   * Returns the existing customer if found
   */
  const checkDuplicatePhone = (phone: string): DuplicateCheckResult => {
    const normalizedInput = normalizePhone(phone);
    console.log('[useCustomers] checkDuplicatePhone called', { phone, normalizedInput });
    
    const existingCustomer = customers.find(c => phonesMatch(c.phone, phone));
    
    if (existingCustomer) {
      console.log('[useCustomers] checkDuplicatePhone: DUPLICATE FOUND', existingCustomer);
      return { isDuplicate: true, existingCustomer };
    }
    
    console.log('[useCustomers] checkDuplicatePhone: no duplicate');
    return { isDuplicate: false, existingCustomer: null };
  };

  /**
   * Find customers with similar name (for additional warnings)
   */
  const findSimilarCustomers = (name: string): Customer[] => {
    const normalizedName = name.toLowerCase().trim();
    console.log('[useCustomers] findSimilarCustomers called', { name: normalizedName });
    
    return customers.filter(c => 
      c.name.toLowerCase().trim() === normalizedName
    );
  };

  const addCustomer = async (name: string, phone: string): Promise<Customer | null> => {
    console.log('[useCustomers] addCustomer called', { name, phone });
    
    // Normalize phone before saving
    const normalizedPhone = normalizePhone(phone);
    
    // Double-check for duplicates (belt and suspenders with DB constraint)
    const { isDuplicate, existingCustomer } = checkDuplicatePhone(phone);
    if (isDuplicate) {
      console.warn('[useCustomers] addCustomer BLOCKED: duplicate phone detected', existingCustomer);
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({ name, phone: normalizedPhone })
        .select()
        .single();
      
      if (error) {
        // Check if it's a unique constraint violation
        if (error.code === '23505') {
          console.error('[useCustomers] addCustomer error: DUPLICATE PHONE (DB constraint)', error);
        } else {
          console.error('[useCustomers] addCustomer error:', error);
        }
        return null;
      }
      
      console.log('[useCustomers] addCustomer success:', data);
      setCustomers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    } catch (err) {
      console.error('[useCustomers] addCustomer failed:', err);
      return null;
    }
  };

  const updateCustomer = async (id: string, name: string, phone: string): Promise<Customer | null> => {
    console.log('[useCustomers] updateCustomer called', { id, name, phone });
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({ name, phone })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('[useCustomers] updateCustomer error:', error);
        return null;
      }
      
      console.log('[useCustomers] updateCustomer success:', data);
      setCustomers(prev => 
        prev.map(c => c.id === id ? data : c).sort((a, b) => a.name.localeCompare(b.name))
      );
      return data;
    } catch (err) {
      console.error('[useCustomers] updateCustomer failed:', err);
      return null;
    }
  };

  const deleteCustomer = async (id: string): Promise<boolean> => {
    console.log('[useCustomers] deleteCustomer called', { id });
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('[useCustomers] deleteCustomer error:', error);
        return false;
      }
      
      console.log('[useCustomers] deleteCustomer success');
      setCustomers(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      console.error('[useCustomers] deleteCustomer failed:', err);
      return false;
    }
  };

  const hasOrders = async (phone: string): Promise<boolean> => {
    console.log('[useCustomers] hasOrders called', { phone });
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_phone', phone);
      
      if (error) {
        console.error('[useCustomers] hasOrders error:', error);
        return false;
      }
      
      const result = (count || 0) > 0;
      console.log('[useCustomers] hasOrders result:', result);
      return result;
    } catch (err) {
      console.error('[useCustomers] hasOrders failed:', err);
      return false;
    }
  };

  return { 
    customers, 
    loading, 
    addCustomer, 
    updateCustomer,
    deleteCustomer,
    hasOrders,
    checkDuplicatePhone,
    findSimilarCustomers,
    refetch: fetchCustomers 
  };
}
