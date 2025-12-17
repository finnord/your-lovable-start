import { useState, useEffect } from 'react';
import { Plus, User, Phone, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useCustomers, Customer, DuplicateCheckResult } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/use-toast';
import { normalizePhone } from '@/lib/phone-utils';

interface CustomerSelectProps {
  onSelect: (customer: { name: string; phone: string }) => void;
  selectedCustomerId?: string;
}

export function CustomerSelect({ onSelect, selectedCustomerId }: CustomerSelectProps) {
  const { customers, loading, addCustomer, checkDuplicatePhone } = useCustomers();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCheckResult>({ isDuplicate: false, existingCustomer: null });

  // Check for duplicates as user types phone
  useEffect(() => {
    if (newPhone.trim().length >= 6) {
      const result = checkDuplicatePhone(newPhone);
      setDuplicateWarning(result);
    } else {
      setDuplicateWarning({ isDuplicate: false, existingCustomer: null });
    }
  }, [newPhone, checkDuplicatePhone]);

  const handleSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      onSelect({ name: customer.name, phone: customer.phone });
    }
  };

  const handleAddCustomer = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast({
        title: 'Errore',
        description: 'Inserisci nome e telefono',
        variant: 'destructive',
      });
      return;
    }

    // Block if duplicate detected
    if (duplicateWarning.isDuplicate) {
      toast({
        title: 'Cliente già esistente',
        description: `Il numero ${newPhone} appartiene a ${duplicateWarning.existingCustomer?.name}`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    const customer = await addCustomer(newName.trim(), newPhone.trim());
    setSaving(false);

    if (customer) {
      onSelect({ name: customer.name, phone: customer.phone });
      setModalOpen(false);
      setNewName('');
      setNewPhone('');
      setDuplicateWarning({ isDuplicate: false, existingCustomer: null });
      toast({
        title: 'Cliente aggiunto',
        description: `${customer.name} salvato in rubrica`,
      });
    } else {
      toast({
        title: 'Errore',
        description: 'Impossibile salvare il cliente. Potrebbe già esistere.',
        variant: 'destructive',
      });
    }
  };

  const handleUseExistingCustomer = () => {
    if (duplicateWarning.existingCustomer) {
      onSelect({ 
        name: duplicateWarning.existingCustomer.name, 
        phone: duplicateWarning.existingCustomer.phone 
      });
      setModalOpen(false);
      setNewName('');
      setNewPhone('');
      setDuplicateWarning({ isDuplicate: false, existingCustomer: null });
      toast({
        title: 'Cliente selezionato',
        description: `${duplicateWarning.existingCustomer.name} selezionato dalla rubrica`,
      });
    }
  };

  return (
    <>
      {/* Solo il campo Select + Button, senza Label (gestito dal parent) */}
      <div className="flex gap-2">
        <Select onValueChange={handleSelect} value={selectedCustomerId}>
          <SelectTrigger className="flex-1 h-9">
            <SelectValue placeholder={loading ? "Caricamento..." : "Seleziona cliente..."} />
          </SelectTrigger>
          <SelectContent>
            {customers.map(customer => (
              <SelectItem key={customer.id} value={customer.id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{customer.name}</span>
                  <span className="text-muted-foreground text-xs">{customer.phone}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={() => setModalOpen(true)}
          title="Nuovo cliente"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Modal Nuovo Cliente */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) {
          setNewName('');
          setNewPhone('');
          setDuplicateWarning({ isDuplicate: false, existingCustomer: null });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Nuovo Cliente
            </DialogTitle>
            <DialogDescription>
              Inserisci i dati del nuovo cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nome *</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome e cognome"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-phone" className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> Telefono *
              </Label>
              <Input
                id="new-phone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Numero telefono"
                type="tel"
                className={duplicateWarning.isDuplicate ? 'border-destructive' : ''}
              />
              
              {/* Duplicate Warning */}
              {duplicateWarning.isDuplicate && duplicateWarning.existingCustomer && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-destructive">Cliente già esistente</p>
                      <p className="text-muted-foreground mt-1">
                        Il numero <strong>{newPhone}</strong> è già registrato per{' '}
                        <strong>{duplicateWarning.existingCustomer.name}</strong>
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUseExistingCustomer}
                        className="mt-2"
                      >
                        Usa questo cliente
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleAddCustomer} 
              disabled={saving || duplicateWarning.isDuplicate}
            >
              {saving ? (
                <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Aggiungi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}