import { cn } from '@/lib/utils';
import { Product } from '@/types/order';

interface ProductButtonProps {
  product: Product;
  onClick: () => void;
  variant?: 'default' | 'hot';
}

const unitLabels: Record<string, string> = {
  etto: 'etto',
  pezzo: 'pz',
  porzione: 'porz',
};

export function ProductButton({ product, onClick, variant = 'default' }: ProductButtonProps) {
  const isHot = variant === 'hot';

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 border border-border rounded transition-all",
        "hover:border-primary/50 hover:bg-muted/30 active:bg-muted/50",
        "focus:outline-none focus:ring-1 focus:ring-primary/50",
        isHot && "border-accent/30 bg-accent/5 hover:border-accent/50 hover:bg-accent/10"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-sm text-foreground">
          {product.name}
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-wide flex-shrink-0">
          {unitLabels[product.unit] || product.unit}
        </span>
      </div>
    </button>
  );
}
