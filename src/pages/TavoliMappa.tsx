import { useState, useCallback, useRef, useEffect } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Save, Plus, Trash2, Grid3X3, Lock, LockOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Grid configuration
const GRID_SIZE = 40;
const TABLE_SIZE = 80;

// Snap to grid function
const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
};

// Clamp value within bounds
const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

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
function InventoryItem({ template, disabled }: { template: typeof TABLE_TEMPLATES[0]; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template-${template.capacity}`,
    data: { type: 'template', capacity: template.capacity },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...(disabled ? {} : { ...listeners, ...attributes })}
      className={cn(
        "p-4 border rounded-lg transition-all duration-200",
        disabled 
          ? "opacity-50 cursor-not-allowed" 
          : "cursor-grab active:cursor-grabbing hover:scale-105 hover:shadow-lg",
        template.color,
        isDragging && "opacity-50 scale-95"
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
  onClick,
  disabled
}: { 
  table: CanvasTable; 
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: table.id,
    data: { type: 'table', table },
    disabled,
  });

  const capacityColor = 
    table.capacity <= 2 ? 'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30' :
    table.capacity <= 4 ? 'bg-green-500/20 border-green-500/40 hover:bg-green-500/30' :
    table.capacity <= 6 ? 'bg-yellow-500/20 border-yellow-500/40 hover:bg-yellow-500/30' :
    'bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30';

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: table.position_x || 0,
        top: table.position_y || 0,
        width: TABLE_SIZE,
        height: TABLE_SIZE,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        willChange: isDragging ? 'transform' : undefined,
      }}
      {...(disabled ? {} : { ...listeners, ...attributes })}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "rounded-lg border-2 flex flex-col items-center justify-center",
        disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        !isDragging && "transition-colors transition-shadow duration-200",
        capacityColor,
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg",
        isDragging && "opacity-70 z-50 shadow-2xl scale-105"
      )}
    >
      <div className="text-sm font-bold">{table.name}</div>
      <div className="text-xs text-muted-foreground">{table.capacity}p</div>
    </div>
  );
}

// Canvas drop area with ref for position calculations
function Canvas({ 
  children, 
  onClick,
  canvasRef,
  showGrid
}: { 
  children: React.ReactNode;
  onClick: () => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  showGrid: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

  // Combine refs
  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    if (canvasRef && 'current' in canvasRef) {
      (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [setNodeRef, canvasRef]);

  return (
    <div
      ref={combinedRef}
      onClick={onClick}
      className={cn(
        "relative w-full h-[600px] border border-dashed rounded-lg transition-all duration-300 overflow-hidden",
        isOver ? "border-primary bg-primary/5 shadow-inner" : "border-border/50 bg-muted/20"
      )}
    >
      {/* Grid pattern */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          showGrid ? "opacity-40" : "opacity-20"
        )}
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}
      />
      {/* Dots at intersections */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground)) 1.5px, transparent 1.5px)',
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
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
  const [showGrid, setShowGrid] = useState(true);
  const [isLocked, setIsLocked] = useState(true); // Default: locked for safety
  const canvasRef = useRef<HTMLDivElement>(null);

  // Configure sensors with activation constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activation
      },
    })
  );

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
        // Snap existing tables to grid
        const snappedTables = data.map(t => ({
          ...t,
          position_x: t.position_x !== null ? snapToGrid(t.position_x) : GRID_SIZE,
          position_y: t.position_y !== null ? snapToGrid(t.position_y) : GRID_SIZE,
        }));
        setTables(snappedTables);
        
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

    if (!over || !canvasRef.current) return;

    const activeData = active.data.current;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const maxX = canvasRect.width - TABLE_SIZE;
    const maxY = canvasRect.height - TABLE_SIZE;

    // If dragging a template onto canvas, create new table
    if (activeData?.type === 'template' && over.id === 'canvas') {
      const capacity = activeData.capacity;
      
      // Get the pointer position from the event
      const pointerEvent = event.activatorEvent as PointerEvent;
      const dropX = pointerEvent.clientX - canvasRect.left - TABLE_SIZE / 2;
      const dropY = pointerEvent.clientY - canvasRect.top - TABLE_SIZE / 2;
      
      // Snap to grid and clamp within bounds
      const snappedX = clamp(snapToGrid(dropX), 0, maxX);
      const snappedY = clamp(snapToGrid(dropY), 0, maxY);
      
      const newTable: CanvasTable = {
        id: `new-${Date.now()}`,
        name: `T${nextTableNumber}`,
        capacity,
        location: null,
        position_x: snappedX,
        position_y: snappedY,
        is_active: true,
        isNew: true,
      };
      setTables(prev => [...prev, newTable]);
      setNextTableNumber(prev => prev + 1);
      setSelectedTable(newTable.id);
      toast.success(`Tavolo ${newTable.name} aggiunto`);
    }

    // If dragging existing table on canvas, update position with snap
    if (activeData?.type === 'table') {
      const tableId = active.id as string;
      setTables(prev => prev.map(t => {
        if (t.id === tableId) {
          const newX = (t.position_x || 0) + delta.x;
          const newY = (t.position_y || 0) + delta.y;
          
          // Snap to grid and clamp within bounds
          const snappedX = clamp(snapToGrid(newX), 0, maxX);
          const snappedY = clamp(snapToGrid(newY), 0, maxY);
          
          return {
            ...t,
            position_x: snappedX,
            position_y: snappedY,
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

  const toggleLock = () => {
    setIsLocked(prev => !prev);
    if (!isLocked) {
      // When locking, deselect any selected table
      setSelectedTable(null);
    }
    toast(isLocked ? 'Modifica abilitata' : 'Mappa bloccata', {
      icon: isLocked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />,
    });
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mappa Tavoli</h1>
          <p className="text-muted-foreground mt-1">
            {isLocked 
              ? 'Mappa bloccata • Sblocca per modificare'
              : `Trascina i tavoli per posizionarli • Griglia ${GRID_SIZE}px`
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            className={cn(showGrid && "bg-muted")}
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            Griglia
          </Button>
          <Button onClick={handleSave} disabled={saving || isLocked}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-[240px_1fr_240px] gap-6">
          {/* Inventory Panel */}
          <Card className={cn(
            "p-4 h-fit animate-fade-in transition-opacity duration-300",
            isLocked && "opacity-50"
          )} style={{ animationDelay: '0.1s' }}>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Inventario
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {TABLE_TEMPLATES.map(template => (
                <InventoryItem key={template.capacity} template={template} disabled={isLocked} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              {isLocked ? 'Sblocca per aggiungere' : 'Trascina nel canvas'}
            </p>
          </Card>

          {/* Canvas */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Canvas 
              onClick={() => setSelectedTable(null)}
              canvasRef={canvasRef}
              showGrid={showGrid}
            >
              {tables.map(table => (
                <CanvasTableItem
                  key={table.id}
                  table={table}
                  isSelected={selectedTable === table.id}
                  onClick={() => !isLocked && setSelectedTable(table.id)}
                  disabled={isLocked}
                />
              ))}
            </Canvas>
          </div>

          {/* Properties Panel */}
          <Card className={cn(
            "p-4 h-fit animate-fade-in transition-opacity duration-300",
            isLocked && "opacity-50"
          )} style={{ animationDelay: '0.3s' }}>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Proprietà
            </h3>
            
            {selectedTableData && !isLocked ? (
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

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Posizione
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    X: {selectedTableData.position_x}px, Y: {selectedTableData.position_y}px
                  </div>
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
                {isLocked 
                  ? 'Sblocca per modificare i tavoli' 
                  : 'Seleziona un tavolo per modificarlo'
                }
              </p>
            )}
          </Card>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeId?.startsWith('template-') && (
            <div 
              className="rounded-lg border-2 bg-primary/20 border-primary/40 flex items-center justify-center opacity-90 shadow-2xl"
              style={{ width: TABLE_SIZE, height: TABLE_SIZE }}
            >
              <Plus className="w-6 h-6 text-primary" />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Lock/Unlock FAB - Max MSP style */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Button
          variant={isLocked ? "default" : "outline"}
          size="lg"
          onClick={toggleLock}
          className={cn(
            "rounded-full shadow-lg transition-all duration-300 gap-2 px-6",
            isLocked 
              ? "bg-destructive hover:bg-destructive/90" 
              : "bg-background hover:bg-muted border-2 border-primary"
          )}
        >
          {isLocked ? (
            <>
              <Lock className="w-5 h-5" />
              <span className="font-medium">Bloccato</span>
            </>
          ) : (
            <>
              <LockOpen className="w-5 h-5" />
              <span className="font-medium">Sbloccato</span>
            </>
          )}
        </Button>
      </div>
    </PageWrapper>
  );
}
