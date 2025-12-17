import { useState } from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  ClipboardList, 
  BarChart3,
  Users,
  UtensilsCrossed,
  Sparkles,
  CalendarDays,
  TableProperties,
  Map
} from 'lucide-react';
import { WhatsNewDialog } from '@/components/WhatsNewDialog';
import { NavLink } from '@/components/NavLink';
import { useOrders } from '@/hooks/useOrders';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const ordiniMenuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Nuovo Ordine', url: '/nuovo-ordine', icon: Plus },
  { title: 'Gestione Ordini', url: '/ordini', icon: ClipboardList },
  { title: 'Statistiche', url: '/statistiche', icon: BarChart3 },
];

const ristoranteMenuItems = [
  { title: 'Prenotazioni', url: '/prenotazioni', icon: CalendarDays },
  { title: 'Tavoli', url: '/tavoli', icon: TableProperties },
  { title: 'Mappa', url: '/tavoli/mappa', icon: Map },
];

const anagraficaMenuItems = [
  { title: 'Clienti', url: '/clienti', icon: Users },
  { title: 'Gestione Menu', url: '/gestione-menu', icon: UtensilsCrossed },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { orders } = useOrders();
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);

  // Stats - Totale ordini
  const totalOrders = orders.length;

  return (
    <Sidebar className="border-r border-border bg-sidebar-background">
      {/* Header - with logo */}
      <SidebarHeader className="p-6 pb-4">
        {!collapsed && (
          <div className="space-y-4">
            {/* Logo area */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
                <span className="text-lg font-bold text-sidebar-primary">🐟</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-sidebar-foreground">MARE MIO</h1>
                <p className="text-xs text-sidebar-foreground/60">Natale 2025</p>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-full bg-sidebar-primary/20 flex items-center justify-center mx-auto">
            <span className="text-lg">🐟</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-6">
        {/* Total Orders - Swiss style */}
        {!collapsed && (
          <div className="mb-10 pb-8 border-b border-border">
            <p className="uppercase-label mb-2">Totale</p>
            <p className="number-display text-primary">
              {totalOrders}
            </p>
            <p className="text-sm text-muted-foreground mt-1">ordini</p>
          </div>
        )}

        {/* Ordini Natalizi */}
        <SidebarGroup>
          {!collapsed && (
            <p className="uppercase-label mb-4">Ordini Natalizi</p>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {ordiniMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/'}
                      className="flex items-center gap-4 px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 rounded"
                      activeClassName="text-foreground bg-muted"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Ristorante */}
        <SidebarGroup>
          {!collapsed && (
            <p className="uppercase-label mb-4 mt-6">Ristorante</p>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {ristoranteMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-4 px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 rounded"
                      activeClassName="text-foreground bg-muted"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Anagrafica */}
        <SidebarGroup>
          {!collapsed && (
            <p className="uppercase-label mb-4 mt-6">Anagrafica</p>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {anagraficaMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-4 px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 rounded"
                      activeClassName="text-foreground bg-muted"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-border">
        {!collapsed && (
          <div className="space-y-4">
            <button
              onClick={() => setWhatsNewOpen(true)}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
            >
              <Sparkles className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
              <span>Novità</span>
            </button>
            <p className="uppercase-label text-center">
              © 2025
            </p>
          </div>
        )}
        {collapsed && (
          <button
            onClick={() => setWhatsNewOpen(true)}
            className="w-10 h-10 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors mx-auto"
            title="Novità"
          >
            <Sparkles className="w-5 h-5" strokeWidth={1.5} />
          </button>
        )}
      </SidebarFooter>

      <WhatsNewDialog open={whatsNewOpen} onOpenChange={setWhatsNewOpen} />
    </Sidebar>
  );
}
