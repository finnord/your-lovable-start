import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  label: string;
  sortOrder: number;
}

interface DbCategory {
  id: string;
  name: string;
  label: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const mapDbCategory = (db: DbCategory): Category => ({
  id: db.id,
  name: db.name,
  label: db.label,
  sortOrder: db.sort_order,
});

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    console.log('[useCategories] fetchCategories called');
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) {
        console.error('[useCategories] fetchCategories error:', fetchError);
        throw fetchError;
      }

      const mapped = (data || []).map(mapDbCategory);
      console.log('[useCategories] fetchCategories success:', mapped.length, 'categories');
      setCategories(mapped);
      setError(null);
    } catch (err) {
      console.error('[useCategories] fetchCategories failed:', err);
      setError('Errore nel caricamento delle categorie');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const updateCategoryOrder = async (id: string, newSortOrder: number) => {
    console.log('[useCategories] updateCategoryOrder called:', id, newSortOrder);
    try {
      const { error: updateError } = await supabase
        .from('categories')
        .update({ sort_order: newSortOrder, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) {
        console.error('[useCategories] updateCategoryOrder error:', updateError);
        throw updateError;
      }
      console.log('[useCategories] updateCategoryOrder success:', id);
    } catch (err) {
      console.error('[useCategories] updateCategoryOrder failed:', err);
      throw err;
    }
  };

  const swapCategories = async (cat1: Category, cat2: Category) => {
    console.log('[useCategories] swapCategories called:', cat1.name, cat2.name);
    try {
      await updateCategoryOrder(cat1.id, cat2.sortOrder);
      await updateCategoryOrder(cat2.id, cat1.sortOrder);
      await fetchCategories();
      console.log('[useCategories] swapCategories success');
    } catch (err) {
      console.error('[useCategories] swapCategories failed:', err);
      throw err;
    }
  };

  const getCategoryLabel = (name: string): string => {
    const cat = categories.find(c => c.name === name);
    return cat?.label || name;
  };

  const getSortedCategoryNames = (): string[] => {
    return categories.map(c => c.name);
  };

  const addCategory = async (data: { name: string; label: string }) => {
    console.log('[useCategories] addCategory called:', data);
    try {
      const maxSort = categories.length > 0 
        ? Math.max(...categories.map(c => c.sortOrder)) 
        : -1;
      
      const { error: insertError } = await supabase
        .from('categories')
        .insert({ 
          name: data.name.toLowerCase().replace(/\s+/g, '_'),
          label: data.label,
          sort_order: maxSort + 1 
        });
      
      if (insertError) {
        console.error('[useCategories] addCategory error:', insertError);
        throw insertError;
      }
      console.log('[useCategories] addCategory success');
      await fetchCategories();
    } catch (err) {
      console.error('[useCategories] addCategory failed:', err);
      throw err;
    }
  };

  const updateCategory = async (id: string, data: { name?: string; label?: string }) => {
    console.log('[useCategories] updateCategory called:', id, data);
    try {
      const { error: updateError } = await supabase
        .from('categories')
        .update({ 
          ...data, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('[useCategories] updateCategory error:', updateError);
        throw updateError;
      }
      console.log('[useCategories] updateCategory success:', id);
      await fetchCategories();
    } catch (err) {
      console.error('[useCategories] updateCategory failed:', err);
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    console.log('[useCategories] deleteCategory called:', id);
    try {
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('[useCategories] deleteCategory error:', deleteError);
        throw deleteError;
      }
      console.log('[useCategories] deleteCategory success:', id);
      await fetchCategories();
    } catch (err) {
      console.error('[useCategories] deleteCategory failed:', err);
      throw err;
    }
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    updateCategoryOrder,
    swapCategories,
    getCategoryLabel,
    getSortedCategoryNames,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
