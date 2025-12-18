import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  description: string | null;
  category: string;
}

interface Category {
  name: string;
  label: string;
}

interface MenuGridProps {
  products: Product[];
  categories: Category[];
  getItemQuantity: (productId: string) => number;
  onAdd: (product: Product) => void;
  onRemove: (productId: string) => void;
}

export function MenuGrid({ products, categories, getItemQuantity, onAdd, onRemove }: MenuGridProps) {
  // Group products by category
  const productsByCategory = categories.map(cat => ({
    ...cat,
    products: products.filter(p => p.category === cat.name)
  })).filter(cat => cat.products.length > 0);

  return (
    <div className="space-y-10">
      {productsByCategory.map(category => (
        <div key={category.name} className="space-y-4">
          {/* Category header */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {category.name === 'antipasti' && '🦐'}
              {category.name === 'primi' && '🍝'}
              {category.name === 'secondi' && '🐟'}
              {category.name === 'contorni' && '🥗'}
              {category.name === 'dolci' && '🍰'}
            </span>
            <h3 className="text-lg font-bold uppercase tracking-wider">
              {category.label}
            </h3>
          </div>

          {/* Products */}
          <div className="space-y-3">
            {category.products.map(product => {
              const quantity = getItemQuantity(product.id);
              const isSelected = quantity > 0;

              return (
                <div
                  key={product.id}
                  className={cn(
                    "border p-4 transition-all",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border/50 hover:border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg leading-tight">
                        {product.name}
                      </h4>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <p className="text-primary font-bold mt-2">
                        €{product.price.toFixed(2)}
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                          /{product.unit}
                        </span>
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 rounded-none border-2 text-lg font-bold"
                            onClick={() => onRemove(product.id)}
                          >
                            <Minus className="h-5 w-5" />
                          </Button>
                          <span className="w-10 text-center text-xl font-bold">
                            {quantity}
                          </span>
                          <Button
                            variant="default"
                            size="icon"
                            className="h-12 w-12 rounded-none text-lg font-bold"
                            onClick={() => onAdd(product)}
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 rounded-none border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                          onClick={() => onAdd(product)}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
