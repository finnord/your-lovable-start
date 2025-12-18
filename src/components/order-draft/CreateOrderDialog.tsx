import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarIcon, Loader2, Package, User, MapPin, Clock, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { OrderDraft, DraftItem, calculateTotal, getSelectedItems, DeliveryType } from '@/lib/order-extraction';
import { Product } from '@/types/order';
import { DraftItemRow } from './DraftItemRow';
import { PICKUP_TIMES } from '@/lib/constants';

interface CreateOrderDialogProps {
  open: boolean;
  draft: OrderDraft | null;
  products: Product[];
  isCreating: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onUpdateDraft: (updates: Partial<OrderDraft>) => void;
  onUpdateItem: (itemId: string, updates: Partial<DraftItem>) => void;
  onToggleItemSelection: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
}

const sourceLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  photo: 'Foto',
  voice: 'Voce',
  manual: 'Manuale',
};

export function CreateOrderDialog({
  open,
  draft,
  products,
  isCreating,
  onClose,
  onConfirm,
  onUpdateDraft,
  onUpdateItem,
  onToggleItemSelection,
  onRemoveItem,
}: CreateOrderDialogProps) {
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    draft?.delivery.date ? new Date(draft.delivery.date) : undefined
  );

  const total = useMemo(() => (draft ? calculateTotal(draft) : 0), [draft]);
  const selectedCount = useMemo(() => (draft ? getSelectedItems(draft).length : 0), [draft]);
  const totalCount = draft?.items.length || 0;

  if (!draft) return null;

  const handleDateSelect = (date: Date | undefined) => {
    setDeliveryDate(date);
    onUpdateDraft({
      delivery: {
        ...draft.delivery,
        date: date ? format(date, 'yyyy-MM-dd') : null,
      },
    });
  };

  const handleTimeChange = (time: string) => {
    onUpdateDraft({
      delivery: {
        ...draft.delivery,
        time,
      },
    });
  };

  const handleTypeChange = (type: DeliveryType) => {
    onUpdateDraft({
      delivery: {
        ...draft.delivery,
        type,
      },
    });
  };

  const handleProductChange = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      onUpdateItem(itemId, {
        matchedProduct: product,
        confidence: 'high',
        selected: true,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Crea Ordine
            <Badge variant="outline" className="ml-2">
              da {sourceLabels[draft.source]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Customer Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Cliente
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nome *</Label>
                  <Input
                    id="customerName"
                    value={draft.customer.name || ''}
                    onChange={(e) =>
                      onUpdateDraft({
                        customer: { ...draft.customer, name: e.target.value },
                      })
                    }
                    placeholder="Nome cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Telefono</Label>
                  <Input
                    id="customerPhone"
                    value={draft.customer.phone || ''}
                    onChange={(e) =>
                      onUpdateDraft({
                        customer: { ...draft.customer, phone: e.target.value },
                      })
                    }
                    placeholder="Telefono"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Delivery Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Consegna
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !deliveryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deliveryDate ? format(deliveryDate, 'PP', { locale: it }) : 'Seleziona'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={deliveryDate}
                        onSelect={handleDateSelect}
                        locale={it}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Ora *</Label>
                  <Select
                    value={draft.delivery.time || ''}
                    onValueChange={handleTimeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona ora" />
                    </SelectTrigger>
                    <SelectContent>
                      {PICKUP_TIMES.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={draft.delivery.type || 'ritiro'}
                    onValueChange={(v) => handleTypeChange(v as DeliveryType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ritiro">Ritiro</SelectItem>
                      <SelectItem value="consegna">Consegna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Prodotti
                </h3>
                <span className="text-sm text-muted-foreground">
                  {selectedCount}/{totalCount} selezionati
                </span>
              </div>

              <div className="space-y-2">
                {draft.items.map((item) => (
                  <DraftItemRow
                    key={item.id}
                    item={item}
                    products={products}
                    onToggleSelect={() => onToggleItemSelection(item.id)}
                    onUpdateQuantity={(quantity) => onUpdateItem(item.id, { quantity })}
                    onChangeProduct={(productId) => handleProductChange(item.id, productId)}
                    onRemove={() => onRemoveItem(item.id)}
                  />
                ))}
              </div>

              {draft.items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nessun prodotto estratto
                </div>
              )}
            </div>

            <Separator />

            {/* Notes Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Note
              </Label>
              <Textarea
                value={draft.notes || ''}
                onChange={(e) => onUpdateDraft({ notes: e.target.value })}
                placeholder="Note aggiuntive..."
                rows={2}
              />
            </div>
          </div>
        </ScrollArea>

        <Separator className="my-2" />

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <div className="text-lg font-semibold">
            Totale: €{total.toFixed(2)}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isCreating}>
              Annulla
            </Button>
            <Button onClick={onConfirm} disabled={isCreating || selectedCount === 0}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creazione...
                </>
              ) : (
                'Crea Ordine'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
