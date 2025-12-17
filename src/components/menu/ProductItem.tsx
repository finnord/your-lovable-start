import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Product } from '@/types/order';

interface ProductItemProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleAvailable: (productId: string, available: boolean) => void;
}

export function ProductItem({
  product,
  onEdit,
  onDelete,
  onToggleAvailable,
}: ProductItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border-b border-border/50 last:border-0 bg-card hover:bg-muted/30 transition-colors ${
        !product.available ? 'opacity-50' : ''
      } ${isDragging ? 'shadow-md rounded-lg' : ''}`}
    >
      {/* Drag handle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none p-1 rounded hover:bg-muted transition-colors"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Trascina per riordinare</TooltipContent>
      </Tooltip>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {product.unit} • €{product.price.toFixed(2)}
        </p>
      </div>

      {/* Availability toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Switch
              checked={product.available}
              onCheckedChange={(checked) => onToggleAvailable(product.id, checked)}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {product.available ? 'Disattiva prodotto' : 'Attiva prodotto'}
        </TooltipContent>
      </Tooltip>

      {/* Actions */}
      <div className="flex gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Modifica prodotto</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Elimina prodotto</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
