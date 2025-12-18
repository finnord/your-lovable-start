import { useState, useCallback, useRef, useEffect } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Save, Plus, Trash2, Grid3X3, Lock, LockOpen, Circle, Square, RectangleVertical, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Grid configuration
const GRID_SIZE = 40;
const TABLE_SIZE = 80;
const BISTRO_WIDTH = 60;
const BISTRO_HEIGHT = 100;

// Room configuration
const ROOMS = [
  { id: 'grande', label: 'Sala Grande', color: 'bg-amber-500/20' },
  { id: 'blu', label: 'Sala Blu', color: 'bg-blue-500/20' },
  { id: 'rosa', label: 'Sala Rosa', color: 'bg-pink-500/20' },
] as const;

type RoomId = typeof ROOMS[number]['id'];
type TableShape = 'square' | 'round' | 'bistro';

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
  shape: TableShape;
  min_capacity: number | null;
  max_capacity: number | null;
  module_group: string | null;
  module_position: number | null;
  is_combinable: boolean;
  room: RoomId;
}

interface CanvasTable extends Table {
  isNew?: boolean;
}

// Template types for inventory
const TABLE_TEMPLATES = [
  { capacity: 2, shape: 'round' as TableShape, label: '2p Rotondo', icon: Circle },
  { capacity: 4, shape: 'square' as TableShape, label: '4p Quadrato', icon: Square },
  { capacity: 6, shape: 'square' as TableShape, label: '6p Quadrato', icon: Square },
  { capacity: 2, shape: 'bistro' as TableShape, label: 'Bistrot', icon: RectangleVertical },
];

// Get table dimensions based on shape
const getTableDimensions = (shape: TableShape) => {
  switch (shape) {
    case 'bistro':
      return { width: BISTRO_WIDTH, height: BISTRO_HEIGHT };
    case 'round':
    case 'square':
    default:
      return { width: TABLE_SIZE, height: TABLE_SIZE };
  }
};

// Get capacity color
const getCapacityColor = (capacity: number, shape: TableShape) => {
  if (shape === 'bistro') return 'bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30';
  if (capacity <= 2) return 'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30';
  if (capacity <= 4) return 'bg-green-500/20 border-green-500/40 hover:bg-green-500/30';
  if (capacity <= 6) return 'bg-yellow-500/20 border-yellow-500/40 hover:bg-yellow-500/30';
  return 'bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30';
};

// Draggable inventory item
function InventoryItem({ template, disabled }: { template: typeof TABLE_TEMPLATES[0]; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template-${template.shape}-${template.capacity}`,
    data: { type: 'template', capacity: template.capacity, shape: template.shape },
    disabled,
  });

  const Icon = template.icon;
  const color = getCapacityColor(template.capacity, template.shape);

  return (
    <div
      ref={setNodeRef}
      {...(disabled ? {} : { ...listeners, ...attributes })}
      className={cn(
        "p-3 border rounded-lg transition-all duration-200 flex flex-col items-center gap-1",
        disabled 
          ? "opacity-50 cursor-not-allowed" 
          : "cursor-grab active:cursor-grabbing hover:scale-105 hover:shadow-lg",
        color,
        isDragging && "opacity-50 scale-95"
      )}
    >
      <Icon className="w-5 h-5" />
      <div className="text-xs font-medium text-center">{template.label}</div>
    </div>
  );
}

// Draggable table on canvas
function CanvasTableItem({ 
  table, 
  isSelected, 
  onClick,
  disabled,
  linkedTables
}: { 
  table: CanvasTable; 
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  linkedTables?: CanvasTable[];
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: table.id,
    data: { type: 'table', table },
    disabled,
  });

  const dimensions = getTableDimensions(table.shape);
  const capacityColor = getCapacityColor(table.capacity, table.shape);

  // Display capacity range if combinable
  const capacityLabel = table.is_combinable && table.min_capacity && table.max_capacity
    ? `${table.min_capacity}-${table.max_capacity}p`
    : `${table.capacity}p`;

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          position: 'absolute',
          left: table.position_x || 0,
          top: table.position_y || 0,
          width: dimensions.width,
          height: dimensions.height,
          transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
          willChange: isDragging ? 'transform' : undefined,
        }}
        {...(disabled ? {} : { ...listeners, ...attributes })}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn(
          "border-2 flex flex-col items-center justify-center",
          disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
          !isDragging && "transition-colors transition-shadow duration-200",
          table.shape === 'round' ? "rounded-full" : "rounded-lg",
          capacityColor,
          isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg",
          isDragging && "opacity-70 z-50 shadow-2xl scale-105",
          table.is_combinable && "border-dashed"
        )}
      >
        <div className="text-sm font-bold">{table.name}</div>
        <div className="text-xs text-muted-foreground">{capacityLabel}</div>
        {table.is_combinable && (
          <Link2 className="w-3 h-3 text-muted-foreground mt-0.5" />
        )}
      </div>
    </>
  );
}

// Canvas drop area
function Canvas({ 
  children, 
  onClick,
  canvasRef,
  showGrid,
  roomColor
}: { 
  children: React.ReactNode;
  onClick: () => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  showGrid: boolean;
  roomColor: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

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
        isOver ? "border-primary bg-primary/5 shadow-inner" : "border-border/50",
        roomColor
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
  const [isLocked, setIsLocked] = useState(true);
  const [activeRoom, setActiveRoom] = useState<RoomId>('grande');
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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
        const snappedTables = data.map(t => ({
          ...t,
          position_x: t.position_x !== null ? snapToGrid(Number(t.position_x)) : GRID_SIZE,
          position_y: t.position_y !== null ? snapToGrid(Number(t.position_y)) : GRID_SIZE,
          shape: (t.shape || 'square') as TableShape,
          room: (t.room || 'grande') as RoomId,
        }));
        setTables(snappedTables);
        
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

  // Filter tables by current room
  const roomTables = tables.filter(t => t.room === activeRoom);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    setActiveId(null);

    if (!over || !canvasRef.current) return;

    const activeData = active.data.current;
    const canvasRect = canvasRef.current.getBoundingClientRect();

    // If dragging a template onto canvas, create new table
    if (activeData?.type === 'template' && over.id === 'canvas') {
      const { capacity, shape } = activeData;
      const dimensions = getTableDimensions(shape);
      const maxX = canvasRect.width - dimensions.width;
      const maxY = canvasRect.height - dimensions.height;
      
      const pointerEvent = event.activatorEvent as PointerEvent;
      const dropX = pointerEvent.clientX - canvasRect.left - dimensions.width / 2;
      const dropY = pointerEvent.clientY - canvasRect.top - dimensions.height / 2;
      
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
        shape,
        min_capacity: null,
        max_capacity: null,
        module_group: null,
        module_position: null,
        is_combinable: false,
        room: activeRoom,
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
          const dimensions = getTableDimensions(t.shape);
          const maxX = canvasRect.width - dimensions.width;
          const maxY = canvasRect.height - dimensions.height;
          
          const newX = (t.position_x || 0) + delta.x;
          const newY = (t.position_y || 0) + delta.y;
          
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
      const newTables = tables.filter(t => t.isNew);
      const existingTables = tables.filter(t => !t.isNew);

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
            shape: table.shape,
            min_capacity: table.min_capacity,
            max_capacity: table.max_capacity,
            module_group: table.module_group,
            module_position: table.module_position,
            is_combinable: table.is_combinable,
            room: table.room,
          })
          .select()
          .single();

        if (error) throw error;

        setTables(prev => prev.map(t => 
          t.id === table.id ? { ...data, shape: data.shape as TableShape, room: data.room as RoomId, isNew: false } : t
        ));
      }

      for (const table of existingTables) {
        const { error } = await supabase
          .from('tables')
          .update({
            name: table.name,
            capacity: table.capacity,
            position_x: table.position_x,
            position_y: table.position_y,
            shape: table.shape,
            min_capacity: table.min_capacity,
            max_capacity: table.max_capacity,
            module_group: table.module_group,
            module_position: table.module_position,
            is_combinable: table.is_combinable,
            room: table.room,
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
      setTables(prev => prev.filter(t => t.id !== selectedTable));
    } else {
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
  const currentRoomConfig = ROOMS.find(r => r.id === activeRoom);

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
      setSelectedTable(null);
    }
    toast(isLocked ? 'Modifica abilitata' : 'Mappa bloccata', {
      icon: isLocked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />,
    });
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mappa Tavoli</h1>
          <p className="text-muted-foreground mt-1">
            {isLocked 
              ? 'Mappa bloccata • Sblocca per modificare'
              : `${roomTables.length} tavoli in ${currentRoomConfig?.label}`
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

      {/* Room Tabs */}
      <Tabs value={activeRoom} onValueChange={(v) => setActiveRoom(v as RoomId)} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          {ROOMS.map(room => (
            <TabsTrigger key={room.id} value={room.id} className="gap-2">
              <div className={cn("w-3 h-3 rounded-full", room.color.replace('/20', ''))} />
              {room.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DndContext 
        sensors={sensors}
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-[200px_1fr_240px] gap-6">
          {/* Inventory Panel */}
          <Card className={cn(
            "p-4 h-fit animate-fade-in transition-opacity duration-300",
            isLocked && "opacity-50"
          )}>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Inventario
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {TABLE_TEMPLATES.map((template, i) => (
                <InventoryItem key={`${template.shape}-${template.capacity}-${i}`} template={template} disabled={isLocked} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              {isLocked ? 'Sblocca per aggiungere' : 'Trascina nel canvas'}
            </p>
          </Card>

          {/* Canvas */}
          <div className="animate-fade-in">
            <Canvas 
              onClick={() => setSelectedTable(null)}
              canvasRef={canvasRef}
              showGrid={showGrid}
              roomColor={currentRoomConfig?.color || ''}
            >
              {roomTables.map(table => (
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
          )}>
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
                    Forma
                  </Label>
                  <Select
                    value={selectedTableData.shape}
                    onValueChange={(v) => handleUpdateSelected({ shape: v as TableShape })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Quadrato</SelectItem>
                      <SelectItem value="round">Rotondo</SelectItem>
                      <SelectItem value="bistro">Bistrot</SelectItem>
                    </SelectContent>
                  </Select>
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

                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Combinabile
                  </Label>
                  <Switch
                    checked={selectedTableData.is_combinable}
                    onCheckedChange={(checked) => handleUpdateSelected({ is_combinable: checked })}
                  />
                </div>

                {selectedTableData.is_combinable && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Min</Label>
                        <Input
                          type="number"
                          min={1}
                          value={selectedTableData.min_capacity || ''}
                          onChange={(e) => handleUpdateSelected({ min_capacity: parseInt(e.target.value) || null })}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Max</Label>
                        <Input
                          type="number"
                          min={1}
                          value={selectedTableData.max_capacity || ''}
                          onChange={(e) => handleUpdateSelected({ max_capacity: parseInt(e.target.value) || null })}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Gruppo modulo
                      </Label>
                      <Input
                        value={selectedTableData.module_group || ''}
                        onChange={(e) => handleUpdateSelected({ module_group: e.target.value || null })}
                        placeholder="es. A, B, 34-35"
                        className="h-10"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Sala
                  </Label>
                  <Select
                    value={selectedTableData.room}
                    onValueChange={(v) => handleUpdateSelected({ room: v as RoomId })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOMS.map(room => (
                        <SelectItem key={room.id} value={room.id}>{room.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

      {/* Lock/Unlock FAB */}
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
