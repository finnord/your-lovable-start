import { useState, useMemo } from 'react';
import { 
  Package, 
  Calendar,
  PieChart,
  BarChart3,
  Users,
  Download,
  ChefHat,
  Scale,
  Filter,
  Layers
} from 'lucide-react';
import { PorzionatoreTable } from '@/components/PorzionatoreTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { CATEGORY_LABELS, PICKUP_DATES } from '@/lib/constants';
import {
  calculateKitchenSummary,
  calculateUnitSummary,
  calculateDetailedKitchenSummary,
  exportKitchenSummary,
  exportByUnit,
  exportAllOrders,
  exportDetailedKitchen,
  exportDetailedByProduct,
  unitLabels,
  type KitchenSummary,
  type UnitSummary,
  type DetailedKitchenSummary,
} from '@/lib/excel-export';
import { PageWrapper } from '@/components/ui/PageWrapper';

export default function Statistiche() {
  const { orders, loading: ordersLoading } = useOrders();
  const { products, loading: productsLoading } = useProducts();
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [detailDateFilter, setDetailDateFilter] = useState<string>('all');

  // Available dates from PICKUP_DATES
  const availableDates = useMemo(() => PICKUP_DATES.map(d => d.value), []);

  // Get unique categories from products
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats).sort();
  }, [products]);

  // Get unique units from products
  const units = useMemo(() => {
    const u = new Set(products.map(p => p.unit));
    return Array.from(u).sort();
  }, [products]);

  // Calculate kitchen summary with filters
  const kitchenSummary = useMemo<KitchenSummary[]>(() => {
    if (!orders.length || !products.length) return [];
    
    const filters: { dateRange?: string[]; categories?: string[] } = {};
    if (dateFilter !== 'all') filters.dateRange = [dateFilter];
    if (categoryFilter !== 'all') filters.categories = [categoryFilter];
    
    let summary = calculateKitchenSummary(orders, products, filters);
    
    if (unitFilter !== 'all') {
      summary = summary.filter(s => s.unit === unitFilter);
    }
    
    return summary;
  }, [orders, products, dateFilter, categoryFilter, unitFilter]);

  // Calculate unit summary with filters
  const unitSummary = useMemo<UnitSummary[]>(() => {
    if (!orders.length || !products.length) return [];
    
    const filters: { dateRange?: string[] } = {};
    if (dateFilter !== 'all') filters.dateRange = [dateFilter];
    
    return calculateUnitSummary(orders, products, filters);
  }, [orders, products, dateFilter]);

  // Calculate detailed kitchen summary with breakdown
  const detailedSummary = useMemo<DetailedKitchenSummary[]>(() => {
    if (!orders.length || !products.length) return [];
    
    const filters: { dateRange?: string[] } = {};
    if (detailDateFilter !== 'all') filters.dateRange = [detailDateFilter];
    
    return calculateDetailedKitchenSummary(orders, products, filters);
  }, [orders, products, detailDateFilter]);

  // Basic stats
  const stats = useMemo(() => {
    if (orders.length === 0) return null;
    
    // Products stats
    const productCounts: Record<string, { name: string; quantity: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productCounts[item.name]) {
          productCounts[item.name] = { name: item.name, quantity: 0 };
        }
        productCounts[item.name].quantity += item.quantity;
      });
    });
    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Category stats
    const categoryCounts: Record<string, { count: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.name === item.name);
        const category = product?.category || 'altro';
        if (!categoryCounts[category]) {
          categoryCounts[category] = { count: 0 };
        }
        categoryCounts[category].count += item.quantity;
      });
    });

    const totalItems = Object.values(categoryCounts).reduce((sum, c) => sum + c.count, 0);

    // Daily stats
    const dailyStats: Record<string, { orders: number }> = {};
    orders.forEach(order => {
      const date = order.deliveryDate;
      if (!dailyStats[date]) {
        dailyStats[date] = { orders: 0 };
      }
      dailyStats[date].orders++;
    });
    const sortedDays = Object.entries(dailyStats)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7);

    const uniqueCustomers = new Set(orders.map(o => o.customerPhone)).size;

    return {
      topProducts,
      categoryCounts,
      sortedDays,
      uniqueCustomers,
      totalOrders: orders.length,
      totalItems,
    };
  }, [orders, products]);

  // Export handlers
  const handleExportKitchen = () => {
    const filters: { dateRange?: string[]; categories?: string[] } = {};
    if (dateFilter !== 'all') filters.dateRange = [dateFilter];
    if (categoryFilter !== 'all') filters.categories = [categoryFilter];
    
    let summary = calculateKitchenSummary(orders, products, filters);
    if (unitFilter !== 'all') {
      summary = summary.filter(s => s.unit === unitFilter);
    }
    
    const datePart = dateFilter !== 'all' ? `-${dateFilter}` : '';
    exportKitchenSummary(summary, `cucina${datePart}`);
  };

  const handleExportByUnit = () => {
    const filters: { dateRange?: string[] } = {};
    if (dateFilter !== 'all') filters.dateRange = [dateFilter];
    
    const summary = calculateUnitSummary(orders, products, filters);
    const datePart = dateFilter !== 'all' ? `-${dateFilter}` : '';
    exportByUnit(summary, `per-unita${datePart}`);
  };

  const handleExportAll = () => {
    exportAllOrders(orders, products, 'database-completo');
  };

  const handleExportDetailed = () => {
    const datePart = detailDateFilter !== 'all' ? `-${detailDateFilter}` : '';
    exportDetailedKitchen(detailedSummary, `porzionatore${datePart}`);
  };

  const handleExportDetailedByProduct = () => {
    const datePart = detailDateFilter !== 'all' ? `-${detailDateFilter}` : '';
    exportDetailedByProduct(detailedSummary, `dettaglio-prodotti${datePart}`);
  };

  if (ordersLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats || orders.length === 0) {
    return (
      <div className="p-8 md:p-12 lg:p-16">
        <Card className="border-border/30">
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground/30 mb-6" />
            <p className="text-lg text-muted-foreground">Nessun dato disponibile</p>
            <p className="text-sm text-muted-foreground mt-2">
              Crea degli ordini per visualizzare le statistiche
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageWrapper className="max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/30 pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase">
            Statistiche
          </h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-widest">
            Analisi ordini e preparazioni
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExportAll} 
          className="gap-2 h-12 px-6 uppercase tracking-wide text-xs font-medium"
        >
          <Download className="w-4 h-4" />
          Esporta Tutto
        </Button>
      </div>

      {/* Overview Cards - Swiss Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-card border border-border/30 p-8 md:p-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Ordini Totali
          </p>
          <p className="text-6xl md:text-7xl font-bold tracking-tighter">
            {stats.totalOrders}
          </p>
        </div>

        <div className="bg-card border border-border/30 p-8 md:p-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Clienti Unici
          </p>
          <p className="text-6xl md:text-7xl font-bold tracking-tighter">
            {stats.uniqueCustomers}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="detailed" className="space-y-6">
        <TabsList className="h-14 p-1.5 bg-muted/50 rounded-none border border-border/30 grid grid-cols-4 w-full">
          <TabsTrigger 
            value="detailed" 
            className="h-full gap-2 rounded-none uppercase text-xs tracking-wide font-medium data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Porzionatore</span>
          </TabsTrigger>
          <TabsTrigger 
            value="kitchen" 
            className="h-full gap-2 rounded-none uppercase text-xs tracking-wide font-medium data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            <ChefHat className="w-4 h-4" />
            <span className="hidden sm:inline">Cucina</span>
          </TabsTrigger>
          <TabsTrigger 
            value="units" 
            className="h-full gap-2 rounded-none uppercase text-xs tracking-wide font-medium data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            <Scale className="w-4 h-4" />
            <span className="hidden sm:inline">Unità</span>
          </TabsTrigger>
          <TabsTrigger 
            value="overview" 
            className="h-full gap-2 rounded-none uppercase text-xs tracking-wide font-medium data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
        </TabsList>

        {/* Porzionatore Tab (ex Dettaglio) */}
        <TabsContent value="detailed" className="space-y-6">
          {/* Filter Bar */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 border border-border/30">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            
            <Select value={detailDateFilter} onValueChange={setDetailDateFilter}>
              <SelectTrigger className="w-[160px] rounded-none border-border/50 bg-background">
                <SelectValue placeholder="Data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le date</SelectItem>
                {availableDates.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportDetailed} 
                className="gap-2 rounded-none uppercase text-xs tracking-wide"
                title="Esporta riepilogo"
              >
                <Download className="w-4 h-4" />
                Riepilogo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportDetailedByProduct} 
                className="gap-2 rounded-none uppercase text-xs tracking-wide"
                title="Esporta con tab per ogni prodotto"
              >
                <Download className="w-4 h-4" />
                Per Prodotto
              </Button>
            </div>
          </div>

          {/* Content - Matrix Table */}
          <div className="border border-border/30 bg-card">
            <div className="p-6 border-b border-border/30">
              <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-3">
                <Layers className="w-5 h-5" />
                Breakdown Quantità — Porzionatore
              </h2>
            </div>
            
            <PorzionatoreTable data={detailedSummary} />
          </div>
        </TabsContent>

        {/* Kitchen Tab */}
        <TabsContent value="kitchen" className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 border border-border/30">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px] rounded-none border-border/50 bg-background">
                <SelectValue placeholder="Data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le date</SelectItem>
                {availableDates.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] rounded-none border-border/50 bg-background">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{CATEGORY_LABELS[c] || c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-[140px] rounded-none border-border/50 bg-background">
                <SelectValue placeholder="Unità" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                {units.map(u => (
                  <SelectItem key={u} value={u}>{unitLabels[u] || u}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportKitchen} 
              className="ml-auto gap-2 rounded-none uppercase text-xs tracking-wide"
            >
              <Download className="w-4 h-4" />
              Esporta
            </Button>
          </div>

          {/* Content */}
          <div className="border border-border/30 bg-card">
            <div className="p-6 border-b border-border/30">
              <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-3">
                <ChefHat className="w-5 h-5" />
                Preparazioni Cucina
              </h2>
            </div>
            
            <div className="p-6">
              {kitchenSummary.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun dato con i filtri selezionati
                </p>
              ) : (
                <div className="space-y-8">
                  {Object.entries(
                    kitchenSummary.reduce<Record<string, KitchenSummary[]>>((acc, item) => {
                      if (!acc[item.category]) acc[item.category] = [];
                      acc[item.category].push(item);
                      return acc;
                    }, {})
                  ).map(([category, items]) => (
                    <div key={category} className="space-y-4">
                      <h4 className="text-xs font-semibold uppercase tracking-widest text-primary border-b border-primary/30 pb-2">
                        {CATEGORY_LABELS[category] || category}
                      </h4>
                      <div className="grid gap-2">
                        {items.map(item => (
                          <div 
                            key={item.name}
                            className="flex items-center justify-between p-4 bg-muted/30"
                          >
                            <span className="font-medium">{item.name}</span>
                            <div className="flex items-baseline gap-3">
                              <span className="text-2xl font-bold tracking-tighter">
                                {item.quantity}
                              </span>
                              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                {unitLabels[item.unit] || item.unit}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-6">
          {/* Filter Bar */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 border border-border/30">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px] rounded-none border-border/50 bg-background">
                <SelectValue placeholder="Data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le date</SelectItem>
                {availableDates.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportByUnit} 
              className="ml-auto gap-2 rounded-none uppercase text-xs tracking-wide"
            >
              <Download className="w-4 h-4" />
              Esporta
            </Button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {unitSummary.map(u => (
              <div key={u.unit} className="border border-border/30 bg-card">
                <div className="p-6 border-b border-border/30 flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    {unitLabels[u.unit] || u.unit}
                  </span>
                  <span className="text-4xl font-bold tracking-tighter">
                    {u.totalQuantity}
                  </span>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {u.products.map(p => (
                      <div 
                        key={p.name}
                        className="flex items-center justify-between text-sm py-2 border-b border-border/20 last:border-0"
                      >
                        <span className="text-muted-foreground">{p.name}</span>
                        <span className="font-bold">{p.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="border border-border/30 bg-card">
              <div className="p-6 border-b border-border/30">
                <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-3">
                  <Package className="w-5 h-5" />
                  Prodotti Più Venduti
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.topProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center gap-4 pb-4 border-b border-border/20 last:border-0 last:pb-0">
                      <span className="text-4xl font-bold text-muted-foreground/30 w-12">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          {product.quantity} unità
                        </p>
                      </div>
                      <div className="w-24 h-3 bg-muted rounded-sm overflow-hidden flex-shrink-0">
                        <div 
                          className="h-full bg-primary"
                          style={{ 
                            width: `${(product.quantity / stats.topProducts[0].quantity) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="border border-border/30 bg-card">
              <div className="p-6 border-b border-border/30">
                <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-3">
                  <PieChart className="w-5 h-5" />
                  Vendite per Categoria
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Object.entries(stats.categoryCounts)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([category, data]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{CATEGORY_LABELS[category] || category}</span>
                          <span className="text-muted-foreground">{data.count} pz</span>
                        </div>
                        <div className="w-full h-3 bg-muted rounded-sm overflow-hidden">
                          <div 
                            className="h-full bg-accent"
                            style={{ 
                              width: `${(data.count / stats.totalItems) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Daily Trend */}
            <div className="lg:col-span-2 border border-border/30 bg-card">
              <div className="p-6 border-b border-border/30">
                <h2 className="text-lg font-bold uppercase tracking-wide flex items-center gap-3">
                  <Calendar className="w-5 h-5" />
                  Ordini per Data
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.sortedDays.map(([date, data]) => (
                    <div key={date} className="p-4 bg-muted/30 border-l-2 border-primary">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                        {new Date(date).toLocaleDateString('it-IT', { 
                          weekday: 'short', 
                          day: 'numeric',
                          month: 'short'
                        })}
                      </p>
                      <p className="text-3xl font-bold tracking-tighter">
                        {data.orders}
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ordini
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
