import { useState } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { Check, ArrowRight, ArrowLeft, Cake, Heart, Gift, Briefcase, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { VoiceNoteInput } from '@/components/VoiceNoteInput';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Generate time slots
const generateTimeSlots = (start: string, end: string, intervalMinutes: number = 30) => {
  const slots: string[] = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  while (currentMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    currentMinutes += intervalMinutes;
  }
  
  return slots;
};

const LUNCH_SLOTS = generateTimeSlots('12:00', '14:30');
const DINNER_SLOTS = generateTimeSlots('19:00', '22:00');

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

type Step = 'party' | 'datetime' | 'occasion' | 'details' | 'confirm';

const STEPS: Step[] = ['party', 'datetime', 'occasion', 'details', 'confirm'];

type OccasionType = 'compleanno' | 'anniversario' | 'proposta' | 'business' | 'altro' | null;

const OCCASIONS: { type: OccasionType; label: string; icon: typeof Cake }[] = [
  { type: 'compleanno', label: 'Compleanno', icon: Cake },
  { type: 'anniversario', label: 'Anniversario', icon: Heart },
  { type: 'proposta', label: 'Proposta', icon: Gift },
  { type: 'business', label: 'Business', icon: Briefcase },
  { type: 'altro', label: 'Altro', icon: Sparkles },
];

export default function PublicBooking() {
  const [step, setStep] = useState<Step>('party');
  const [partySize, setPartySize] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [occasionType, setOccasionType] = useState<OccasionType>(null);
  const [needsCake, setNeedsCake] = useState(false);
  const [cakeMessage, setCakeMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [reservationNumber, setReservationNumber] = useState<string | null>(null);

  const disabledDays = { before: startOfDay(new Date()) };
  const maxDate = addDays(new Date(), 30);

  const canProceed = () => {
    switch (step) {
      case 'party': return partySize !== null;
      case 'datetime': return selectedDate && selectedTime;
      case 'occasion': return true; // Optional step
      case 'details': return customerName.trim() && customerPhone.trim();
      default: return true;
    }
  };

  const nextStep = () => {
    if (step === 'party') setStep('datetime');
    else if (step === 'datetime') setStep('occasion');
    else if (step === 'occasion') setStep('details');
    else if (step === 'details') setStep('confirm');
  };

  const prevStep = () => {
    if (step === 'datetime') setStep('party');
    else if (step === 'occasion') setStep('datetime');
    else if (step === 'details') setStep('occasion');
    else if (step === 'confirm') setStep('details');
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !partySize) return;
    
    setIsSubmitting(true);
    
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || null,
        reservation_date: format(selectedDate, 'yyyy-MM-dd'),
        reservation_time: selectedTime,
        party_size: partySize,
        notes: notes.trim() || null,
        occasion_type: occasionType,
        needs_cake: needsCake,
        cake_message: cakeMessage.trim() || null,
        status: 'pending',
        reservation_number: '',
      } as any)
      .select('reservation_number')
      .single();
    
    setIsSubmitting(false);
    
    if (error) {
      console.error('[PublicBooking] Error creating reservation:', error);
      toast.error('Errore durante la prenotazione. Riprova.');
      return;
    }
    
    setReservationNumber(data.reservation_number);
    setIsComplete(true);
  };

  const currentStepIndex = STEPS.indexOf(step);

  // Success screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="py-12 px-8">
          <h1 className="text-[4rem] leading-none font-bold tracking-tighter text-center uppercase">
            MARE MIO
          </h1>
        </header>
        
        <main className="flex-1 flex items-center justify-center px-8 pb-16">
          <div className="text-center space-y-12 max-w-md w-full">
            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto border border-green-500/20">
              <Check className="w-12 h-12 text-green-500" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-[2.5rem] leading-tight font-bold tracking-tight uppercase">
                Confermata
              </h2>
              <p className="text-muted-foreground tracking-wide">
                La tua prenotazione è stata registrata
              </p>
            </div>
            
            <div className="bg-card border border-border p-8 space-y-6">
              <div className="text-[3rem] font-bold text-primary tracking-tight">
                #{reservationNumber}
              </div>
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Data</span>
                  <span className="font-medium">
                    {selectedDate && format(selectedDate, "d MMMM", { locale: it })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Orario</span>
                  <span className="font-medium font-mono">{selectedTime}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Persone</span>
                  <span className="font-medium">{partySize}</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground tracking-wide">
              Ti contatteremo per confermare
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-12 px-8">
        <h1 className="text-[4rem] leading-none font-bold tracking-tighter text-center uppercase">
          MARE MIO
        </h1>
      </header>
      
      {/* Progress indicator - minimal Swiss style */}
      <div className="px-8 pb-8">
        <div className="flex items-center justify-center gap-1 max-w-xs mx-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <span 
                className={cn(
                  "text-sm font-mono transition-colors",
                  i <= currentStepIndex 
                    ? "text-foreground" 
                    : "text-muted-foreground/40"
                )}
              >
                {i + 1}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "w-8 h-px mx-1.5 transition-colors",
                  i < currentStepIndex
                    ? "bg-foreground"
                    : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <main className="flex-1 px-8 pb-8 max-w-lg mx-auto w-full">
        {/* Step: Party Size */}
        {step === 'party' && (
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-[2.5rem] leading-tight font-bold tracking-tight uppercase">
                Quante<br />persone?
              </h2>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Seleziona ospiti
              </p>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {PARTY_SIZES.map(size => (
                <Button
                  key={size}
                  variant="outline"
                  className={cn(
                    "h-16 text-xl font-bold border transition-all",
                    partySize === size 
                      ? "bg-foreground text-background border-foreground hover:bg-foreground hover:text-background" 
                      : "border-border/50 hover:border-foreground"
                  )}
                  onClick={() => setPartySize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
            
            {partySize && partySize >= 6 && (
              <p className="text-xs text-muted-foreground text-center tracking-wide">
                Per gruppi numerosi ti contatteremo per confermare.
              </p>
            )}
          </div>
        )}
        
        {/* Step: Date & Time */}
        {step === 'datetime' && (
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-[2.5rem] leading-tight font-bold tracking-tight uppercase">
                Quando?
              </h2>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Scegli data e orario
              </p>
            </div>
            
            {/* Calendar */}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(null);
                }}
                disabled={disabledDays}
                toDate={maxDate}
                locale={it}
                className="rounded-none border border-border/50"
              />
            </div>
            
            {/* Time slots */}
            {selectedDate && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Pranzo
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {LUNCH_SLOTS.map(time => (
                      <Button
                        key={time}
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "font-mono text-sm h-10 border transition-all",
                          selectedTime === time 
                            ? "bg-foreground text-background border-foreground hover:bg-foreground hover:text-background" 
                            : "border-border/50 hover:border-foreground"
                        )}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Cena
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {DINNER_SLOTS.map(time => (
                      <Button
                        key={time}
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "font-mono text-sm h-10 border transition-all",
                          selectedTime === time 
                            ? "bg-foreground text-background border-foreground hover:bg-foreground hover:text-background" 
                            : "border-border/50 hover:border-foreground"
                        )}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Step: Occasion */}
        {step === 'occasion' && (
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-[2.5rem] leading-tight font-bold tracking-tight uppercase">
                Festeggi<br />qualcosa?
              </h2>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Opzionale
              </p>
            </div>
            
            <div className="space-y-4">
              {OCCASIONS.map(({ type, label, icon: Icon }) => (
                <Button
                  key={type}
                  variant="outline"
                  className={cn(
                    "w-full h-14 justify-start gap-4 border transition-all",
                    occasionType === type 
                      ? "bg-foreground text-background border-foreground hover:bg-foreground hover:text-background" 
                      : "border-border/50 hover:border-foreground"
                  )}
                  onClick={() => {
                    setOccasionType(type);
                    if (!type) {
                      setNeedsCake(false);
                      setCakeMessage('');
                    }
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm uppercase tracking-widest">{label}</span>
                </Button>
              ))}
              
              <Button
                variant="outline"
                className={cn(
                  "w-full h-14 justify-start gap-4 border transition-all",
                  occasionType === null 
                    ? "bg-foreground text-background border-foreground hover:bg-foreground hover:text-background" 
                    : "border-border/50 hover:border-foreground"
                )}
                onClick={() => {
                  setOccasionType(null);
                  setNeedsCake(false);
                  setCakeMessage('');
                }}
              >
                <X className="w-5 h-5" />
                <span className="text-sm uppercase tracking-widest">Nessuna occasione</span>
              </Button>
            </div>
            
            {occasionType && (
              <div className="space-y-6 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Vuoi una torta?
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 px-6 border transition-all",
                      needsCake 
                        ? "bg-foreground text-background border-foreground hover:bg-foreground hover:text-background" 
                        : "border-border/50 hover:border-foreground"
                    )}
                    onClick={() => {
                      setNeedsCake(!needsCake);
                      if (needsCake) setCakeMessage('');
                    }}
                  >
                    <Cake className="w-4 h-4 mr-2" />
                    {needsCake ? 'Sì' : 'No'}
                  </Button>
                </div>
                
                {needsCake && (
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Messaggio sulla torta
                    </Label>
                    <Input
                      value={cakeMessage}
                      onChange={(e) => setCakeMessage(e.target.value)}
                      placeholder="Es: Buon compleanno Marco!"
                      className="h-12 border-border/50 focus:border-foreground rounded-none"
                      maxLength={50}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Step: Customer Details */}
        {step === 'details' && (
          <div className="space-y-12">
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
                  Nome *
                </Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Mario Rossi"
                  autoComplete="name"
                  className="h-12 border-border/50 focus:border-foreground rounded-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Telefono *
                </Label>
                <Input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+39 333 1234567"
                  autoComplete="tel"
                  className="h-12 border-border/50 focus:border-foreground rounded-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Email
                </Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="mario@email.com"
                  autoComplete="email"
                  className="h-12 border-border/50 focus:border-foreground rounded-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Note
                </Label>
                <VoiceNoteInput
                  value={notes}
                  onChange={setNotes}
                  placeholder="Allergie, seggiolone, occasione speciale..."
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Step: Confirmation */}
        {step === 'confirm' && (
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-[2.5rem] leading-tight font-bold tracking-tight uppercase">
                Conferma
              </h2>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Verifica i dettagli
              </p>
            </div>
            
            <div className="border border-border/50 divide-y divide-border/50">
              <div className="p-5 flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Data</span>
                <span className="font-medium">
                  {selectedDate && format(selectedDate, "EEEE d MMMM", { locale: it })}
                </span>
              </div>
              <div className="p-5 flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Orario</span>
                <span className="font-medium font-mono">{selectedTime}</span>
              </div>
              <div className="p-5 flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Persone</span>
                <span className="font-medium">{partySize}</span>
              </div>
              <div className="p-5 flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Nome</span>
                <span className="font-medium">{customerName}</span>
              </div>
              <div className="p-5 flex justify-between items-center">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Telefono</span>
                <span className="font-medium font-mono">{customerPhone}</span>
              </div>
              {occasionType && (
                <div className="p-5 flex justify-between items-center">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Occasione</span>
                  <span className="font-medium capitalize">{occasionType}</span>
                </div>
              )}
              {needsCake && (
                <div className="p-5 flex justify-between items-center">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Torta</span>
                  <span className="font-medium">{cakeMessage || 'Sì'}</span>
                </div>
              )}
              {notes && (
                <div className="p-5">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Note</span>
                  <span className="text-sm">{notes}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Footer with navigation */}
      <footer className="p-8 border-t border-border/30">
        <div className="max-w-lg mx-auto flex gap-4">
          {step !== 'party' && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1 h-14 uppercase tracking-widest text-sm border-border/50 hover:border-foreground rounded-none"
            >
              <ArrowLeft className="w-4 h-4 mr-3" />
              Indietro
            </Button>
          )}
          
          {step !== 'confirm' ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex-1 h-14 uppercase tracking-widest text-sm rounded-none"
            >
              Avanti
              <ArrowRight className="w-4 h-4 ml-3" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 h-14 uppercase tracking-widest text-sm rounded-none"
            >
              {isSubmitting ? 'Invio...' : 'Conferma'}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}