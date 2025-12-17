
-- Create products table for Christmas menu items
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'altro',
  available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_date DATE NOT NULL,
  delivery_time TEXT NOT NULL,
  delivery_type TEXT NOT NULL DEFAULT 'pickup',
  delivery_address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable (menu items)
CREATE POLICY "Products are viewable by everyone" 
ON public.products FOR SELECT USING (true);

-- Orders and items are publicly accessible for this restaurant app (no auth required)
CREATE POLICY "Orders are viewable by everyone" 
ON public.orders FOR SELECT USING (true);

CREATE POLICY "Orders can be created by everyone" 
ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Orders can be updated by everyone" 
ON public.orders FOR UPDATE USING (true);

CREATE POLICY "Order items are viewable by everyone" 
ON public.order_items FOR SELECT USING (true);

CREATE POLICY "Order items can be created by everyone" 
ON public.order_items FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate order number function
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Insert sample Christmas menu products
INSERT INTO public.products (name, description, price, category, sort_order) VALUES
('Antipasto della Tradizione', 'Selezione di salumi e formaggi tipici', 18.00, 'antipasti', 1),
('Carpaccio di Salmone', 'Con agrumi e finocchietto selvatico', 16.00, 'antipasti', 2),
('Tortellini in Brodo', 'Brodo di cappone fatto in casa', 14.00, 'primi', 3),
('Lasagne della Nonna', 'Ragù tradizionale e besciamella', 16.00, 'primi', 4),
('Arrosto di Vitello', 'Con patate al forno e verdure', 24.00, 'secondi', 5),
('Baccalà alla Vicentina', 'Ricetta tradizionale con polenta', 22.00, 'secondi', 6),
('Pandoro Farcito', 'Con crema al mascarpone', 8.00, 'dolci', 7),
('Panettone Artigianale', 'Con uvetta e canditi', 12.00, 'dolci', 8);
