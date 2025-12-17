import { useState } from 'react';
import { Pencil, Trash2, Plus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useCategories, Category } from '@/hooks/useCategories';
import { Product } from '@/types/order';
import { SortableList, CategoryItem, ProductItem } from '@/components/menu';
import { arrayMove } from '@dnd-kit/sortable';
import { PageWrapper } from '@/components/ui/PageWrapper';

const UNITS = [
  { value: 'etto', label: 'Etto' },
  { value: 'pezzo', label: 'Pezzo' },
  { value: 'porzione', label: 'Porzione' },
];

interface ProductForm {
  name: string;
  category: string;
  unit: string;
  price: string;
  description: string;
}

interface CategoryForm {
  name: string;
  label: string;
}

export default function GestioneMenu() {
  const { toast } = useToast();
  const { products, loading: productsLoading, updateProduct, deleteProduct, addProduct, updateProductOrder, refetch } = useProducts();
  const { categories, loading: categoriesLoading, updateCategoryOrder, addCategory, updateCategory, deleteCategory, refetch: refetchCategories } = useCategories();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>({
    name: '',
    category: '',
    unit: '',
    price: '',
    description: '',
  });

  // Category CRUD state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ name: '', label: '' });
  const [isEditingCategory, setIsEditingCategory] = useState(false);

  // Expanded categories state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(categories.map(c => c.id)));

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Handle category reorder via drag & drop
  const handleCategoryReorder = async (oldIndex: number, newIndex: number) => {
    const reorderedCategories = arrayMove(categories, oldIndex, newIndex);
    
    try {
      // Update sort_order for all affected categories
      for (let i = 0; i < reorderedCategories.length; i++) {
        if (reorderedCategories[i].sortOrder !== i) {
          await updateCategoryOrder(reorderedCategories[i].id, i);
        }
      }
      await refetchCategories();
      toast({ title: 'Ordine categorie aggiornato' });
    } catch {
      toast({ title: 'Errore', description: 'Impossibile riordinare le categorie', variant: 'destructive' });
    }
  };

  // Handle product reorder via drag & drop
  const handleProductReorder = async (categoryName: string, oldIndex: number, newIndex: number) => {
    const categoryProducts = products.filter(p => p.category === categoryName);
    const reorderedProducts = arrayMove(categoryProducts, oldIndex, newIndex);
    
    try {
      // Update sort_order for all affected products
      for (let i = 0; i < reorderedProducts.length; i++) {
        if (reorderedProducts[i].sortOrder !== i) {
          await updateProductOrder(reorderedProducts[i].id, i);
        }
      }
      await refetch();
      toast({ title: 'Ordine prodotti aggiornato' });
    } catch {
      toast({ title: 'Errore', description: 'Impossibile riordinare i prodotti', variant: 'destructive' });
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      price: product.price.toString(),
      description: product.description || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct || !editForm.name || !editForm.category || !editForm.unit) {
      toast({ title: 'Errore', description: 'Compila tutti i campi obbligatori', variant: 'destructive' });
      return;
    }

    try {
      await updateProduct(selectedProduct.id, {
        name: editForm.name,
        category: editForm.category,
        unit: editForm.unit,
        price: parseFloat(editForm.price) || 0,
        description: editForm.description || null,
      });
      toast({ title: 'Prodotto aggiornato' });
      setEditDialogOpen(false);
      refetch();
    } catch {
      toast({ title: 'Errore', description: 'Impossibile aggiornare il prodotto', variant: 'destructive' });
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      await deleteProduct(selectedProduct.id);
      toast({ title: 'Prodotto eliminato' });
      setDeleteDialogOpen(false);
      refetch();
    } catch {
      toast({ title: 'Errore', description: 'Impossibile eliminare il prodotto', variant: 'destructive' });
    }
  };

  const handleToggleAvailable = async (productId: string, available: boolean) => {
    try {
      await updateProduct(productId, { available });
      refetch();
    } catch {
      toast({ title: 'Errore', description: 'Impossibile aggiornare lo stato', variant: 'destructive' });
    }
  };

  const handleAddProduct = async () => {
    if (!editForm.name || !editForm.category || !editForm.unit) {
      toast({ title: 'Errore', description: 'Compila tutti i campi obbligatori', variant: 'destructive' });
      return;
    }

    try {
      await addProduct({
        name: editForm.name,
        category: editForm.category,
        unit: editForm.unit,
        price: parseFloat(editForm.price) || 0,
        description: editForm.description || null,
      });
      toast({ title: 'Prodotto aggiunto' });
      setAddDialogOpen(false);
      setEditForm({ name: '', category: '', unit: '', price: '', description: '' });
      refetch();
    } catch {
      toast({ title: 'Errore', description: 'Impossibile aggiungere il prodotto', variant: 'destructive' });
    }
  };

  // Category CRUD handlers
  const handleAddCategory = () => {
    setIsEditingCategory(false);
    setSelectedCategory(null);
    setCategoryForm({ name: '', label: '' });
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (cat: Category) => {
    setIsEditingCategory(true);
    setSelectedCategory(cat);
    setCategoryForm({ name: cat.name, label: cat.label });
    setCategoryDialogOpen(true);
  };

  const handleDeleteCategoryClick = (cat: Category) => {
    setSelectedCategory(cat);
    setCategoryDeleteDialogOpen(true);
  };

  // Genera identificatore consistente dal label
  const generateCategoryName = (label: string): string => {
    return label
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.label.trim()) {
      toast({ title: 'Errore', description: 'Inserisci un nome per la categoria', variant: 'destructive' });
      return;
    }

    try {
      if (isEditingCategory && selectedCategory) {
        // In modifica, aggiorna SOLO il label, MAI il name
        await updateCategory(selectedCategory.id, {
          label: categoryForm.label,
        });
        toast({ title: 'Categoria aggiornata' });
      } else {
        // In creazione, genera automaticamente il name dal label
        const generatedName = generateCategoryName(categoryForm.label);
        await addCategory({
          label: categoryForm.label,
          name: generatedName,
        });
        toast({ title: 'Categoria aggiunta' });
      }
      setCategoryDialogOpen(false);
      refetchCategories();
    } catch {
      toast({ title: 'Errore', description: 'Impossibile salvare la categoria', variant: 'destructive' });
    }
  };

  const confirmDeleteCategory = async () => {
    if (!selectedCategory) return;

    const categoryProducts = products.filter(p => p.category === selectedCategory.name);
    if (categoryProducts.length > 0) {
      toast({ 
        title: 'Impossibile eliminare', 
        description: `Questa categoria contiene ${categoryProducts.length} prodotti. Rimuovili prima.`, 
        variant: 'destructive' 
      });
      setCategoryDeleteDialogOpen(false);
      return;
    }

    try {
      await deleteCategory(selectedCategory.id);
      toast({ title: 'Categoria eliminata' });
      setCategoryDeleteDialogOpen(false);
      refetchCategories();
    } catch {
      toast({ title: 'Errore', description: 'Impossibile eliminare la categoria', variant: 'destructive' });
    }
  };

  // Get products for a category
  const getProductsForCategory = (categoryName: string) => {
    return products.filter(p => p.category === categoryName);
  };

  const loading = productsLoading || categoriesLoading;
  const hasError = !loading && products.length === 0 && categories.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Errore nel caricamento dei dati</p>
        <Button onClick={() => { refetch(); refetchCategories(); }}>
          Riprova
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <PageWrapper className="max-w-5xl">
        <header className="flex items-start justify-between">
          <div>
            <p className="uppercase-label mb-3">Configurazione</p>
            <h1 className="swiss-display text-foreground">GESTIONE MENU</h1>
            <p className="text-muted-foreground mt-2">
              Trascina per riordinare categorie e prodotti
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAddCategory}>
              <Plus className="w-4 h-4 mr-2" />
              Nuova Categoria
            </Button>
            <Button onClick={() => { 
              setEditForm({ name: '', category: categories[0]?.name || 'antipasti', unit: 'porzione', price: '', description: '' }); 
              setAddDialogOpen(true); 
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Prodotto
            </Button>
          </div>
        </header>

        {/* Categories with nested products - all draggable */}
        <section>
          <p className="uppercase-label mb-6">Categorie e Prodotti</p>
          
          <SortableList
            items={categories}
            keyExtractor={(c) => c.id}
            onReorder={handleCategoryReorder}
            className="space-y-4"
            renderItem={(category) => (
              <CategoryItem
                key={category.id}
                category={category}
                productCount={getProductsForCategory(category.name).length}
                isExpanded={expandedCategories.has(category.id)}
                onToggle={() => toggleCategoryExpanded(category.id)}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategoryClick}
              >
                {getProductsForCategory(category.name).length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground italic">
                    Nessun prodotto in questa categoria
                  </p>
                ) : (
                  <SortableList
                    items={getProductsForCategory(category.name)}
                    keyExtractor={(p) => p.id}
                    onReorder={(oldIdx, newIdx) => handleProductReorder(category.name, oldIdx, newIdx)}
                    className=""
                    renderItem={(product) => (
                      <ProductItem
                        key={product.id}
                        product={product}
                        onEdit={handleEditProduct}
                        onDelete={handleDeleteProduct}
                        onToggleAvailable={handleToggleAvailable}
                      />
                    )}
                  />
                )}
              </CategoryItem>
            )}
          />
        </section>

        {/* Edit Product Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Prodotto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="uppercase-label">Nome *</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="uppercase-label">Categoria *</label>
                  <Select value={editForm.category} onValueChange={(v) => setEditForm(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.name} value={c.name}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="uppercase-label">Unità *</label>
                  <Select value={editForm.unit} onValueChange={(v) => setEditForm(prev => ({ ...prev, unit: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map(u => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="uppercase-label">Prezzo (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="uppercase-label">Descrizione</label>
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" /> Annulla
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save className="w-4 h-4 mr-2" /> Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Product Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aggiungi Prodotto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="uppercase-label">Nome *</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="uppercase-label">Categoria *</label>
                  <Select value={editForm.category} onValueChange={(v) => setEditForm(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.name} value={c.name}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="uppercase-label">Unità *</label>
                  <Select value={editForm.unit} onValueChange={(v) => setEditForm(prev => ({ ...prev, unit: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map(u => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="uppercase-label">Prezzo (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="uppercase-label">Descrizione</label>
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" /> Annulla
              </Button>
              <Button onClick={handleAddProduct}>
                <Plus className="w-4 h-4 mr-2" /> Aggiungi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Product Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminare questo prodotto?</AlertDialogTitle>
              <AlertDialogDescription>
                Stai per eliminare "{selectedProduct?.name}". Questa azione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Category Add/Edit Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditingCategory ? 'Modifica Categoria' : 'Aggiungi Categoria'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="uppercase-label">Nome visualizzato *</label>
                <Input
                  placeholder="es. Primi Piatti"
                  value={categoryForm.label}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, label: e.target.value }))}
                />
              </div>
              {isEditingCategory ? (
                <div className="space-y-2">
                  <label className="uppercase-label">Identificatore</label>
                  <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md font-mono">
                    {categoryForm.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    L'identificatore non può essere modificato per evitare inconsistenze con i prodotti.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="uppercase-label">Identificatore (anteprima)</label>
                  <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md font-mono">
                    {categoryForm.label.trim() 
                      ? categoryForm.label.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') 
                      : 'auto-generato dal nome'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Generato automaticamente dal nome visualizzato.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" /> Annulla
              </Button>
              <Button onClick={handleSaveCategory}>
                <Save className="w-4 h-4 mr-2" /> Salva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category Delete Confirmation */}
        <AlertDialog open={categoryDeleteDialogOpen} onOpenChange={setCategoryDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminare questa categoria?</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedCategory && products.filter(p => p.category === selectedCategory.name).length > 0
                  ? `Attenzione: questa categoria contiene ${products.filter(p => p.category === selectedCategory.name).length} prodotti. Rimuovili prima di eliminare la categoria.`
                  : 'Questa azione non può essere annullata.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteCategory} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageWrapper>
    </TooltipProvider>
  );
}
