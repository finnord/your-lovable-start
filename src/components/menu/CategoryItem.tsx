import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Category } from '@/hooks/useCategories';

interface CategoryItemProps {
  category: Category;
  productCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  children: React.ReactNode;
}

export function CategoryItem({
  category,
  productCount,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  children,
}: CategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

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
      className={`border border-border rounded-lg bg-card ${isDragging ? 'shadow-lg' : ''}`}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className="flex items-center gap-3 p-4">
          {/* Drag handle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing touch-none p-1 rounded hover:bg-muted transition-colors"
              >
                <GripVertical className="w-5 h-5 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Trascina per riordinare</TooltipContent>
          </Tooltip>

          {/* Expand/collapse trigger */}
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="font-semibold text-lg">{category.label}</span>
              <span className="text-sm text-muted-foreground">
                ({productCount} {productCount === 1 ? 'prodotto' : 'prodotti'})
              </span>
            </button>
          </CollapsibleTrigger>

          {/* Actions */}
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(category);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Modifica categoria</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(category);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Elimina categoria</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t border-border bg-muted/20">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
