import { useState, useCallback } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Save, Plus, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface Table {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
  position_x: number | null;
  position_y: number | null;
  is_active: boolean;
}

interface CanvasTable extends Table {
  isNew?: boolean;
}

// Template types for inventory
const TABLE_TEMPLATES = [
  { capacity: 2, label: '2 posti', color: 'bg-blue-500/20 border-blue-500/40' },
  { capacity: 4, label: '4 posti', color: 'bg-green-500/20 border-green-500/40' },
  { capacity: 6, label: '6 posti', color: 'bg-yellow-500/20 border-yellow-500/40' },
  { capacity: 8, label: '8 posti', color: 'bg-orange-500/20 border-orange-500/40' },
];

// Draggable inventory item
function InventoryItem({ template }: { template: typeof TABLE_TEMPLATES[0] }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template-${template.capacity}`,
    data: { type: 'template', capacity: template.capacity },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "p-4 border rounded-lg cursor-grab active:cursor-grabbing transition-all",
        template.color,
        isDragging && "opacity-50"
      )}
    >
      <div className="text-center">
        <div className="text-2xl font-bold">{template.capacity}</div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
          {template.label}
        </div>
      </div>
    </div>
  );
}

// Draggable table on canvas
function CanvasTableItem({ 
  table, 
  isSelected, 
  onClick 
}: { 
  table: CanvasTable; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: table.id,
    data: { type: 'table', table },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const capacityColor = 
    table.capacity <= 2 ? 'bg-blue-500/20 border-blue-500/40' :
    table.capacity <= 4 ? 'bg-green-500/20 border-green-500/40' :
    table.capacity <= 6 ? 'bg-yellow-500/20 border-yellow-500/40' :
    'bg-orange-500/20 border-orange-500/40';

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'absolute',
        left: table.position_x || 0,
        top: table.position_y || 0,
      }}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "w-20 h-20 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all flex flex-col items-center justify-center",
        capacityColor,
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isDragging && "opacity-50 z-50"
      )}
    >
      <div className="text-sm font-bold">{table.name}</div>
      <div className="text-xs text-muted-foreground">{table.capacity}p</div>
    </div>
  );
}

// Canvas drop area
function Canvas({ 
  children, 
  onClick 
}: { 
  children: React.ReactNode;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "relative w-full h-[600px] border border-dashed rounded-lg transition-colors overflow-hidden",
        isOver ? "border-primary bg-primary/5" : "border-border/50 bg-muted/20"
      )}
    >
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground)) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      {children}
    </div>
  );
}

export default function TavoliMappa() {
  const [tables, setTables] = useState<CanvasTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nextTableNumber, setNextTableNumber] = useState(1);

  // Fetch existing tables
  useEffect(() => {
    async function fetchTables() {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('sort_order');

      if (error) {
        console.error('[TavoliMappa] Error fetching tables:', error);
        toast.error('Errore nel caricamento dei tavoli');
      } else if (data) {
        setTables(data);
        // Calculate next table number
        const maxNum = data.reduce((max, t) => {
          const num = parseInt(t.name.replace(/\D/g, '')) || 0;
          return Math.max(max, num);
        }, 0);
        setNextTableNumber(maxNum + 1);
      }
      setLoading(false);
    }
    fetchTables();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;

    // If dragging a template onto canvas, create new table
    if (activeData?.type === 'template' && over.id === 'canvas') {
      const capacity = activeData.capacity;
      const newTable: CanvasTable = {
        id: `new-${Date.now()}`,
        name: `T${nextTableNumber}`,
        capacity,
        location: null,
        position_x: Math.max(0, (event.activatorEvent as MouseEvent).offsetX - 40),
        position_y: Math.max(0, (event.activatorEvent as MouseEvent).offsetY - 40),
        is_active: true,
        isNew: true,
      };
      setTables(prev => [...prev, newTable]);
      setNextTableNumber(prev => prev + 1);
      setSelectedTable(newTable.id);
      toast.success(`Tavolo ${newTable.name} aggiunto`);
    }

    // If dragging existing table on canvas, update position
    if (activeData?.type === 'table') {
      const tableId = active.id as string;
      setTables(prev => prev.map(t => {
        if (t.id === tableId) {
          return {
            ...t,
            position_x: Math.max(0, (t.position_x || 0) + delta.x),
            position_y: Math.max(0, (t.position_y || 0) + delta.y),
          };
        }
        return t;
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Separate new tables and existing tables
      const newTables = tables.filter(t => t.isNew);
      const existingTables = tables.filter(t => !t.isNew);

      // Insert new tables
      for (const table of newTables) {
        const { data, error } = await supabase
          .from('tables')
          .insert({
            name: table.name,
            capacity: table.capacity,
            location: table.location,
            position_x: table.position_x,
            position_y: table.position_y,
            is_active: table.is_active,
          })
          .select()
          .single();

        if (error) throw error;

        // Update local state with real ID
        setTables(prev => prev.map(t => 
          t.id === table.id ? { ...data, isNew: false } : t
        ));
      }

      // Update existing tables positions
      for (const table of existingTables) {
        const { error } = await supabase
          .from('tables')
          .update({
            position_x: table.position_x,
            position_y: table.position_y,
          })
          .eq('id', table.id);

        if (error) throw error;
      }

      toast.success('Mappa salvata');
    } catch (error) {
      console.error('[TavoliMappa] Error saving:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedTable) return;

    const table = tables.find(t => t.id === selectedTable);
    if (!table) return;

    if (table.isNew) {
      // Just remove from local state
      setTables(prev => prev.filter(t => t.id !== selectedTable));
    } else {
      // Delete from database
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', selectedTable);

      if (error) {
        console.error('[TavoliMappa] Error deleting:', error);
        toast.error('Errore nella cancellazione');
        return;
      }

      setTables(prev => prev.filter(t => t.id !== selectedTable));
    }

    setSelectedTable(null);
    toast.success('Tavolo rimosso');
  };

  const handleUpdateSelected = (updates: Partial<CanvasTable>) => {
    if (!selectedTable) return;
    setTables(prev => prev.map(t => 
      t.id === selectedTable ? { ...t, ...updates } : t
    ));
  };

  const selectedTableData = tables.find(t => t.id === selectedTable);

  if (loading) {
    return (
      <PageWrapper>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mappa Tavoli</h1>
          <p className="text-muted-foreground mt-1">
            Trascina i tavoli per posizionarli
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvataggio...' : 'Salva'}
        </Button>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-[240px_1fr_240px] gap-6">
          {/* Inventory Panel */}
          <Card className="p-4 h-fit">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Inventario
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {TABLE_TEMPLATES.map(template => (
                <InventoryItem key={template.capacity} template={template} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Trascina nel canvas
            </p>
          </Card>

          {/* Canvas */}
          <Canvas onClick={() => setSelectedTable(null)}>
            {tables.map(table => (
              <CanvasTableItem
                key={table.id}
                table={table}
                isSelected={selectedTable === table.id}
                onClick={() => setSelectedTable(table.id)}
              />
            ))}
          </Canvas>

          {/* Properties Panel */}
          <Card className="p-4 h-fit">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Proprietà
            </h3>
            
            {selectedTableData ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Nome
                  </Label>
                  <Input
                    value={selectedTableData.name}
                    onChange={(e) => handleUpdateSelected({ name: e.target.value })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Capienza
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={selectedTableData.capacity}
                    onChange={(e) => handleUpdateSelected({ capacity: parseInt(e.target.value) || 2 })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Zona
                  </Label>
                  <Input
                    value={selectedTableData.location || ''}
                    onChange={(e) => handleUpdateSelected({ location: e.target.value || null })}
                    placeholder="es. Terrazza"
                    className="h-10"
                  />
                </div>

                <div className="pt-4 border-t border-border/50">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Elimina tavolo
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Seleziona un tavolo per modificarlo
              </p>
            )}
          </Card>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeId?.startsWith('template-') && (
            <div className="w-20 h-20 rounded-lg border-2 bg-primary/20 border-primary/40 flex items-center justify-center opacity-80">
              <Plus className="w-6 h-6 text-primary" />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </PageWrapper>
  );
}