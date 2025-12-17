import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers, DuplicateCheckResult } from '@/hooks/useCustomers';
import { useOrders } from '@/hooks/useOrders';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Phone, ChevronRight, UserPlus, Search, Calendar, ChevronDown, ChevronUp, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { normalizePhone } from '@/lib/phone-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { toast } from 'sonner';
import { PageWrapper } from '@/components/ui/PageWrapper';

export default function Clienti() {
  const { customers, loading: customersLoading, addCustomer, updateCustomer, deleteCustomer, hasOrders, checkDuplicatePhone } = useCustomers();
  const { orders, loading: ordersLoading } = useOrders();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  
  // Add dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [addDuplicateWarning, setAddDuplicateWarning] = useState<DuplicateCheckResult>({ isDuplicate: false, existingCustomer: null });
  
  // Edit dialog
  const [editingCustomer, setEditingCustomer] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDuplicateWarning, setEditDuplicateWarning] = useState<DuplicateCheckResult>({ isDuplicate: false, existingCustomer: null });
  
  // Delete dialog
  const [deletingCustomer, setDeletingCustomer] = useState<{ id: string; name: string; phone: string } | null>(null);

  // Check for duplicates when adding new customer
  useEffect(() => {
    if (newPhone.trim().length >= 6) {
      const result = checkDuplicatePhone(newPhone);
      setAddDuplicateWarning(result);
    } else {
      setAddDuplicateWarning({ isDuplicate: false, existingCustomer: null });
    }
  }, [newPhone, checkDuplicatePhone]);

  // Check for duplicates when editing (but exclude current customer)
  useEffect(() => {
    if (editPhone.trim().length >= 6 && editingCustomer) {
      const result = checkDuplicatePhone(editPhone);
      // Only warn if duplicate is a DIFFERENT customer
      if (result.isDuplicate && result.existingCustomer?.id !== editingCustomer.id) {
        setEditDuplicateWarning(result);
      } else {
        setEditDuplicateWarning({ isDuplicate: false, existingCustomer: null });
      }
    } else {
      setEditDuplicateWarning({ isDuplicate: false, existingCustomer: null });
    }
  }, [editPhone, editingCustomer, checkDuplicatePhone]);

  // Orders by customer phone
  const ordersByCustomer = useMemo(() => {
    const map: Record<string, typeof orders> = {};
    orders.forEach(order => {
      const key = order.customerPhone;
      if (!map[key]) map[key] = [];
      map[key].push(order);
    });
    Object.values(map).forEach(arr => {
      arr.sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate));
    });
    return map;
  }, [orders]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.includes(q)
    );
  }, [customers, searchQuery]);

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'd MMM', { locale: it });
    } catch {
      return dateStr;
    }
  };

  const handleAddCustomer = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('Nome e telefono sono obbligatori');
      return;
    }
    
    // Block if duplicate detected
    if (addDuplicateWarning.isDuplicate) {
      toast.error(`Numero già registrato per ${addDuplicateWarning.existingCustomer?.name}`);
      return;
    }
    
    const result = await addCustomer(newName.trim(), newPhone.trim());
    if (result) {
      toast.success('Cliente aggiunto');
      setNewName('');
      setNewPhone('');
      setAddDuplicateWarning({ isDuplicate: false, existingCustomer: null });
      setIsAddDialogOpen(false);
    } else {
      toast.error('Errore durante il salvataggio. Il numero potrebbe già esistere.');
    }
  };

  const handleEditCustomer = async () => {
    if (!editingCustomer) return;
    if (!editName.trim() || !editPhone.trim()) {
      toast.error('Nome e telefono sono obbligatori');
      return;
    }
    
    // Block if duplicate detected
    if (editDuplicateWarning.isDuplicate) {
      toast.error(`Numero già registrato per ${editDuplicateWarning.existingCustomer?.name}`);
      return;
    }
    
    const result = await updateCustomer(editingCustomer.id, editName.trim(), normalizePhone(editPhone.trim()));
    if (result) {
      toast.success('Cliente aggiornato');
      setEditingCustomer(null);
      setEditDuplicateWarning({ isDuplicate: false, existingCustomer: null });
    } else {
      toast.error('Errore durante il salvataggio');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    
    // Check if customer has orders
    const customerHasOrders = await hasOrders(deletingCustomer.phone);
    if (customerHasOrders) {
      toast.error('Impossibile eliminare: il cliente ha ordini associati');
      setDeletingCustomer(null);
      return;
    }
    
    const result = await deleteCustomer(deletingCustomer.id);
    if (result) {
      toast.success('Cliente eliminato');
    } else {
      toast.error('Errore durante l\'eliminazione');
    }
    setDeletingCustomer(null);
  };

  const openEditDialog = (customer: { id: string; name: string; phone: string }) => {
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditingCustomer(customer);
  };

  const toggleExpand = (customerId: string) => {
    setExpandedCustomer(prev => prev === customerId ? null : customerId);
  };

  const handleOrderClick = (orderId: string) => {
    navigate(`/ordini?ordine=${orderId}`);
  };

  if (customersLoading || ordersLoading) {
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
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="uppercase-label mb-3">Gestione</p>
            <h1 className="swiss-display mb-2">CLIENTI</h1>
            <p className="text-muted-foreground">{customers.length} clienti registrati</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Nuovo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuovo Cliente</DialogTitle>
                <DialogDescription>Inserisci i dati del nuovo cliente</DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="uppercase-label">Nome</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Mario Rossi"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="uppercase-label">Telefono</Label>
                  <Input
                    id="phone"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="333 1234567"
                    className={`h-11 ${addDuplicateWarning.isDuplicate ? 'border-destructive' : ''}`}
                  />
                  
                  {/* Duplicate Warning */}
                  {addDuplicateWarning.isDuplicate && addDuplicateWarning.existingCustomer && (
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="flex-1 text-sm">
                          <p className="font-medium text-destructive">Cliente già esistente</p>
                          <p className="text-muted-foreground mt-1">
                            Numero già registrato per <strong>{addDuplicateWarning.existingCustomer.name}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleAddCustomer} 
                  className="w-full h-11"
                  disabled={addDuplicateWarning.isDuplicate}
                >
                  Salva Cliente
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {/* Search */}
        <section className="mb-10">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cerca per nome o telefono..."
              className="pl-11 h-11"
            />
          </div>
        </section>

        {/* Customer Cards Grid */}
        <section>
          <p className="uppercase-label mb-6">Lista clienti</p>
          
          {filteredCustomers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {searchQuery ? 'Nessun cliente trovato' : 'Nessun cliente registrato'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCustomers.map(customer => {
                const customerOrders = ordersByCustomer[customer.phone] || [];
                const isExpanded = expandedCustomer === customer.id;

                return (
                  <div key={customer.id} className="swiss-card">
                    {/* Customer Header */}
                    <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-border">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-lg text-foreground truncate">{customer.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Phone className="w-4 h-4" strokeWidth={1.5} />
                          <span>{customer.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(customer)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Modifica cliente</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingCustomer(customer)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Elimina cliente</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    
                    {/* Order count badge */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm w-fit mb-4">
                      <span className="font-semibold">{customerOrders.length}</span>
                      <span className="text-muted-foreground">ordini</span>
                    </div>

                    {/* Orders Preview */}
                    {customerOrders.length > 0 ? (
                      <>
                        <div className="space-y-2">
                          {(isExpanded ? customerOrders : customerOrders.slice(0, 3)).map(order => (
                            <Tooltip key={order.id}>
                              <TooltipTrigger asChild>
                                <div 
                                  onClick={() => handleOrderClick(order.id)}
                                  className="group flex items-center justify-between gap-3 p-3 border border-border rounded text-sm cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                                >
                                  <span className="font-mono text-primary">
                                    {order.orderNumber}
                                  </span>
                                  <div className="flex items-center gap-2 text-muted-foreground flex-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(order.deliveryDate)}</span>
                                    <span>{order.deliveryTime}</span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>Apri ordine</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>

                        {customerOrders.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(customer.id)}
                            className="w-full mt-3 text-xs"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                Mostra meno
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                Mostra altri {customerOrders.length - 3}
                              </>
                            )}
                          </Button>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nessun ordine
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Edit Dialog */}
        <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Cliente</DialogTitle>
              <DialogDescription>Modifica i dati del cliente</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="uppercase-label">Nome</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Mario Rossi"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="uppercase-label">Telefono</Label>
                <Input
                  id="edit-phone"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="333 1234567"
                  className={`h-11 ${editDuplicateWarning.isDuplicate ? 'border-destructive' : ''}`}
                />
                
                {/* Duplicate Warning */}
                {editDuplicateWarning.isDuplicate && editDuplicateWarning.existingCustomer && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="flex-1 text-sm">
                        <p className="font-medium text-destructive">Numero già utilizzato</p>
                        <p className="text-muted-foreground mt-1">
                          Numero già registrato per <strong>{editDuplicateWarning.existingCustomer.name}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleEditCustomer} 
                className="w-full h-11"
                disabled={editDuplicateWarning.isDuplicate}
              >
                Salva Modifiche
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare il cliente <strong>{deletingCustomer?.name}</strong>?
                {deletingCustomer && ordersByCustomer[deletingCustomer.phone]?.length > 0 && (
                  <span className="block mt-2 text-destructive">
                    Attenzione: questo cliente ha {ordersByCustomer[deletingCustomer.phone].length} ordini associati.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageWrapper>
    </TooltipProvider>
  );
}
