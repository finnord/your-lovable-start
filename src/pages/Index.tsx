import { useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { DashboardStats } from '@/components/DashboardStats';
import { OrderList } from '@/components/OrderList';
import { OrderForm } from '@/components/OrderForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Order } from '@/types/order';
import { Plus, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const { orders, loading, addOrder, deleteOrder, updateOrder } = useOrders();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleSubmit = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'> & { orderNumber?: string }) => {
    try {
      if (editingOrder) {
        await updateOrder(editingOrder.id, orderData);
        toast.success('Ordine aggiornato con successo');
      } else {
        await addOrder({ ...orderData, orderNumber: orderData.orderNumber });
        toast.success('Nuovo ordine creato');
      }
      setEditingOrder(undefined);
    } catch {
      toast.error('Errore nel salvataggio dell\'ordine');
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOrder(id);
      toast.success('Ordine eliminato');
    } catch {
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingOrder(undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-forest">
      <div className="container mx-auto px-4 py-phi-xl relative z-10">
        {/* Header */}
        <header className="mb-phi-2xl">
          <div className="flex items-center gap-3 mb-phi-sm">
            <Sparkles className="h-8 w-8 text-accent" />
            <h1 className="text-4xl font-serif">
              Ordini <span className="text-gradient-gold">Natalizi</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Gestione ordini per le festività
          </p>
        </header>

        {/* Stats */}
        <section className="mb-phi-xl animate-fade-in">
          <DashboardStats orders={orders} loading={loading} />
        </section>

        {/* Filters & Actions */}
        <section className="flex flex-col md:flex-row gap-phi-md mb-phi-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome, telefono o numero ordine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="glow-ruby hover-lift">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Ordine
          </Button>
        </section>

        {/* Order List */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <OrderList
            orders={filteredOrders}
            loading={loading}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </section>

        {/* Order Form Modal */}
        <OrderForm
          open={isFormOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          initialData={editingOrder}
        />
      </div>
    </div>
  );
};

export default Index;
