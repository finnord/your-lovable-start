import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { Order } from '@/types/order';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Phone, Trash2, Eye, Edit, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronRight, FileSpreadsheet, Printer, X, CheckSquare, Square, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { formatOrderId } from '@/lib/constants';
import { downloadOrderLabel, downloadMultipleLabels, exportOrdersPivot, copyLabelToClipboard } from '@/lib/label-export';
import { PageWrapper } from '@/components/ui/PageWrapper';

type SortField = 'id' | 'name' | 'date';
type SortDirection = 'asc' | 'desc';

export default function GestioneOrdini() {
  const navigate = useNavigate();
  const { orders, loading, deleteOrder } = useOrders();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Check URL for order ID
  useEffect(() => {
    const orderId = searchParams.get('ordine');
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setSearchParams({});
      }
    }
  }, [searchParams, orders, setSearchParams]);

  // Auto-expand all dates on initial load
  useEffect(() => {
    if (orders.length > 0 && expandedDates.size === 0) {
      const dates = new Set(orders.map(o => o.deliveryDate));
      setExpandedDates(dates);
    }
  }, [orders]);

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      const formattedId = formatOrderId(order.deliveryDate, order.orderNumber);
      const matchesSearch = 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formattedId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.includes(searchTerm);
      return matchesSearch;
    });
    
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'id':
          const numA = parseInt(a.orderNumber.split('-').pop() || '0');
          const numB = parseInt(b.orderNumber.split('-').pop() || '0');
          comparison = numA - numB;
          break;
        case 'name':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        case 'date':
          comparison = a.deliveryDate.localeCompare(b.deliveryDate);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [orders, searchTerm, sortField, sortDirection]);

  // Group orders by date
  const ordersByDate = useMemo(() => {
    const grouped = filteredAndSortedOrders.reduce((acc, order) => {
      if (!acc[order.deliveryDate]) {
        acc[order.deliveryDate] = [];
      }
      acc[order.deliveryDate].push(order);
      return acc;
    }, {} as Record<string, Order[]>);

    return Object.entries(grouped).sort(([a], [b]) => 
      sortDirection === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
    );
  }, [filteredAndSortedOrders, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4" /> 
      : <ArrowDown className="w-4 h-4" />;
  };

  const toggleDateExpanded = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const toggleOrderExpanded = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleOrderSelection = (orderId: string, checked: boolean) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(orderId);
      } else {
        next.delete(orderId);
      }
      return next;
    });
  };

  const toggleSelectAllForDate = (dateOrders: Order[], checked: boolean) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      dateOrders.forEach(order => {
        if (checked) {
          next.add(order.id);
        } else {
          next.delete(order.id);
        }
      });
      return next;
    });
  };

  const isAllSelectedForDate = (dateOrders: Order[]) => {
    return dateOrders.every(order => selectedOrders.has(order.id));
  };

  const isSomeSelectedForDate = (dateOrders: Order[]) => {
    return dateOrders.some(order => selectedOrders.has(order.id)) && !isAllSelectedForDate(dateOrders);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'd MMMM', { locale: it });
    } catch {
      return dateStr;
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmOrder) return;
    console.log('[GestioneOrdini] Deleting order:', deleteConfirmOrder.id);
    try {
      await deleteOrder(deleteConfirmOrder.id);
      toast.success('Ordine eliminato');
      setDeleteConfirmOrder(null);
      setSelectedOrders(prev => {
        const next = new Set(prev);
        next.delete(deleteConfirmOrder.id);
        return next;
      });
    } catch (err) {
      console.error('[GestioneOrdini] Delete failed:', err);
      toast.error('Errore eliminazione ordine');
    }
  };

  const handleDownloadLabel = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadOrderLabel(order);
    toast.success('Etichetta aperta per la stampa');
  };

  const handleCopyLabel = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await copyLabelToClipboard(order);
      toast.success('Etichetta copiata! Incolla su WhatsApp');
    } catch (err) {
      console.error('[GestioneOrdini] Copy label failed:', err);
      toast.error('Errore durante la copia');
    }
  };

  const handleBulkPrint = () => {
    const ordersToprint = orders.filter(o => selectedOrders.has(o.id));
    if (ordersToprint.length === 0) return;
    
    downloadMultipleLabels(ordersToprint);
    toast.success(`${ordersToprint.length} etichette aperte per la stampa`);
  };

  const handleExportAll = () => {
    exportOrdersPivot(filteredAndSortedOrders, 'ordini-completi');
    toast.success('Export Excel avviato');
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
        <header className="mb-10 flex items-start justify-between">
          <div>
            <p className="uppercase-label mb-3">Gestione</p>
            <h1 className="swiss-display mb-2">ORDINI</h1>
            <p className="text-muted-foreground">{orders.length} ordini totali</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleExportAll} variant="outline" className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Esporta Excel
              </Button>
            </TooltipTrigger>
            <TooltipContent>Esporta tutti gli ordini in Excel</TooltipContent>
          </Tooltip>
        </header>

        {/* Filters & Sorting */}
        <section className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cerca ordine, cliente, telefono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Sort buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-muted-foreground">Ordina:</span>
            <Button 
              variant={sortField === 'id' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => toggleSort('id')}
              className="gap-1"
            >
              ID {sortField === 'id' && getSortIcon('id')}
            </Button>
            <Button 
              variant={sortField === 'name' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => toggleSort('name')}
              className="gap-1"
            >
              Nome {sortField === 'name' && getSortIcon('name')}
            </Button>
            <Button 
              variant={sortField === 'date' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => toggleSort('date')}
              className="gap-1"
            >
              Data {sortField === 'date' && getSortIcon('date')}
            </Button>
          </div>
        </section>

        {/* Orders List - Grouped by Date */}
        <section>
          <p className="uppercase-label mb-6">Lista ordini — {filteredAndSortedOrders.length} risultati</p>
          
          {ordersByDate.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nessun ordine trovato
            </div>
          ) : (
            <div className="space-y-4">
              {ordersByDate.map(([date, dateOrders]) => (
                <Collapsible 
                  key={date} 
                  open={expandedDates.has(date)}
                  onOpenChange={() => toggleDateExpanded(date)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* Select all checkbox for date */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isAllSelectedForDate(dateOrders)}
                            onCheckedChange={(checked) => toggleSelectAllForDate(dateOrders, !!checked)}
                            className={isSomeSelectedForDate(dateOrders) ? 'data-[state=checked]:bg-primary/50' : ''}
                          />
                        </div>
                        
                        {expandedDates.has(date) ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className="font-semibold text-lg">{formatDate(date)}</span>
                        <span className="text-sm text-muted-foreground">
                          {dateOrders.length} {dateOrders.length === 1 ? 'ordine' : 'ordini'}
                        </span>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-2 ml-4 space-y-2">
                      {dateOrders.map((order) => (
                        <Collapsible
                          key={order.id}
                          open={expandedOrders.has(order.id)}
                        >
                          <div
                            className={`group border rounded-lg transition-all ${
                              selectedOrders.has(order.id) 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border/50 hover:border-primary/50 hover:bg-muted/10'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                              {/* Checkbox */}
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedOrders.has(order.id)}
                                  onCheckedChange={(checked) => toggleOrderSelection(order.id, !!checked)}
                                />
                              </div>

                              {/* Expand trigger */}
                              <CollapsibleTrigger asChild>
                                <button 
                                  className="flex items-center gap-2 hover:text-primary transition-colors"
                                  onClick={(e) => toggleOrderExpanded(order.id, e)}
                                >
                                  {expandedOrders.has(order.id) ? (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </button>
                              </CollapsibleTrigger>

                              {/* Order Info */}
                              <div 
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={(e) => toggleOrderExpanded(order.id, e)}
                              >
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="font-mono text-sm font-semibold text-primary">
                                    {formatOrderId(order.deliveryDate, order.orderNumber)}
                                  </span>
                                  <span className="font-medium truncate">
                                    {order.customerName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    {order.customerPhone}
                                  </span>
                                  <span>{order.deliveryTime}</span>
                                </div>
                              </div>

                              {/* Items Preview (collapsed state) */}
                              {!expandedOrders.has(order.id) && (
                                <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                                  {order.items.slice(0, 2).map(i => `${i.quantity}× ${i.name}`).join(', ')}
                                  {order.items.length > 2 && ` +${order.items.length - 2}`}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={(e) => handleCopyLabel(order, e)}
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copia etichetta per WhatsApp</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={(e) => handleDownloadLabel(order, e)}
                                    >
                                      <Printer className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Stampa etichetta A6</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => setSelectedOrder(order)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Visualizza dettagli</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => navigate(`/modifica-ordine/${order.id}`)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Modifica ordine</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => setDeleteConfirmOrder(order)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Elimina ordine</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>

                            {/* Expanded content */}
                            <CollapsibleContent>
                              <div className="border-t border-border/50 bg-muted/20 p-4 space-y-4">
                                {/* Products */}
                                <div>
                                  <p className="uppercase-label mb-2">Prodotti</p>
                                  <div className="space-y-1">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-2 text-sm">
                                        <span className="font-mono font-semibold text-primary">{item.quantity}×</span>
                                        <span>{item.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Notes */}
                                {order.notes && (
                                  <div>
                                    <p className="uppercase-label mb-1">Note</p>
                                    <p className="text-sm text-muted-foreground italic">{order.notes}</p>
                                  </div>
                                )}

                                {/* Quick print button */}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => handleDownloadLabel(order, e)}
                                  className="gap-2"
                                >
                                  <Printer className="w-4 h-4" />
                                  Stampa Etichetta A6
                                </Button>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </section>

        {/* Floating Action Bar for bulk selection */}
        {selectedOrders.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-xl flex items-center gap-4 z-50 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              <span className="font-medium">{selectedOrders.size} ordini selezionati</span>
            </div>
            <div className="h-6 w-px bg-primary-foreground/30" />
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleBulkPrint}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Stampa Etichette
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedOrders(new Set())}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* View Order Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="pb-4 border-b border-border">
              <DialogTitle className="flex flex-col gap-2">
                <span className="font-mono text-3xl font-bold text-primary">
                  {selectedOrder && formatOrderId(selectedOrder.deliveryDate, selectedOrder.orderNumber)}
                </span>
                <span className="text-xl font-semibold uppercase tracking-wide">{selectedOrder?.customerName}</span>
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="uppercase-label mb-1">Telefono</p>
                    <p className="text-lg">{selectedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <p className="uppercase-label mb-1">Ritiro</p>
                    <p className="text-lg">{formatDate(selectedOrder.deliveryDate)} · {selectedOrder.deliveryTime}</p>
                  </div>
                </div>

                <div>
                  <p className="uppercase-label mb-3">Prodotti</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-2 border-b border-border last:border-0">
                        <span className="text-lg">
                          <span className="font-mono font-semibold">{item.quantity}×</span> {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <p className="uppercase-label mb-2">Note</p>
                    <p className="text-muted-foreground italic">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Label Actions */}
                <div className="pt-4 border-t border-border flex gap-3">
                  <Button 
                    onClick={() => downloadOrderLabel(selectedOrder)}
                    className="flex-1 gap-2"
                    variant="outline"
                  >
                    <Printer className="w-4 h-4" />
                    Stampa
                  </Button>
                  <Button 
                    onClick={async () => {
                      try {
                        await copyLabelToClipboard(selectedOrder);
                        toast.success('Etichetta copiata! Incolla su WhatsApp');
                      } catch (err) {
                        toast.error('Errore durante la copia');
                      }
                    }}
                    className="flex-1 gap-2"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4" />
                    Copia
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirmOrder} onOpenChange={() => setDeleteConfirmOrder(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminare l'ordine?</AlertDialogTitle>
              <AlertDialogDescription>
                Stai per eliminare l'ordine {deleteConfirmOrder && formatOrderId(deleteConfirmOrder.deliveryDate, deleteConfirmOrder.orderNumber)} di {deleteConfirmOrder?.customerName}. 
                Questa azione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageWrapper>
    </TooltipProvider>
  );
}
