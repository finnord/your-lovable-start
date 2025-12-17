import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/order';

interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  unit: string;
  available: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

const mapDbProductToProduct = (dbProduct: DbProduct): Product => ({
  id: dbProduct.id,
  name: dbProduct.name,
  description: dbProduct.description || undefined,
  price: Number(dbProduct.price),
  category: dbProduct.category,
  unit: dbProduct.unit,
  available: dbProduct.available,
  sortOrder: dbProduct.sort_order || 0,
});

interface ProductUpdate {
  name?: string;
  category?: string;
  unit?: string;
  price?: number;
  description?: string | null;
  available?: boolean;
}

interface ProductInsert {
  name: string;
  category: string;
  unit: string;
  price: number;
  description?: string | null;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (includeUnavailable = false) => {
    console.log('[useProducts] fetchProducts called');
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (!includeUnavailable) {
        query = query.eq('available', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('[useProducts] fetchProducts error:', fetchError);
        throw fetchError;
      }

      console.log('[useProducts] fetchProducts success:', data?.length, 'products');
      setProducts((data || []).map(mapDbProductToProduct));
      setError(null);
    } catch (err) {
      console.error('[useProducts] fetchProducts failed:', err);
      setError('Errore nel caricamento dei prodotti');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    console.log('[useProducts] fetchAllProducts called');
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) {
        console.error('[useProducts] fetchAllProducts error:', fetchError);
        throw fetchError;
      }

      console.log('[useProducts] fetchAllProducts success:', data?.length, 'products');
      setProducts((data || []).map(mapDbProductToProduct));
      setError(null);
    } catch (err) {
      console.error('[useProducts] fetchAllProducts failed:', err);
      setError('Errore nel caricamento dei prodotti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const updateProduct = async (id: string, updates: ProductUpdate) => {
    console.log('[useProducts] updateProduct called:', id, updates);
    try {
      const { error: updateError } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error('[useProducts] updateProduct error:', updateError);
        throw updateError;
      }

      console.log('[useProducts] updateProduct success:', id);
    } catch (err) {
      console.error('[useProducts] updateProduct failed:', err);
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    console.log('[useProducts] deleteProduct called:', id);
    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('[useProducts] deleteProduct error:', deleteError);
        throw deleteError;
      }

      console.log('[useProducts] deleteProduct success:', id);
    } catch (err) {
      console.error('[useProducts] deleteProduct failed:', err);
      throw err;
    }
  };

  const addProduct = async (product: ProductInsert) => {
    console.log('[useProducts] addProduct called:', product.name);
    try {
      // Get max sort_order for category
      const { data: maxData } = await supabase
        .from('products')
        .select('sort_order')
        .eq('category', product.category)
        .order('sort_order', { ascending: false })
        .limit(1);

      const newSortOrder = (maxData?.[0]?.sort_order || 0) + 1;

      const { error: insertError } = await supabase
        .from('products')
        .insert({
          ...product,
          sort_order: newSortOrder,
          available: true,
        });

      if (insertError) {
        console.error('[useProducts] addProduct error:', insertError);
        throw insertError;
      }

      console.log('[useProducts] addProduct success:', product.name);
    } catch (err) {
      console.error('[useProducts] addProduct failed:', err);
      throw err;
    }
  };

  const updateProductOrder = async (id: string, newSortOrder: number) => {
    console.log('[useProducts] updateProductOrder called:', id, newSortOrder);
    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({ sort_order: newSortOrder })
        .eq('id', id);

      if (updateError) {
        console.error('[useProducts] updateProductOrder error:', updateError);
        throw updateError;
      }

      console.log('[useProducts] updateProductOrder success:', id);
    } catch (err) {
      console.error('[useProducts] updateProductOrder failed:', err);
      throw err;
    }
  };

  const getProductsByCategory = (category: string) => {
    return products.filter((p) => p.category === category && p.available);
  };

  const categories = [...new Set(products.filter(p => p.available).map((p) => p.category))];

  return {
    products,
    loading,
    error,
    categories,
    getProductsByCategory,
    refetch: fetchAllProducts,
    updateProduct,
    deleteProduct,
    addProduct,
    updateProductOrder,
  };
}
