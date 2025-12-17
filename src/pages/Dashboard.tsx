import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Phone, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { PICKUP_DATES, formatOrderId } from '@/lib/constants';

// Date di consegna disponibili - derivate dalle costanti
const DELIVERY_DATES = [
  { value: 'all', label: 'Tutti' },
  ...PICKUP_DATES.map(d => ({ value: d.value, label: d.label })),
];

export default function Dashboard() {
  const { orders, loading } = useOrders();
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState('all');

  // Filtra ordini per data
  const filteredOrders = useMemo(() => {
    const filtered = dateFilter === 'all' 
      ? orders 
      : orders.filter(o => o.deliveryDate === dateFilter);
    return filtered.sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
  }, [orders, dateFilter]);

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'd MMM', { locale: it });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <PageWrapper>
        {/* Header */}
        <header className="mb-12">
          <p className="uppercase-label mb-3">Panoramica</p>
          <h1 className="swiss-display mb-2">DASHBOARD</h1>
          <p className="text-muted-foreground">
            {orders.length} ordini totali
          </p>
        </header>

        {/* Filtro Date */}
        <section className="mb-10">
          <p className="uppercase-label mb-4">Filtra per data</p>
          <div className="flex flex-wrap gap-2">
            {DELIVERY_DATES.map((date) => (
              <Button
                key={date.value}
                variant={dateFilter === date.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter(date.value)}
                className="min-w-[80px]"
              >
                {date.label}
              </Button>
            ))}
          </div>
        </section>

        {/* Lista Ordini */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <p className="uppercase-label">
              {dateFilter === 'all' ? 'Tutti gli ordini' : `Ordini del ${DELIVERY_DATES.find(d => d.value === dateFilter)?.label}`}
            </p>
            <span className="text-sm text-muted-foreground">
              {filteredOrders.length} ordini
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nessun ordine trovato
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map((order) => (
                <Tooltip key={order.id}>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => navigate(`/ordini?ordine=${order.id}`)}
                      className="group flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer transition-all hover:border-primary/50 hover:bg-muted/30"
                    >
                      {/* ID Ordine nel nuovo formato */}
                      <span className="font-mono text-sm font-medium text-primary min-w-[70px]">
                        {formatOrderId(order.deliveryDate, order.orderNumber)}
                      </span>

                      {/* Nome Cliente */}
                      <span className="font-medium flex-1">
                        {order.customerName}
                      </span>

                      {/* Telefono */}
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {order.customerPhone}
                      </span>

                      {/* Data */}
                      <span className="text-sm text-muted-foreground min-w-[60px] text-right">
                        {formatDate(order.deliveryDate)}
                      </span>

                      {/* Ora */}
                      <span className="text-sm text-muted-foreground min-w-[50px]">
                        {order.deliveryTime}
                      </span>

                      {/* Arrow */}
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clicca per vedere i dettagli</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}
        </section>
      </PageWrapper>
    </TooltipProvider>
  );
}
