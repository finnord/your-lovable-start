import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePublicCart } from '@/hooks/usePublicCart';
import { MenuGrid, CartSummary, DeliveryStep, CustomerStep, ConfirmStep } from '@/components/order-public';
import { AIChatbot } from '@/components/AIChatbot';

type Step = 'menu' | 'delivery' | 'customer' | 'confirm';
const STEPS: Step[] = ['menu', 'delivery', 'customer', 'confirm'];

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  description: string | null;
  category: string;
}

interface Category {
  name: string;
  label: string;
}

export default function PublicOrder() {
  const [step, setStep] = useState<Step>('menu');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const cart = usePublicCart();

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').eq('available', true).order('sort_order'),
        supabase.from('categories').select('*').order('sort_order'),
      ]);

      if (productsRes.data) {
        setProducts(productsRes.data as Product[]);
      }
      if (categoriesRes.data) {
        setCategories(categoriesRes.data as Category[]);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const currentStepIndex = STEPS.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case 'menu': return cart.totalItems > 0;
      case 'delivery': return cart.deliveryDate && cart.deliveryTime && 
        (cart.deliveryType === 'ritiro' || cart.deliveryAddress.trim());
      case 'customer': return cart.customerName.trim() && cart.customerPhone.trim();
      default: return true;
    }
  };

  const nextStep = () => {
    if (step === 'menu') setStep('delivery');
    else if (step === 'delivery') setStep('customer');
    else if (step === 'customer') setStep('confirm');
  };

  const prevStep = () => {
    if (step === 'delivery') setStep('menu');
    else if (step === 'customer') setStep('delivery');
    else if (step === 'confirm') setStep('customer');
  };

  const handleSubmit = async () => {
    if (!cart.deliveryDate || !cart.deliveryTime) return;

    setIsSubmitting(true);

    try {
      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: cart.customerName.trim(),
          customer_phone: cart.customerPhone.trim(),
          customer_email: cart.customerEmail.trim() || null,
          delivery_date: format(cart.deliveryDate, 'yyyy-MM-dd'),
          delivery_time: cart.deliveryTime,
          delivery_type: cart.deliveryType,
          delivery_address: cart.deliveryType === 'consegna' ? cart.deliveryAddress.trim() : null,
          notes: cart.notes.trim() || null,
          total_amount: cart.totalAmount,
          status: 'pending',
        })
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.items.map(item => ({
        order_id: orderData.id,
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setOrderNumber(orderData.order_number);
      setIsComplete(true);
      cart.clearCart();
      toast.success('Ordine inviato con successo!');

    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Errore durante l\'invio dell\'ordine. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = (product: Product) => {
    cart.addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
    });
  };

  const handleAIItems = (items: Array<{ productId: string; name: string; price: number; unit: string; quantity: number }>) => {
    cart.setItemsFromAI(items);
  };

  // Success screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="py-8 px-6">
          <h1 className="text-[2.5rem] md:text-[4rem] leading-none font-bold tracking-tighter text-center uppercase">
            MARE MIO
          </h1>
          <p className="text-center text-muted-foreground mt-2 text-lg">Menù di Natale</p>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 pb-16">
          <div className="text-center space-y-8 max-w-md w-full">
            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto border-2 border-green-500/20">
              <Check className="w-12 h-12 text-green-500" />
            </div>

            <div className="space-y-4">
              <h2 className="text-[2rem] leading-tight font-bold tracking-tight uppercase">
                Ordine Ricevuto!
              </h2>
              <p className="text-lg text-muted-foreground">
                Ti chiameremo per confermare
              </p>
            </div>

            <div className="bg-card border-2 border-border p-6 space-y-4">
              <div className="text-[3rem] font-bold text-primary tracking-tight">
                #{orderNumber}
              </div>
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-sm uppercase tracking-widest text-muted-foreground">Data</span>
                  <span className="font-medium text-lg">
                    {cart.deliveryDate && format(cart.deliveryDate, "d MMMM", { locale: it })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-sm uppercase tracking-widest text-muted-foreground">Orario</span>
                  <span className="font-medium text-lg font-mono">{cart.deliveryTime}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm uppercase tracking-widest text-muted-foreground">Totale</span>
                  <span className="font-bold text-xl text-primary">€{cart.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground">
              Grazie per aver scelto Mare Mio! 🐟
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      {/* Header */}
      <header className="py-6 px-6 sticky top-0 bg-background/95 backdrop-blur z-30 border-b border-border/30">
        <h1 className="text-[2rem] md:text-[3rem] leading-none font-bold tracking-tighter text-center uppercase">
          MARE MIO
        </h1>
        <p className="text-center text-muted-foreground mt-1">Menù di Natale 2024</p>
      </header>

      {/* Progress indicator */}
      <div className="px-6 py-4 sticky top-[88px] md:top-[104px] bg-background/95 backdrop-blur z-20">
        <div className="flex items-center justify-center gap-1 max-w-xs mx-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors border-2",
                  i < currentStepIndex 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : i === currentStepIndex
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground"
                )}
              >
                {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < 3 && (
                <div className={cn(
                  "w-8 md:w-12 h-0.5 mx-1 transition-colors",
                  i < currentStepIndex ? "bg-primary" : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-8 mt-2 text-xs text-muted-foreground">
          <span className={cn(currentStepIndex === 0 && "text-foreground font-medium")}>Menù</span>
          <span className={cn(currentStepIndex === 1 && "text-foreground font-medium")}>Consegna</span>
          <span className={cn(currentStepIndex === 2 && "text-foreground font-medium")}>Dati</span>
          <span className={cn(currentStepIndex === 3 && "text-foreground font-medium")}>Conferma</span>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-6 py-6 max-w-lg mx-auto w-full">
        {/* Step: Menu */}
        {step === 'menu' && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-[2rem] leading-tight font-bold tracking-tight uppercase">
                Scegli i piatti
              </h2>
              <p className="text-muted-foreground">
                Tocca + per aggiungere al carrello
              </p>
            </div>

            <MenuGrid
              products={products}
              categories={categories}
              getItemQuantity={cart.getItemQuantity}
              onAdd={handleAddItem}
              onRemove={cart.removeItem}
            />
          </div>
        )}

        {/* Step: Delivery */}
        {step === 'delivery' && (
          <DeliveryStep
            deliveryType={cart.deliveryType}
            deliveryDate={cart.deliveryDate}
            deliveryTime={cart.deliveryTime}
            deliveryAddress={cart.deliveryAddress}
            onTypeChange={cart.setDeliveryType}
            onDateChange={cart.setDeliveryDate}
            onTimeChange={cart.setDeliveryTime}
            onAddressChange={cart.setDeliveryAddress}
          />
        )}

        {/* Step: Customer */}
        {step === 'customer' && (
          <CustomerStep
            customerName={cart.customerName}
            customerPhone={cart.customerPhone}
            customerEmail={cart.customerEmail}
            notes={cart.notes}
            onNameChange={cart.setCustomerName}
            onPhoneChange={cart.setCustomerPhone}
            onEmailChange={cart.setCustomerEmail}
            onNotesChange={cart.setNotes}
          />
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <ConfirmStep
            items={cart.items}
            totalAmount={cart.totalAmount}
            deliveryType={cart.deliveryType}
            deliveryDate={cart.deliveryDate}
            deliveryTime={cart.deliveryTime}
            deliveryAddress={cart.deliveryAddress}
            customerName={cart.customerName}
            customerPhone={cart.customerPhone}
            notes={cart.notes}
          />
        )}
      </main>

      {/* Footer navigation */}
      {step === 'menu' ? (
        <CartSummary
          totalItems={cart.totalItems}
          totalAmount={cart.totalAmount}
          onProceed={nextStep}
          disabled={!canProceed()}
        />
      ) : (
        <footer className="fixed bottom-0 left-0 right-0 p-4 border-t-2 border-border bg-background z-40">
          <div className="max-w-lg mx-auto flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={prevStep}
              className="h-14 px-6 rounded-none border-2 text-lg"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Indietro
            </Button>
            {step === 'confirm' ? (
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 h-14 text-lg font-bold rounded-none bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Conferma Ordine
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1 h-14 text-lg font-bold rounded-none"
              >
                Avanti
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </footer>
      )}

      {/* AI Chatbot */}
      <AIChatbot
        products={products}
        onAddItems={handleAIItems}
      />
    </div>
  );
}
