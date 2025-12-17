import { Order } from '@/types/order';
import { Package, Euro } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStatsProps {
  orders: Order[];
  loading?: boolean;
}

export function DashboardStats({ orders, loading }: DashboardStatsProps) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  const stats = [
    {
      label: 'Ordini Totali',
      value: totalOrders,
      icon: Package,
      color: 'from-primary/20 to-primary/5 border-primary/30',
      iconColor: 'text-primary',
    },
    {
      label: 'Fatturato',
      value: `€${totalRevenue.toFixed(2)}`,
      icon: Euro,
      color: 'from-accent/20 to-accent/5 border-accent/30',
      iconColor: 'text-accent',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.color} border p-5 transition-smooth hover-lift`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
            <stat.icon className={`h-10 w-10 ${stat.iconColor} opacity-80`} />
          </div>
        </div>
      ))}
    </div>
  );
}
