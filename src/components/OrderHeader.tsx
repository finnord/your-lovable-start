import { Phone, Calendar, Clock } from 'lucide-react';

interface OrderHeaderProps {
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  variant?: 'default' | 'compact';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
}

export function OrderHeader({
  orderNumber,
  customerName,
  customerPhone,
  deliveryDate,
  deliveryTime,
  variant = 'default'
}: OrderHeaderProps) {
  const isCompact = variant === 'compact';

  return (
    <div className="space-y-4">
      {/* Order Number - MASSIVE Swiss style */}
      {orderNumber && (
        <div className="pb-4 border-b border-border">
          <p className="uppercase-label mb-2">Ordine</p>
          <p className={isCompact ? "swiss-title text-foreground" : "swiss-display text-foreground"}>
            #{orderNumber.replace('ORD-', '')}
          </p>
        </div>
      )}

      {/* Customer Info */}
      {customerName && (
        <div className="space-y-2">
          <p className="uppercase-label">Cliente</p>
          <p className="text-lg font-semibold text-foreground">{customerName}</p>
          {customerPhone && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" strokeWidth={1.5} />
              {customerPhone}
            </p>
          )}
        </div>
      )}

      {/* Delivery Info */}
      {deliveryDate && (
        <div className="pt-4 border-t border-border space-y-2">
          <p className="uppercase-label">Ritiro</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2 text-foreground font-medium">
              <Calendar className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              {formatDate(deliveryDate)}
            </span>
            {deliveryTime && (
              <span className="flex items-center gap-2 text-foreground font-medium">
                <Clock className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                {deliveryTime}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
