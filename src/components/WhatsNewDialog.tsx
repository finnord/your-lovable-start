import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Printer, 
  ChevronDown, 
  LayoutGrid, 
  GripVertical, 
  CheckSquare,
  Camera
} from 'lucide-react';

interface WhatsNewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const features = [
  {
    icon: Camera,
    title: 'Import Foto BETA',
    description: 'In Nuovo Ordine, clicca su "Importa" per caricare foto del menù compilato a mano. L\'AI riconosce automaticamente i prodotti selezionati.',
  },
  {
    icon: Printer,
    title: 'Stampa Etichette in Blocco',
    description: 'Vai in Gestione Ordini, seleziona più ordini con le caselle di spunta, e clicca "Stampa Etichette" dalla barra in basso.',
  },
  {
    icon: ChevronDown,
    title: 'Ordini Espandibili',
    description: 'Clicca su qualsiasi ordine per espanderlo e vedere i prodotti ordinati senza aprire finestre.',
  },
  {
    icon: LayoutGrid,
    title: 'Tabella Porzionatore',
    description: 'In Statistiche → Dettaglio Cucina, vedi le quantità in formato matrice. Clicca sulle intestazioni colonna per ordinare.',
  },
  {
    icon: GripVertical,
    title: 'Gestione Menu Drag & Drop',
    description: 'Trascina categorie e prodotti per riordinarli. Clicca su una categoria per espanderla.',
  },
  {
    icon: CheckSquare,
    title: 'Selezione Multipla Ordini',
    description: 'Usa le caselle di spunta per selezionare più ordini e compiere azioni in blocco.',
  },
];

export function WhatsNewDialog({ open, onOpenChange }: WhatsNewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Novità dell'App
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Ciao Chiara! 👋 Ecco le ultime funzionalità aggiunte
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {features.map((feature) => (
            <div 
              key={feature.title} 
              className="flex gap-4 items-start"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-right mb-4 italic">
            — Flutur
          </p>
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full"
          >
            Ho capito
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
