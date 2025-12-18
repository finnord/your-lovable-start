import { format, addDays, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { Truck, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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

const LUNCH_SLOTS = generateTimeSlots('11:00', '14:00');
const DINNER_SLOTS = generateTimeSlots('17:00', '20:00');

interface DeliveryStepProps {
  deliveryType: 'ritiro' | 'consegna';
  deliveryDate: Date | undefined;
  deliveryTime: string | null;
  deliveryAddress: string;
  onTypeChange: (type: 'ritiro' | 'consegna') => void;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  onAddressChange: (address: string) => void;
}

export function DeliveryStep({
  deliveryType,
  deliveryDate,
  deliveryTime,
  deliveryAddress,
  onTypeChange,
  onDateChange,
  onTimeChange,
  onAddressChange,
}: DeliveryStepProps) {
  const disabledDays = { before: startOfDay(addDays(new Date(), 1)) }; // Tomorrow minimum
  const maxDate = addDays(new Date(), 14); // 2 weeks max

  return (
    <div className="space-y-10">
      <div className="text-center space-y-4">
        <h2 className="text-[2.5rem] leading-tight font-bold tracking-tight uppercase">
          Ritiro o<br />consegna?
        </h2>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Scegli come ricevere l'ordine
        </p>
      </div>

      {/* Delivery type toggle */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className={cn(
            "h-20 flex-col gap-2 border-2 rounded-none transition-all",
            deliveryType === 'ritiro'
              ? "bg-foreground text-background border-foreground"
              : "border-border/50 hover:border-foreground"
          )}
          onClick={() => onTypeChange('ritiro')}
        >
          <Store className="h-6 w-6" />
          <span className="text-lg font-bold">Ritiro</span>
        </Button>
        <Button
          variant="outline"
          className={cn(
            "h-20 flex-col gap-2 border-2 rounded-none transition-all",
            deliveryType === 'consegna'
              ? "bg-foreground text-background border-foreground"
              : "border-border/50 hover:border-foreground"
          )}
          onClick={() => onTypeChange('consegna')}
        >
          <Truck className="h-6 w-6" />
          <span className="text-lg font-bold">Consegna</span>
        </Button>
      </div>

      {/* Address for delivery */}
      {deliveryType === 'consegna' && (
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Indirizzo di consegna *
          </Label>
          <Input
            value={deliveryAddress}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Via Roma 1, Napoli"
            className="h-14 text-lg border-border/50 focus:border-foreground rounded-none"
          />
        </div>
      )}

      {/* Calendar */}
      <div className="space-y-4">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground block text-center">
          Scegli la data
        </Label>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={deliveryDate}
            onSelect={(date) => {
              onDateChange(date);
              onTimeChange('');
            }}
            disabled={disabledDays}
            toDate={maxDate}
            locale={it}
            className="rounded-none border border-border/50"
          />
        </div>
      </div>

      {/* Time slots */}
      {deliveryDate && (
        <div className="space-y-8">
          <div className="space-y-4">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Pranzo (11:00 - 14:00)
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {LUNCH_SLOTS.map(time => (
                <Button
                  key={time}
                  variant="outline"
                  size="sm"
                  onClick={() => onTimeChange(time)}
                  className={cn(
                    "font-mono text-base h-12 border-2 transition-all rounded-none",
                    deliveryTime === time 
                      ? "bg-foreground text-background border-foreground" 
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
              Cena (17:00 - 20:00)
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {DINNER_SLOTS.map(time => (
                <Button
                  key={time}
                  variant="outline"
                  size="sm"
                  onClick={() => onTimeChange(time)}
                  className={cn(
                    "font-mono text-base h-12 border-2 transition-all rounded-none",
                    deliveryTime === time 
                      ? "bg-foreground text-background border-foreground" 
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
  );
}
