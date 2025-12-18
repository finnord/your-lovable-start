import { Check, X, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DraftItem, ConfidenceLevel } from '@/lib/order-extraction';
import { Product } from '@/types/order';

interface DraftItemRowProps {
  item: DraftItem;
  products: Product[];
  onToggleSelect: () => void;
  onUpdateQuantity: (quantity: number) => void;
  onChangeProduct: (productId: string) => void;
  onRemove: () => void;
}

const confidenceConfig: Record<ConfidenceLevel, { icon: typeof Check; color: string; label: string }> = {
  high: { icon: Check, color: 'text-green-500', label: 'Match esatto' },
  medium: { icon: AlertTriangle, color: 'text-yellow-500', label: 'Match parziale' },
  low: { icon: X, color: 'text-red-500', label: 'Non riconosciuto' },
};

export function DraftItemRow({
  item,
  products,
  onToggleSelect,
  onUpdateQuantity,
  onChangeProduct,
  onRemove,
}: DraftItemRowProps) {
  const config = confidenceConfig[item.confidence];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-all",
      item.selected 
        ? "bg-primary/5 border-primary/30" 
        : "bg-muted/30 border-border/50 opacity-60"
    )}>
      {/* Selection checkbox */}
      <Checkbox
        checked={item.selected}
        onCheckedChange={onToggleSelect}
        disabled={!item.matchedProduct}
      />

      {/* Confidence indicator */}
      <div className={cn("flex-shrink-0", config.color)} title={config.label}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Extracted name (original) */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground truncate">
          "{item.extractedName}"
        </div>
        
        {/* Product selector */}
        <Select
          value={item.matchedProduct?.id || ''}
          onValueChange={onChangeProduct}
        >
          <SelectTrigger className="h-8 mt-1 text-sm">
            <SelectValue placeholder="Seleziona prodotto..." />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} - €{product.price.toFixed(2)}/{product.unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
        >
          -
        </Button>
        <Input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => onUpdateQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-14 h-7 text-center text-sm"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onUpdateQuantity(item.quantity + 1)}
        >
          +
        </Button>
      </div>

      {/* Price */}
      {item.matchedProduct && (
        <div className="text-sm font-medium w-20 text-right">
          €{(item.matchedProduct.price * item.quantity).toFixed(2)}
        </div>
      )}

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
