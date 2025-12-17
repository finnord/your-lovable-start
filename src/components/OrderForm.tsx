import { useState, useEffect } from 'react';
import { Order, OrderItem } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProducts } from '@/hooks/useProducts';
import { Plus, Trash2, Gift } from 'lucide-react';
import { CATEGORY_LABELS } from '@/lib/constants';

interface OrderFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Order;
}

const generateItemId = () => Math.random().toString(36).substring(2, 10);

export function OrderForm({ open, onClose, onSubmit, initialData }: OrderFormProps) {
  const { products, categories } = useProducts();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('12:00');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([{ id: generateItemId(), name: '', quantity: 1, price: 0 }]);

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName);
      setCustomerPhone(initialData.customerPhone);
      setCustomerEmail(initialData.customerEmail || '');
      setDeliveryDate(initialData.deliveryDate);
      setDeliveryTime(initialData.deliveryTime || '12:00');
      setDeliveryType(initialData.deliveryType);
      setDeliveryAddress(initialData.deliveryAddress || '');
      setNotes(initialData.notes || '');
      setItems(initialData.items.length > 0 ? initialData.items : [{ id: generateItemId(), name: '', quantity: 1, price: 0 }]);
    }
  }, [initialData]);

  const addItem = () => {
    setItems([...items, { id: generateItemId(), name: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const selectProduct = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setItems(items.map(item =>
        item.id === itemId ? { ...item, productId, name: product.name, price: product.price } : item
      ));
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      deliveryDate,
      deliveryTime,
      deliveryType,
      deliveryAddress: deliveryAddress || undefined,
      notes: notes || undefined,
      items,
      totalAmount,
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setDeliveryDate('');
    setDeliveryTime('12:00');
    setDeliveryType('pickup');
    setDeliveryAddress('');
    setNotes('');
    setItems([{ id: generateItemId(), name: '', quantity: 1, price: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
            <Gift className="h-6 w-6 text-primary" />
            {initialData ? 'Modifica Ordine' : 'Nuovo Ordine'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nome Cliente *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                placeholder="Mario Rossi"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Telefono *</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                placeholder="+39 123 456 7890"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="mario@example.com"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryType">Tipo Consegna *</Label>
              <Select value={deliveryType} onValueChange={(v) => setDeliveryType(v as 'pickup' | 'delivery')}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Ritiro in sede</SelectItem>
                  <SelectItem value="delivery">Consegna a domicilio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Data Consegna *</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryTime">Ora Consegna *</Label>
              <Input
                id="deliveryTime"
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                required
                className="bg-background border-border"
              />
            </div>
            {deliveryType === 'delivery' && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="deliveryAddress">Indirizzo Consegna *</Label>
                <Input
                  id="deliveryAddress"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required={deliveryType === 'delivery'}
                  placeholder="Via Roma 1, Milano"
                  className="bg-background border-border"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Prodotti *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="border-border">
                <Plus className="h-4 w-4 mr-1" /> Aggiungi
              </Button>
            </div>
            
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 items-start">
                <div className="flex-1">
                  <Select
                    value={item.productId || ''}
                    onValueChange={(v) => selectProduct(item.id, v)}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Seleziona prodotto" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <div key={cat}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {CATEGORY_LABELS[cat] || cat}
                          </div>
                          {products
                            .filter((p) => p.category === cat)
                            .map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - €{product.price.toFixed(2)}
                              </SelectItem>
                            ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                    required
                    className="bg-background border-border"
                  />
                </div>
                <div className="w-24 text-right">
                  <span className="text-sm text-muted-foreground leading-10">
                    €{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note aggiuntive sull'ordine..."
              rows={3}
              className="bg-background border-border"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-lg">
              Totale: <span className="font-bold text-accent">€{totalAmount.toFixed(2)}</span>
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="border-border">
                Annulla
              </Button>
              <Button type="submit" className="glow-ruby">
                {initialData ? 'Salva Modifiche' : 'Crea Ordine'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
