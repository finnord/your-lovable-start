-- Create categories table for dynamic category ordering
CREATE TABLE public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Insert initial categories
INSERT INTO public.categories (name, label, sort_order) VALUES
  ('antipasti', 'Antipasti', 1),
  ('primi', 'Primi', 2),
  ('secondi', 'Secondi', 3),
  ('pronti_a_cuocere', 'Pronti a Cuocere', 4),
  ('crudi', 'Crudi', 5),
  ('sughi', 'Sughi', 6),
  ('dolci', 'Dolci', 7);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Categories can be updated by everyone" ON public.categories FOR UPDATE USING (true);

-- Fix order number trigger to respect manual input and start from 100
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only generate if order_number is empty or not set
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'ORD-' || LPAD(nextval('public.order_number_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$function$;

-- Reset sequence to start from 100
ALTER SEQUENCE public.order_number_seq RESTART WITH 100;