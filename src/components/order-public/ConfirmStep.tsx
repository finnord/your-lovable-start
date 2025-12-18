import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Store, Truck } from 'lucide-react';
import type { CartItem } from '@/hooks/usePublicCart';

interface ConfirmStepProps {
  items: CartItem[];
  totalAmount: number;
  deliveryType: 'ritiro' | 'consegna';
  deliveryDate: Date | undefined;
  deliveryTime: string | null;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  notes: string;
}

export function ConfirmStep({
  items,
  totalAmount,
  deliveryType,
  deliveryDate,
  deliveryTime,
  deliveryAddress,
  customerName,
  customerPhone,
  notes,
}: ConfirmStepProps) {
  return (
    <div className="space-y-10">
      <div className="text-center space-y-4">
        <h2 className="text-[2.5rem] leading-tight font-bold tracking-tight uppercase">
          Riepilogo
        </h2>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Controlla e conferma
        </p>
      </div>

      {/* Order items */}
      <div className="border border-border/50 divide-y divide-border/50">
        <div className="p-4 bg-muted/30">
          <h3 className="font-bold uppercase tracking-wider text-sm">Il tuo ordine</h3>
        </div>
        {items.map(item => (
          <div key={item.productId} className="p-4 flex justify-between items-center">
            <div>
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground ml-2">×{item.quantity}</span>
            </div>
            <span className="font-bold">€{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="p-4 flex justify-between items-center bg-primary/5">
          <span className="font-bold text-lg">TOTALE</span>
          <span className="font-bold text-2xl text-primary">€{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Delivery details */}
      <div className="border border-border/50 divide-y divide-border/50">
        <div className="p-4 bg-muted/30">
          <h3 className="font-bold uppercase tracking-wider text-sm">
            {deliveryType === 'ritiro' ? 'Ritiro' : 'Consegna'}
          </h3>
        </div>
        <div className="p-4 flex items-center gap-3">
          {deliveryType === 'ritiro' ? (
            <Store className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Truck className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">
              {deliveryDate && format(deliveryDate, "EEEE d MMMM", { locale: it })}
            </p>
            <p className="text-muted-foreground">ore {deliveryTime}</p>
          </div>
        </div>
        {deliveryType === 'consegna' && deliveryAddress && (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">Indirizzo</p>
            <p className="font-medium">{deliveryAddress}</p>
          </div>
        )}
      </div>

      {/* Customer details */}
      <div className="border border-border/50 divide-y divide-border/50">
        <div className="p-4 bg-muted/30">
          <h3 className="font-bold uppercase tracking-wider text-sm">Contatti</h3>
        </div>
        <div className="p-4 space-y-2">
          <p className="font-medium text-lg">{customerName}</p>
          <p className="text-muted-foreground font-mono">{customerPhone}</p>
        </div>
        {notes && (
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Note</p>
            <p className="text-sm">{notes}</p>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Premendo "Conferma ordine" riceverai una chiamata di conferma.
      </p>
    </div>
  );
}
