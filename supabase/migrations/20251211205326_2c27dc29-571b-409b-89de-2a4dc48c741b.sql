-- Policy per DELETE su orders
CREATE POLICY "Orders can be deleted by everyone" 
ON public.orders FOR DELETE 
USING (true);

-- Policy per UPDATE su order_items
CREATE POLICY "Order items can be updated by everyone" 
ON public.order_items FOR UPDATE 
USING (true);

-- Policy per DELETE su order_items  
CREATE POLICY "Order items can be deleted by everyone" 
ON public.order_items FOR DELETE 
USING (true);