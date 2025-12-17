-- Add RLS policies for products UPDATE and DELETE
CREATE POLICY "Products can be updated by everyone" 
ON public.products 
FOR UPDATE 
USING (true);

CREATE POLICY "Products can be inserted by everyone" 
ON public.products 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Products can be deleted by everyone" 
ON public.products 
FOR DELETE 
USING (true);