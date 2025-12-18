import { useState } from 'react';
import { useReservations, Reservation } from '@/hooks/useReservations';
import { format, parseISO, isToday, isTomorrow, addDays, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Calendar, 
  Users, 
  Clock, 
  Phone, 
  Check, 
  X, 
  UserCheck,
  ChevronRight,
  Filter,
  Cake,
  Heart,
  Briefcase,
  PartyPopper,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageWrapper } from '@/components/ui/PageWrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'In attesa', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  confirmed: { label: 'Confermata', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Check },
  seated: { label: 'Arrivati', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: UserCheck },
  completed: { label: 'Completata', color: 'bg-muted text-muted-foreground border-border', icon: Check },
  cancelled: { label: 'Annullata', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: X },
  no_show: { label: 'No Show', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: X },
};

const OCCASION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  birthday: { label: 'Compleanno', icon: Cake, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  anniversary: { label: 'Anniversario', icon: Heart, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  proposal: { label: 'Proposta', icon: Sparkles, color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  business: { label: 'Business', icon: Briefcase, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  other: { label: 'Evento', icon: PartyPopper, color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
};

const DATE_FILTERS = [
  { value: 'today', label: 'Oggi' },
  { value: 'tomorrow', label: 'Domani' },
  { value: 'week', label: 'Prossimi 7 giorni' },
  { value: 'all', label: 'Tutte' },
];

export default function Prenotazioni() {
  const { reservations, tables, loading, updateStatus, getTableById } = useReservations();
  const [dateFilter, setDateFilter] = useState('week');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter reservations
  const filteredReservations = reservations.filter(res => {
    const resDate = parseISO(res.reservation_date);
    const today = startOfDay(new Date());

    // Date filter
    let dateMatch = true;
    if (dateFilter === 'today') {
      dateMatch = isToday(resDate);
    } else if (dateFilter === 'tomorrow') {
      dateMatch = isTomorrow(resDate);
    } else if (dateFilter === 'week') {
      dateMatch = resDate >= today && resDate <= addDays(today, 7);
    }

    // Status filter
    const statusMatch = statusFilter === 'all' || res.status === statusFilter;

    return dateMatch && statusMatch;
  });

  // Group by date
  const groupedByDate = filteredReservations.reduce((acc, res) => {
    const date = res.reservation_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(res);
    return acc;
  }, {} as Record<string, Reservation[]>);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const result = await updateStatus(id, newStatus);
    if (result) {
      toast.success(`Stato aggiornato: ${STATUS_CONFIG[newStatus].label}`);
    } else {
      toast.error('Errore nell\'aggiornamento');
    }
  };

  const formatDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Oggi';
    if (isTomorrow(date)) return 'Domani';
    return format(date, 'EEEE d MMMM', { locale: it });
  };

  if (loading) {
    return (
      <div className="space-y-phi-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prenotazioni</h1>
          <p className="text-muted-foreground mt-1">
            {filteredReservations.length} prenotazioni
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FILTERS.map(f => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty state */}
      {filteredReservations.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nessuna prenotazione</h3>
          <p className="text-muted-foreground">
            Non ci sono prenotazioni per i filtri selezionati
          </p>
        </Card>
      )}

      {/* Reservations by date */}
      {Object.entries(groupedByDate).map(([date, dateReservations]) => (
        <div key={date} className="space-y-3">
          {/* Date header */}
          <div className="flex items-center gap-3">
            <h2 className="uppercase-label">{formatDateHeader(date)}</h2>
            <Badge variant="secondary" className="text-xs">
              {dateReservations.length}
            </Badge>
          </div>

          {/* Reservation cards */}
          <div className="grid gap-3">
            {dateReservations.map(reservation => {
              const statusConfig = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const table = getTableById(reservation.table_id);

              return (
                <Card 
                  key={reservation.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {/* Time */}
                    <div className="text-center min-w-[60px]">
                      <p className="text-2xl font-bold tracking-tight">
                        {reservation.reservation_time.slice(0, 5)}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-12 bg-border" />

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold truncate">
                          {reservation.customer_name}
                        </p>
                        <Badge className={`text-xs border ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {/* Occasion badge */}
                        {reservation.occasion_type && OCCASION_CONFIG[reservation.occasion_type] && (() => {
                          const occasionConfig = OCCASION_CONFIG[reservation.occasion_type];
                          const OccasionIcon = occasionConfig.icon;
                          return (
                            <Badge className={`text-xs border ${occasionConfig.color}`}>
                              <OccasionIcon className="w-3 h-3 mr-1" />
                              {occasionConfig.label}
                            </Badge>
                          );
                        })()}
                        {/* Cake indicator */}
                        {reservation.needs_cake && (
                          <Badge className="text-xs border bg-pink-500/20 text-pink-400 border-pink-500/30">
                            <Cake className="w-3 h-3 mr-1" />
                            Torta
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {reservation.party_size} pers.
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {reservation.customer_phone}
                        </span>
                        {table && (
                          <span className="text-primary">
                            {table.name}
                          </span>
                        )}
                      </div>

                      {/* Cake message */}
                      {reservation.cake_message && (
                        <p className="text-sm text-pink-400 mt-1 truncate">
                          🎂 "{reservation.cake_message}"
                        </p>
                      )}

                      {reservation.notes && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          Note: {reservation.notes}
                        </p>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-2">
                      {reservation.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(reservation.id, 'confirmed');
                          }}
                          title="Conferma"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      {reservation.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(reservation.id, 'seated');
                          }}
                          title="Segna arrivati"
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </PageWrapper>
  );
}
