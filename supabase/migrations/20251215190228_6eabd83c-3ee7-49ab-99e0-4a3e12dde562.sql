-- =====================================================
-- SISTEMA PRENOTAZIONI TAVOLI - Mare Mio
-- =====================================================

-- Tabella impostazioni ristorante (singleton)
CREATE TABLE public.restaurant_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lunch_start time NOT NULL DEFAULT '12:00',
  lunch_end time NOT NULL DEFAULT '15:00',
  dinner_start time NOT NULL DEFAULT '19:00',
  dinner_end time NOT NULL DEFAULT '23:00',
  slot_duration_minutes integer NOT NULL DEFAULT 30,
  closed_days integer[] DEFAULT '{}', -- 0=domenica, 1=lunedì, etc.
  max_party_size integer NOT NULL DEFAULT 10,
  advance_booking_days integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabella tavoli
CREATE TABLE public.tables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 4,
  location text, -- "Interno", "Terrazza", "Giardino"
  position_x integer DEFAULT 0,
  position_y integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Sequenza per numeri prenotazione
CREATE SEQUENCE IF NOT EXISTS public.reservation_number_seq START WITH 1;

-- Tabella prenotazioni
CREATE TABLE public.reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_number text NOT NULL UNIQUE,
  
  -- Cliente
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  
  -- Dettagli prenotazione
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  party_size integer NOT NULL DEFAULT 2,
  table_id uuid REFERENCES public.tables(id) ON DELETE SET NULL,
  
  -- Note (incluso voice-to-text)
  notes text,
  
  -- Stato: pending, confirmed, seated, completed, cancelled, no_show
  status text NOT NULL DEFAULT 'pending',
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger per generare numero prenotazione
CREATE OR REPLACE FUNCTION public.generate_reservation_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.reservation_number IS NULL OR NEW.reservation_number = '' THEN
    NEW.reservation_number := 'RES-' || LPAD(nextval('public.reservation_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_generate_reservation_number
  BEFORE INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_reservation_number();

-- Trigger per updated_at su reservations
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger per updated_at su restaurant_settings
CREATE TRIGGER update_restaurant_settings_updated_at
  BEFORE UPDATE ON public.restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- RLS per restaurant_settings (lettura pubblica, scrittura pubblica per ora)
CREATE POLICY "Restaurant settings viewable by everyone"
  ON public.restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Restaurant settings can be updated by everyone"
  ON public.restaurant_settings FOR UPDATE USING (true);
CREATE POLICY "Restaurant settings can be inserted by everyone"
  ON public.restaurant_settings FOR INSERT WITH CHECK (true);

-- RLS per tables
CREATE POLICY "Tables viewable by everyone"
  ON public.tables FOR SELECT USING (true);
CREATE POLICY "Tables can be inserted by everyone"
  ON public.tables FOR INSERT WITH CHECK (true);
CREATE POLICY "Tables can be updated by everyone"
  ON public.tables FOR UPDATE USING (true);
CREATE POLICY "Tables can be deleted by everyone"
  ON public.tables FOR DELETE USING (true);

-- RLS per reservations
CREATE POLICY "Reservations viewable by everyone"
  ON public.reservations FOR SELECT USING (true);
CREATE POLICY "Reservations can be created by everyone"
  ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Reservations can be updated by everyone"
  ON public.reservations FOR UPDATE USING (true);
CREATE POLICY "Reservations can be deleted by everyone"
  ON public.reservations FOR DELETE USING (true);

-- =====================================================
-- DATI INIZIALI
-- =====================================================

-- Inserisci settings di default
INSERT INTO public.restaurant_settings (
  lunch_start, lunch_end, dinner_start, dinner_end,
  slot_duration_minutes, max_party_size, advance_booking_days
) VALUES (
  '12:00', '15:00', '19:00', '23:00',
  30, 10, 30
);

-- Inserisci alcuni tavoli di esempio
INSERT INTO public.tables (name, capacity, location, sort_order) VALUES
  ('Tavolo 1', 2, 'Interno', 1),
  ('Tavolo 2', 4, 'Interno', 2),
  ('Tavolo 3', 4, 'Interno', 3),
  ('Tavolo 4', 6, 'Interno', 4),
  ('Tavolo 5', 2, 'Terrazza', 5),
  ('Tavolo 6', 4, 'Terrazza', 6);