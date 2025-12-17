import { useMemo, useState, useCallback, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { CATEGORY_LABELS } from '@/lib/constants';
import { unitLabels, type DetailedKitchenSummary } from '@/lib/excel-export';

type SortKey = 'product' | 'category' | 'total' | number;
type SortDirection = 'asc' | 'desc';

interface PorzionatoreTableProps {
  data: DetailedKitchenSummary[];
}

// Default column widths
const DEFAULT_WIDTHS = {
  product: 180,
  category: 100,
  total: 60,
  quantity: 50,
  unit: 80,
};

// Resize handle component
function ResizeHandle({ 
  onResize 
}: { 
  onResize: (delta: number) => void;
}) {
  const startXRef = useRef(0);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startXRef.current = e.clientX;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startXRef.current;
      onResize(delta);
      startXRef.current = moveEvent.clientX;
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onResize]);
  
  return (
    <div 
      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize 
                 hover:bg-primary/50 active:bg-primary transition-colors z-30"
      onMouseDown={handleMouseDown}
    />
  );
}

export function PorzionatoreTable({ data }: PorzionatoreTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  const [columnWidths, setColumnWidths] = useState({
    product: DEFAULT_WIDTHS.product,
    category: DEFAULT_WIDTHS.category,
    total: DEFAULT_WIDTHS.total,
    unit: DEFAULT_WIDTHS.unit,
  });

  // Calculate max quantity dynamically - NO CAP
  const maxQuantity = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(
      ...data.flatMap(s => s.breakdown.map(b => b.quantity)),
      1 // at least 1 column
    );
  }, [data]);

  const quantityColumns = useMemo(() => 
    Array.from({ length: maxQuantity }, (_, i) => i + 1), 
    [maxQuantity]
  );

  // Resize handlers
  const handleResize = useCallback((column: keyof typeof columnWidths, delta: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [column]: Math.max(40, prev[column] + delta), // Min width 40px
    }));
  }, []);

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;
      
      if (sortConfig.key === 'product') {
        aValue = a.productName.toLowerCase();
        bValue = b.productName.toLowerCase();
      } else if (sortConfig.key === 'category') {
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
      } else if (sortConfig.key === 'total') {
        aValue = a.totalQuantity;
        bValue = b.totalQuantity;
      } else {
        // Numeric column ×1, ×2, etc.
        aValue = a.breakdown.find(bd => bd.quantity === sortConfig.key)?.orderCount || 0;
        bValue = b.breakdown.find(bd => bd.quantity === sortConfig.key)?.orderCount || 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Handle sort click
  const handleSort = (key: SortKey) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        if (current.direction === 'desc') return null;
      }
      return { key, direction: 'asc' };
    });
  };

  // Sortable header component
  const SortableHeader = ({ 
    sortKey, 
    children, 
    className = '',
    isSticky = false,
    stickyPosition = '',
    width,
    onResize: onResizeHeader,
  }: { 
    sortKey: SortKey; 
    children: React.ReactNode;
    className?: string;
    isSticky?: boolean;
    stickyPosition?: string;
    width?: number;
    onResize?: (delta: number) => void;
  }) => {
    const isActive = sortConfig?.key === sortKey;
    const stickyClasses = isSticky ? `sticky ${stickyPosition} z-40 bg-muted` : '';
    
    return (
      <th 
        className={`${className} ${stickyClasses} cursor-pointer hover:bg-muted/70 transition-colors select-none relative`}
        style={width ? { width, minWidth: width } : undefined}
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-1.5 justify-center">
          {children}
          {isActive ? (
            sortConfig.direction === 'asc' 
              ? <ArrowUp className="w-3.5 h-3.5" /> 
              : <ArrowDown className="w-3.5 h-3.5" />
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
          )}
        </div>
        {onResizeHeader && <ResizeHandle onResize={onResizeHeader} />}
      </th>
    );
  };

  if (data.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 px-6">
        Nessun dato con i filtri selezionati
      </p>
    );
  }

  const totalProducts = sortedData.reduce((sum, item) => sum + item.totalQuantity, 0);
  const totalOrders = sortedData.reduce((sum, item) => 
    sum + item.breakdown.reduce((s, b) => s + b.orderCount, 0), 0
  );

  // Calculate sticky positions based on column widths
  const categoryLeft = columnWidths.product;
  const totalLeft = columnWidths.product + columnWidths.category;

  return (
    <div className="relative w-full">
      <div className="overflow-auto max-h-[calc(100vh-320px)]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-30">
            <tr className="border-b border-border bg-muted">
              {/* Fixed left columns */}
              <SortableHeader 
                sortKey="product" 
                className="text-left p-4 font-semibold uppercase text-xs tracking-widest"
                isSticky
                stickyPosition="left-0"
                width={columnWidths.product}
                onResize={(delta) => handleResize('product', delta)}
              >
                Prodotto
              </SortableHeader>
              <SortableHeader 
                sortKey="category" 
                className="text-left p-4 font-semibold uppercase text-xs tracking-widest"
                isSticky
                stickyPosition={`left-[${categoryLeft}px]`}
                width={columnWidths.category}
                onResize={(delta) => handleResize('category', delta)}
              >
                Cat
              </SortableHeader>
              <SortableHeader 
                sortKey="total" 
                className="text-center p-4 font-bold uppercase text-xs tracking-widest bg-primary/10"
                isSticky
                stickyPosition={`left-[${totalLeft}px]`}
                width={columnWidths.total}
                onResize={(delta) => handleResize('total', delta)}
              >
                Tot
              </SortableHeader>
              
              {/* Scrollable quantity columns */}
              {quantityColumns.map(q => (
                <SortableHeader 
                  key={q} 
                  sortKey={q} 
                  className="text-center p-4 font-mono text-xs border-l border-border/30"
                  width={DEFAULT_WIDTHS.quantity}
                >
                  ×{q}
                </SortableHeader>
              ))}
              
              {/* Fixed right column */}
              <th 
                className="text-right p-4 font-semibold uppercase text-xs tracking-widest border-l border-border/30 sticky right-0 z-40 bg-muted shadow-[-4px_0_8px_rgba(0,0,0,0.1)] relative"
                style={{ width: columnWidths.unit, minWidth: columnWidths.unit }}
              >
                Unità
                <ResizeHandle onResize={(delta) => handleResize('unit', delta)} />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item) => (
              <tr 
                key={item.productName} 
                className="border-b border-border/20 hover:bg-muted/30 transition-colors"
              >
                {/* Fixed left columns */}
                <td 
                  className="p-4 font-medium sticky left-0 z-10 bg-card"
                  style={{ width: columnWidths.product, minWidth: columnWidths.product }}
                >
                  {item.productName}
                </td>
                <td 
                  className="p-4 sticky z-10 bg-card"
                  style={{ left: categoryLeft, width: columnWidths.category, minWidth: columnWidths.category }}
                >
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {CATEGORY_LABELS[item.category] || item.category}
                  </span>
                </td>
                <td 
                  className="p-4 text-center bg-card sticky z-10 shadow-[4px_0_8px_rgba(0,0,0,0.1)]"
                  style={{ left: totalLeft, width: columnWidths.total, minWidth: columnWidths.total }}
                >
                  <span className="text-2xl font-bold tracking-tighter">{item.totalQuantity}</span>
                </td>
                
                {/* Scrollable quantity cells */}
                {quantityColumns.map(q => {
                  const bd = item.breakdown.find(b => b.quantity === q);
                  return (
                    <td 
                      key={q} 
                      className="p-4 text-center font-mono border-l border-border/20"
                      style={{ width: DEFAULT_WIDTHS.quantity, minWidth: DEFAULT_WIDTHS.quantity }}
                    >
                      {bd ? (
                        <span className="font-medium">{bd.orderCount}</span>
                      ) : (
                        <span className="text-muted-foreground/30">·</span>
                      )}
                    </td>
                  );
                })}
                
                {/* Fixed right column */}
                <td 
                  className="p-4 text-right border-l border-border/20 sticky right-0 z-10 bg-card shadow-[-4px_0_8px_rgba(0,0,0,0.1)]"
                  style={{ width: columnWidths.unit, minWidth: columnWidths.unit }}
                >
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {unitLabels[item.unit] || item.unit}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 z-20">
            <tr className="bg-muted border-t-2 border-border">
              <td 
                className="p-4 text-right sticky left-0 z-30 bg-muted"
                style={{ width: columnWidths.product, minWidth: columnWidths.product }}
              >
                <span className="text-xs uppercase tracking-widest font-semibold">Tot:</span>
              </td>
              <td 
                className="p-4 sticky z-30 bg-muted"
                style={{ left: categoryLeft, width: columnWidths.category, minWidth: columnWidths.category }}
              ></td>
              <td 
                className="p-4 text-center bg-muted sticky z-30 shadow-[4px_0_8px_rgba(0,0,0,0.1)]"
                style={{ left: totalLeft, width: columnWidths.total, minWidth: columnWidths.total }}
              >
                <span className="text-2xl font-bold tracking-tighter">{totalProducts}</span>
              </td>
              <td colSpan={quantityColumns.length} className="p-4 text-center border-l border-border/30">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {totalOrders} ordini totali
                </span>
              </td>
              <td 
                className="p-4 border-l border-border/30 sticky right-0 z-30 bg-muted shadow-[-4px_0_8px_rgba(0,0,0,0.1)]"
                style={{ width: columnWidths.unit, minWidth: columnWidths.unit }}
              ></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
