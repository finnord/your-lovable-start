import { Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Phone, MapPin, Trash2, Edit, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { formatOrderId } from '@/lib/constants';

interface OrderListProps {
  orders: Order[];
  loading?: boolean;
  onDelete: (id: string) => void;
  onEdit: (order: Order) => void;
}

export function OrderList({ orders, loading, onDelete, onEdit }: OrderListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-phi-3xl">
        <div className="text-6xl mb-phi-md">🎄</div>
        <h3 className="text-xl font-serif text-muted-foreground">Nessun ordine ancora</h3>
        <p className="text-sm text-muted-foreground mt-2">Aggiungi il tuo primo ordine natalizio!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-smooth hover-lift"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-semibold text-lg">{order.customerName}</h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                  <Hash className="h-3 w-3" />
                  {formatOrderId(order.deliveryDate, order.orderNumber)}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  {order.customerPhone}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(order.deliveryDate), 'dd MMM yyyy', { locale: it })}
                  {order.deliveryTime && ` - ${order.deliveryTime}`}
                </span>
                {order.deliveryType === 'delivery' && order.deliveryAddress && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {order.deliveryAddress}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {order.items.map((item) => (
                  <span
                    key={item.id}
                    className="bg-secondary px-3 py-1 rounded-full text-xs"
                  >
                    {item.quantity}x {item.name}
                  </span>
                ))}
              </div>

              {order.notes && (
                <p className="text-sm text-muted-foreground italic">"{order.notes}"</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-3">
              <p className="text-xl font-bold text-accent">€{order.totalAmount.toFixed(2)}</p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(order)}
                  className="border-border"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(order.id)}
                  className="text-destructive hover:text-destructive border-border"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
