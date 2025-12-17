import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Minus, 
  ShoppingCart, 
  Trash2,
  ChevronDown,
  StickyNote,
  Plus,
  Camera,
  Upload,
  Loader2,
  Check,
  X,
  AlertCircle
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { useCategories } from '@/hooks/useCategories';
import { CustomerSelect } from '@/components/CustomerSelect';
import { ProductButton } from '@/components/ui/ProductButton';
import { Product } from '@/types/order';
import { PICKUP_DATES, PICKUP_TIMES } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  product: Product;
  quantity: number;
}

interface AnalyzedItem {
  product: string;
  quantity: number;
  confidence: 'high' | 'medium' | 'low';
  matchedProduct?: Product;
  selected: boolean;
}

export default function NuovoOrdine() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products, loading: productsLoading } = useProducts();
  const { addOrder, getNextOrderNumberForDate } = useOrders();
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
  
  // Tutte le categorie aperte di default
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  
  // Import foto state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analyzedItems, setAnalyzedItems] = useState<AnalyzedItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisNotes, setAnalysisNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<'idle' | 'uploading' | 'analyzing' | 'processing'>('idle');
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate order number when date changes
  useEffect(() => {
    if (deliveryDate) {
      const nextOrderNumber = getNextOrderNumberForDate(deliveryDate);
      setOrderNumber(nextOrderNumber);
      console.log('[NuovoOrdine] Auto-generated order number:', nextOrderNumber);
    } else {
      setOrderNumber('');
    }
  }, [deliveryDate, getNextOrderNumberForDate]);

  // Update openCategories when categories load
  useEffect(() => {
    if (categories.length > 0) {
      setOpenCategories(prev => {
        const newState: Record<string, boolean> = {};
        categories.forEach(cat => {
          newState[cat.name] = prev[cat.name] ?? true; // default to open
        });
        return newState;
      });
    }
  }, [categories]);

  // Timer for analysis progress
  useEffect(() => {
    if (analysisPhase !== 'idle' && analysisStartTime) {
      const interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - analysisStartTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(0);
    }
  }, [analysisPhase, analysisStartTime]);

  // Usa l'ordine delle categorie dal database
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

  // === IMPORT FOTO FUNCTIONS ===
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      setAnalyzedItems([]);
      setAnalysisNotes('');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setUploadedImage(event.target?.result as string);
          setAnalyzedItems([]);
          setAnalysisNotes('');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const analyzePhoto = async () => {
    if (!uploadedImage) return;
    
    setIsAnalyzing(true);
    setAnalyzedItems([]);
    setAnalysisNotes('');
    setAnalysisStartTime(Date.now());
    setAnalysisPhase('uploading');
    
    try {
      console.log('[NuovoOrdine] Analyzing photo...');
      
      setAnalysisPhase('analyzing');
      const { data, error } = await supabase.functions.invoke('analyze-menu-photo', {
        body: { 
          image: uploadedImage,
          products: products.map(p => ({ name: p.name, unit: p.unit }))
        }
      });

      if (error) throw error;
      
      setAnalysisPhase('processing');
      console.log('[NuovoOrdine] Analysis result:', data);
      
      if (data.items && Array.isArray(data.items)) {
        const itemsWithMatches: AnalyzedItem[] = data.items.map((item: { product: string; quantity: number; confidence: string }) => {
          // Fuzzy match product name
          const matchedProduct = products.find(p => 
            p.name.toLowerCase() === item.product.toLowerCase() ||
            p.name.toLowerCase().includes(item.product.toLowerCase()) ||
            item.product.toLowerCase().includes(p.name.toLowerCase())
          );
          
          return {
            product: item.product,
            quantity: item.quantity || 1,
            confidence: (item.confidence || 'medium') as 'high' | 'medium' | 'low',
            matchedProduct,
            selected: !!matchedProduct // Auto-select if matched
          };
        });
        
        setAnalyzedItems(itemsWithMatches);
      }
      
      if (data.notes) {
        setAnalysisNotes(data.notes);
      }
      
      toast({
        title: 'Analisi completata',
        description: `Trovati ${data.items?.length || 0} prodotti`,
      });
    } catch (error) {
      console.error('[NuovoOrdine] Analysis error:', error);
      toast({
        title: 'Errore analisi',
        description: error instanceof Error ? error.message : 'Errore durante l\'analisi',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisPhase('idle');
      setAnalysisStartTime(null);
    }
  };

  const toggleItemSelection = (index: number) => {
    setAnalyzedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const addSelectedToCart = () => {
    const selectedItems = analyzedItems.filter(item => item.selected && item.matchedProduct);
    
    selectedItems.forEach(item => {
      if (item.matchedProduct) {
        // Add to cart with quantity
        setCart(prev => {
          const existing = prev.find(cartItem => cartItem.product.id === item.matchedProduct!.id);
          if (existing) {
            return prev.map(cartItem => 
              cartItem.product.id === item.matchedProduct!.id 
                ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                : cartItem
            );
          }
          return [...prev, { product: item.matchedProduct!, quantity: item.quantity }];
        });
      }
    });
    
    toast({
      title: 'Prodotti aggiunti',
      description: `${selectedItems.length} prodotti aggiunti al carrello`,
    });
    
    // Reset and close
    setImportDialogOpen(false);
    setUploadedImage(null);
    setAnalyzedItems([]);
    setAnalysisNotes('');
  };

  const resetImport = () => {
    setUploadedImage(null);
    setAnalyzedItems([]);
    setAnalysisNotes('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!customerName || !customerPhone || !deliveryDate || cart.length === 0 || !orderNumber) {
      toast({
        title: 'Errore',
        description: 'Compila tutti i campi obbligatori e aggiungi almeno un prodotto',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addOrder({
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
        deliveryType: 'pickup',
        totalAmount,
        notes: notes || undefined,
        orderNumber, // Already in DD-XXX format from auto-generation
      });

      toast({
        title: 'Ordine creato!',
        description: `Ordine #${orderNumber} per ${customerName}`,
      });

      navigate('/ordini');
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Errore nella creazione dell\'ordine',
        variant: 'destructive',
      });
    }
  };

  if (productsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* TOP BAR - CSS Grid Layout */}
      <div className="sticky top-0 z-20 bg-background pb-4 space-y-4">
        {/* Row 1: Order Info Grid - Label sempre sopra il controllo */}
        <div className="swiss-card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 lg:gap-6 items-end">
            {/* Order Number */}
            <div className="space-y-1.5">
              <span className="uppercase-label block">Ordine</span>
              {orderNumber ? (
                <span className="font-mono text-xl font-bold text-primary block h-9 flex items-center">
                  #{orderNumber}
                </span>
              ) : (
                <span className="font-mono text-sm text-muted-foreground italic block h-9 flex items-center">
                  Seleziona data
                </span>
              )}
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

            {/* Import Photo BETA */}
            <div className="space-y-1.5">
              <span className="uppercase-label block">Importa</span>
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-3 relative"
                onClick={() => setImportDialogOpen(true)}
                title="Importa ordine da foto"
              >
                <Camera className="w-4 h-4 mr-1" />
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 ml-1">
                  BETA
                </Badge>
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
              disabled={cart.length === 0 || !customerName || !customerPhone || !deliveryDate || !orderNumber}
            >
              Crea Ordine
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

      {/* Import Photo Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        setImportDialogOpen(open);
        if (!open) resetImport();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Importa Ordine da Foto
              <Badge variant="secondary" className="text-xs">BETA</Badge>
            </DialogTitle>
            <DialogDescription>
              Carica una foto del menù compilato e l'AI identificherà i prodotti selezionati
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Upload Section */}
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {!uploadedImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clicca o trascina per caricare una foto
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    JPG, PNG o WEBP
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <img 
                      src={uploadedImage} 
                      alt="Menu caricato" 
                      className="w-full max-h-[250px] object-contain rounded-lg border border-border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      onClick={resetImport}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4 bg-muted/30 rounded-lg border border-border">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <div className="text-center space-y-1">
                        <p className="font-medium text-sm">
                          {analysisPhase === 'uploading' && 'Caricamento immagine...'}
                          {analysisPhase === 'analyzing' && 'Analisi AI in corso...'}
                          {analysisPhase === 'processing' && 'Elaborazione risultati...'}
                        </p>
                        {elapsedSeconds > 0 && (
                          <p className="text-sm font-mono text-muted-foreground">
                            {elapsedSeconds} secondi
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Button 
                      onClick={analyzePhoto} 
                      className="w-full"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Analizza Foto
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Analysis Results */}
            {analyzedItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="uppercase-label">Prodotti Rilevati</span>
                  <span className="text-xs text-muted-foreground">
                    {analyzedItems.filter(i => i.selected).length} selezionati
                  </span>
                </div>
                
                <div className="border border-border rounded-lg divide-y divide-border max-h-[200px] overflow-y-auto">
                  {analyzedItems.map((item, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-3 p-3 ${item.matchedProduct ? 'bg-card' : 'bg-destructive/5'}`}
                    >
                      <Checkbox
                        checked={item.selected}
                        disabled={!item.matchedProduct}
                        onCheckedChange={() => toggleItemSelection(index)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {item.matchedProduct?.name || item.product}
                          </span>
                          {!item.matchedProduct && (
                            <span className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Non trovato
                            </span>
                          )}
                        </div>
                        {item.matchedProduct && (
                          <span className="text-xs text-muted-foreground">
                            {item.matchedProduct.unit}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">
                          ×{item.quantity}
                        </span>
                        <Badge 
                          variant={
                            item.confidence === 'high' ? 'default' : 
                            item.confidence === 'medium' ? 'secondary' : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {item.confidence === 'high' ? '✓' : 
                           item.confidence === 'medium' ? '~' : '?'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {analysisNotes && (
                  <p className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded">
                    {analysisNotes}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Annulla
            </Button>
            {analyzedItems.length > 0 && (
              <Button 
                onClick={addSelectedToCart}
                disabled={analyzedItems.filter(i => i.selected && i.matchedProduct).length === 0}
              >
                <Check className="w-4 h-4 mr-2" />
                Aggiungi {analyzedItems.filter(i => i.selected && i.matchedProduct).length} al Carrello
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}