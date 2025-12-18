import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { VoiceNoteInput } from '@/components/VoiceNoteInput';

interface CustomerStepProps {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
  onEmailChange: (email: string) => void;
  onNotesChange: (notes: string) => void;
}

export function CustomerStep({
  customerName,
  customerPhone,
  customerEmail,
  notes,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  onNotesChange,
}: CustomerStepProps) {
  return (
    <div className="space-y-10">
      <div className="text-center space-y-4">
        <h2 className="text-[2.5rem] leading-tight font-bold tracking-tight uppercase">
          I tuoi<br />dati
        </h2>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Come possiamo contattarti
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Nome e Cognome *
          </Label>
          <Input
            value={customerName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Mario Rossi"
            autoComplete="name"
            className="h-14 text-lg border-border/50 focus:border-foreground rounded-none"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Telefono *
          </Label>
          <Input
            type="tel"
            value={customerPhone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="+39 333 1234567"
            autoComplete="tel"
            className="h-14 text-lg border-border/50 focus:border-foreground rounded-none"
          />
          <p className="text-sm text-muted-foreground">
            Ti chiameremo per confermare l'ordine
          </p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Email (opzionale)
          </Label>
          <Input
            type="email"
            value={customerEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="mario@email.com"
            autoComplete="email"
            className="h-14 text-lg border-border/50 focus:border-foreground rounded-none"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Note (allergie, richieste speciali...)
          </Label>
          <VoiceNoteInput
            value={notes}
            onChange={onNotesChange}
            placeholder="Allergie, intolleranze, richieste speciali..."
            className="min-h-[100px] text-lg"
          />
          <p className="text-sm text-muted-foreground">
            Puoi anche dettare premendo il microfono 🎤
          </p>
        </div>
      </div>
    </div>
  );
}
