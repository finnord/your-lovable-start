import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Minus, 
  ShoppingCart, 
  Trash2,
  ChevronDown,
  StickyNote,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { useCategories } from '@/hooks/useCategories';
import { CustomerSelect } from '@/components/CustomerSelect';
import { ProductButton } from '@/components/ui/ProductButton';
import { Product } from '@/types/order';
import { PICKUP_DATES, PICKUP_TIMES } from '@/lib/constants';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function ModificaOrdine() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { products, loading: productsLoading } = useProducts();
  const { orders, loading: ordersLoading, updateOrder, getOrderById } = useOrders();
  const { categories, loading: categoriesLoading, getSortedCategoryNames, getCategoryLabel } = useCategories();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>();
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('12:00');
  const [notes, setNotes] = useState('');
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [initialized, setInitialized] = useState(false);
  
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // Initialize form with existing order data
  useEffect(() => {
    if (!id || ordersLoading || productsLoading || initialized) return;
    
    const order = getOrderById(id);
    if (!order) return;

    console.log('[ModificaOrdine] Loading order:', order.orderNumber);
    
    setOrderNumber(order.orderNumber.replace('ORD-', ''));
    setCustomerName(order.customerName);
    setCustomerPhone(order.customerPhone);
    setDeliveryDate(order.deliveryDate);
    setDeliveryTime(order.deliveryTime);
    setNotes(order.notes || '');

    // Map order items to cart
    const cartItems: CartItem[] = [];
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        cartItems.push({ product, quantity: item.quantity });
      } else {
        // Product not found in catalog, create placeholder
        cartItems.push({
          product: {
            id: item.productId || crypto.randomUUID(),
            name: item.name,
            price: item.price,
            category: 'altro',
            unit: 'porzione',
            available: true,
            sortOrder: 999,
          },
          quantity: item.quantity,
        });
      }
    });
    setCart(cartItems);
    setInitialized(true);
  }, [id, orders, products, ordersLoading, productsLoading, initialized, getOrderById]);

  // Update openCategories when categories load
  useEffect(() => {
    if (categories.length > 0) {
      setOpenCategories(prev => {
        const newState: Record<string, boolean> = {};
        categories.forEach(cat => {
          newState[cat.name] = prev[cat.name] ?? true;
        });
        return newState;
      });
    }
  }, [categories]);

  const sortedCategoryNames = useMemo(() => getSortedCategoryNames(), [categories]);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleCustomerSelect = (customer: { name: string; phone: string }) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
  };

  const handleSubmit = async () => {
    if (!id || !customerName || !customerPhone || !deliveryDate || cart.length === 0) {
      toast({
        title: 'Errore',
        description: 'Compila tutti i campi obbligatori e aggiungi almeno un prodotto',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateOrder(id, {
        customerName,
        customerPhone,
        items: cart.map(item => ({
          id: crypto.randomUUID(),
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
        deliveryDate,
        deliveryTime,
        totalAmount,
        notes: notes || undefined,
      });

      toast({
        title: 'Ordine aggiornato!',
        description: `Ordine #${orderNumber} salvato`,
      });

      navigate('/ordini');
    } catch (error) {
      console.error('[ModificaOrdine] Update failed:', error);
      toast({
        title: 'Errore',
        description: 'Errore nel salvataggio dell\'ordine',
        variant: 'destructive',
      });
    }
  };

  if (productsLoading || categoriesLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const order = id ? getOrderById(id) : null;
  if (!order && initialized) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Ordine non trovato</p>
        <Button onClick={() => navigate('/ordini')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna agli ordini
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* TOP BAR - CSS Grid Layout */}
      <div className="sticky top-0 z-20 bg-background pb-4 space-y-4">
        {/* Row 1: Back + Order Info Grid */}
        <div className="swiss-card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[auto_auto_1fr_auto_auto_auto] gap-4 lg:gap-6 items-end">
            {/* Back Button */}
            <div className="space-y-1.5">
              <span className="uppercase-label block opacity-0 pointer-events-none">Back</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/ordini')}
                className="h-9"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Indietro
              </Button>
            </div>

            {/* Order Number (read-only) */}
            <div className="space-y-1.5">
              <span className="uppercase-label block">Ordine</span>
              <span className="font-mono text-xl font-bold text-primary block h-9 flex items-center">
                #{orderNumber}
              </span>
            </div>

            {/* Customer */}
            <div className="space-y-1.5">
              <span className="uppercase-label block">Cliente</span>
              <CustomerSelect 
                onSelect={handleCustomerSelect}
                selectedCustomerId={selectedCustomerId}
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <span className="uppercase-label block">Data</span>
              <Select value={deliveryDate} onValueChange={setDeliveryDate}>
                <SelectTrigger className="w-full sm:w-[130px] h-9">
                  <SelectValue placeholder="Data" />
                </SelectTrigger>
                <SelectContent>
                  {PICKUP_DATES.map(date => (
                    <SelectItem key={date.value} value={date.value}>
                      {date.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time */}
            <div className="space-y-1.5">
              <span className="uppercase-label block">Ora</span>
              <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                <SelectTrigger className="w-full sm:w-[100px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PICKUP_TIMES.map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <span className="uppercase-label block">Note</span>
              <Button
                size="sm"
                variant={notes ? 'default' : 'outline'}
                className="h-9 w-9 p-0 relative"
                onClick={() => setNotesDialogOpen(true)}
                title={notes ? 'Modifica note' : 'Aggiungi note'}
              >
                <StickyNote className="w-4 h-4" />
                {notes && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Row 2: Cart */}
        <div className="swiss-card p-5">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <span className="uppercase-label flex items-center gap-2">
              <ShoppingCart className="w-3.5 h-3.5" /> Carrello
            </span>
            {cart.length > 0 && (
              <span className="text-xs font-mono text-muted-foreground">
                {cart.length} prodotti
              </span>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Carrello vuoto — seleziona prodotti
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/30 border border-border rounded">
                  <span className="text-sm font-medium truncate flex-1">{item.product.name}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => updateQuantity(item.product.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-5 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => updateQuantity(item.product.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-5 border-t border-border mt-5">
            <Button
              className="w-full h-12 text-sm font-semibold uppercase tracking-wider"
              onClick={handleSubmit}
              disabled={cart.length === 0 || !customerName || !customerPhone || !deliveryDate}
            >
              Salva Modifiche
            </Button>
          </div>
        </div>
      </div>

      {/* PRODUCTS SECTION */}
      <section className="space-y-3 mt-6">
        <p className="uppercase-label mb-4">Prodotti</p>
        {sortedCategoryNames.map(categoryName => {
          const categoryProducts = products.filter(p => p.category === categoryName && p.available);
          const isOpen = openCategories[categoryName] ?? false;
          
          if (categoryProducts.length === 0) return null;
          
          return (
            <Collapsible key={categoryName} open={isOpen} onOpenChange={() => toggleCategory(categoryName)}>
              <div className="border border-border rounded">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">
                        {getCategoryLabel(categoryName)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {categoryProducts.length}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 pt-0 border-t border-border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 pt-4">
                      {categoryProducts.map(product => (
                        <ProductButton
                          key={product.id}
                          product={product}
                          onClick={() => addToCart(product)}
                        />
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </section>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Note Ordine</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Aggiungi note per questo ordine..."
              rows={6}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setNotesDialogOpen(false)}>
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}