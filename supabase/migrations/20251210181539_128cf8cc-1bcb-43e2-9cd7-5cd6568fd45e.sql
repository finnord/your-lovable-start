-- Creare tabella customers per rubrica clienti
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS policies per accesso pubblico (no auth in questo progetto)
CREATE POLICY "Customers are viewable by everyone" 
ON public.customers 
FOR SELECT 
USING (true);

CREATE POLICY "Customers can be created by everyone" 
ON public.customers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Customers can be updated by everyone" 
ON public.customers 
FOR UPDATE 
USING (true);

-- Creare sequence per numero ordine che parte da 101
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 101;

-- Aggiornare il trigger per usare la sequence
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.order_number := 'ORD-' || LPAD(nextval('public.order_number_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$function$;