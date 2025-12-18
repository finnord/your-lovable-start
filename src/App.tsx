import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import NuovoOrdine from "./pages/NuovoOrdine";
import ModificaOrdine from "./pages/ModificaOrdine";
import GestioneOrdini from "./pages/GestioneOrdini";
import Statistiche from "./pages/Statistiche";
import Clienti from "./pages/Clienti";
import GestioneMenu from "./pages/GestioneMenu";
import Prenotazioni from "./pages/Prenotazioni";
import Tavoli from "./pages/Tavoli";
import TavoliMappa from "./pages/TavoliMappa";
import PublicBooking from "./pages/PublicBooking";
import PublicOrder from "./pages/PublicOrder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Main app layout with sidebar
const AppLayout = () => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-border/40 bg-card/50 backdrop-blur-sm flex items-center px-phi-4 sticky top-0 z-10">
          <SidebarTrigger className="mr-phi-3" />
          <div className="flex-1" />
        </header>
        
        {/* Content */}
        <div className="flex-1 p-phi-4 lg:p-phi-6">
          <Routes>
            {/* Ordini Natalizi */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/nuovo-ordine" element={<NuovoOrdine />} />
            <Route path="/modifica-ordine/:id" element={<ModificaOrdine />} />
            <Route path="/ordini" element={<GestioneOrdini />} />
            <Route path="/statistiche" element={<Statistiche />} />
            
            {/* Ristorante */}
            <Route path="/prenotazioni" element={<Prenotazioni />} />
            <Route path="/tavoli" element={<Tavoli />} />
            <Route path="/tavoli/mappa" element={<TavoliMappa />} />
            
            {/* Anagrafica */}
            <Route path="/clienti" element={<Clienti />} />
            <Route path="/gestione-menu" element={<GestioneMenu />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public pages - isolated from main app */}
          <Route path="/prenota" element={<PublicBooking />} />
          <Route path="/ordina" element={<PublicOrder />} />
          
          {/* Main app with sidebar layout */}
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
