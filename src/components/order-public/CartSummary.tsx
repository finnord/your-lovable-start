import { ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CartSummaryProps {
  totalItems: number;
  totalAmount: number;
  onProceed: () => void;
  disabled?: boolean;
  className?: string;
}

export function CartSummary({ totalItems, totalAmount, onProceed, disabled, className }: CartSummaryProps) {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-background border-t-2 border-primary p-4 shadow-lg z-40",
      className
    )}>
      <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? 'piatto' : 'piatti'}
            </p>
            <p className="text-xl font-bold">
              €{totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <Button
          size="lg"
          className="h-14 px-8 text-lg font-bold rounded-none"
          onClick={onProceed}
          disabled={disabled}
        >
          Avanti
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
