import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TableProperties, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { toast } from 'sonner';

interface Table {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
  is_active: boolean;
  sort_order: number;
}

const LOCATIONS = ['Interno', 'Terrazza', 'Giardino', 'Privé'];

export default function Tavoli() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 4,
    location: 'Interno',
  });

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[Tavoli] Error fetching tables:', error);
      return;
    }
    setTables(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Inserisci un nome per il tavolo');
      return;
    }

    if (editingTable) {
      const { error } = await supabase
        .from('tables')
        .update({
          name: formData.name,
          capacity: formData.capacity,
          location: formData.location,
        })
        .eq('id', editingTable.id);

      if (error) {
        toast.error('Errore durante l\'aggiornamento');
        return;
      }
      toast.success('Tavolo aggiornato');
    } else {
      const maxOrder = Math.max(0, ...tables.map(t => t.sort_order));
      const { error } = await supabase
        .from('tables')
        .insert([{
          name: formData.name,
          capacity: formData.capacity,
          location: formData.location,
          sort_order: maxOrder + 1,
        }]);

      if (error) {
        toast.error('Errore durante la creazione');
        return;
      }
      toast.success('Tavolo creato');
    }

    setDialogOpen(false);
    setEditingTable(null);
    setFormData({ name: '', capacity: 4, location: 'Interno' });
    fetchTables();
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setFormData({
      name: table.name,
      capacity: table.capacity,
      location: table.location || 'Interno',
    });
    setDialogOpen(true);
  };

  const handleToggleActive = async (table: Table) => {
    const { error } = await supabase
      .from('tables')
      .update({ is_active: !table.is_active })
      .eq('id', table.id);

    if (error) {
      toast.error('Errore durante l\'aggiornamento');
      return;
    }
    
    toast.success(table.is_active ? 'Tavolo disattivato' : 'Tavolo attivato');
    fetchTables();
  };

  const handleDelete = async (table: Table) => {
    if (!confirm(`Eliminare ${table.name}?`)) return;

    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', table.id);

    if (error) {
      toast.error('Errore durante l\'eliminazione');
      return;
    }
    
    toast.success('Tavolo eliminato');
    fetchTables();
  };

  const openNewDialog = () => {
    setEditingTable(null);
    setFormData({ name: '', capacity: 4, location: 'Interno' });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-phi-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  // Group by location
  const groupedTables = tables.reduce((acc, table) => {
    const loc = table.location || 'Altro';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(table);
    return acc;
  }, {} as Record<string, Table[]>);

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tavoli</h1>
          <p className="text-muted-foreground mt-1">
            {tables.filter(t => t.is_active).length} tavoli attivi su {tables.length}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Tavolo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTable ? 'Modifica Tavolo' : 'Nuovo Tavolo'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. Tavolo 1"
                />
              </div>
              <div className="space-y-2">
                <Label>Coperti</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Posizione</Label>
                <Select
                  value={formData.location}
                  onValueChange={(v) => setFormData({ ...formData, location: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleSave}>
                {editingTable ? 'Salva' : 'Crea'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tables by location */}
      {Object.entries(groupedTables).map(([location, locationTables]) => (
        <div key={location} className="space-y-3">
          <h2 className="uppercase-label">{location}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {locationTables.map(table => (
              <Card 
                key={table.id}
                className={`p-4 ${!table.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                      <TableProperties className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{table.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        <span>{table.capacity} coperti</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(table)}
                      title="Modifica"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(table)}
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Badge variant={table.is_active ? 'default' : 'secondary'}>
                    {table.is_active ? 'Attivo' : 'Disattivato'}
                  </Badge>
                  <Switch
                    checked={table.is_active}
                    onCheckedChange={() => handleToggleActive(table)}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {tables.length === 0 && (
        <Card className="p-12 text-center">
          <TableProperties className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nessun tavolo</h3>
          <p className="text-muted-foreground mb-4">
            Inizia aggiungendo i tavoli del ristorante
          </p>
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Tavolo
          </Button>
        </Card>
      )}
    </PageWrapper>
  );
}
