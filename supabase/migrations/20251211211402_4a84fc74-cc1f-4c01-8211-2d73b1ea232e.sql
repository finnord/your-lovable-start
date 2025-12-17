-- Add DELETE policy for customers
CREATE POLICY "Customers can be deleted by everyone" 
ON public.customers FOR DELETE 
USING (true);

-- First, delete all existing products to start fresh
DELETE FROM public.products;

-- Insert all products from the PDF menu with correct data
-- ANTIPASTI (12 products)
INSERT INTO public.products (name, description, price, category, unit, sort_order, available) VALUES
('Salmone marinato agli agrumi', 'Si consiglia di togliere dal frigo 15 minuti prima del consumo', 6.90, 'antipasti', 'porzione', 1, true),
('Insalata di polpo alla mediterranea', 'Con pomodorini, olive taggiasche e basilico', 6.90, 'antipasti', 'porzione', 2, true),
('Insalata di polpo e patate', 'Si consiglia di togliere dal frigo 15 minuti prima del consumo', 5.90, 'antipasti', 'porzione', 3, true),
('Insalata di mare', 'Si consiglia di togliere dal frigo 15 minuti prima del consumo', 5.40, 'antipasti', 'porzione', 4, true),
('Insalata russa con gamberi', 'Si consiglia di togliere dal frigo 15 minuti prima del consumo', 3.90, 'antipasti', 'porzione', 5, true),
('Cocktail di gamberi', 'Si consiglia di togliere dal frigo 15 minuti prima del consumo', 4.40, 'antipasti', 'porzione', 6, true),
('Insalata di baccalà, carciofini, sedano e ceci', 'Si consiglia di togliere dal frigo 15 minuti prima del consumo', 4.90, 'antipasti', 'porzione', 7, true),
('Gamberi alla catalana', 'Con cipolla di tropea, pomodorini e basilico', 4.90, 'antipasti', 'porzione', 8, true),
('Brioche pasta sfoglia e spada affumicato', 'Le nostre brioches di pasta sfoglia', 4.00, 'antipasti', 'pezzo', 9, true),
('Brioche pasta sfoglia e salmone marinato', 'Le nostre brioches di pasta sfoglia', 4.00, 'antipasti', 'pezzo', 10, true),
('Panettoncino gastronomico', 'Con salmone, spada e tonno affumicati - assaggio per 4 persone', 26.00, 'antipasti', 'pezzo', 11, true),
('Tortino di gamberi e zucchine', 'Riscaldare in forno già caldo 180° per 4/5 minuti', 6.00, 'antipasti', 'pezzo', 12, true);

-- CRUDI (6 products)
INSERT INTO public.products (name, description, price, category, unit, sort_order, available) VALUES
('Tartare branzino 120gr', 'Condire a piacimento. Consumare entro 2 giorni dalla data di acquisto', 13.00, 'crudi', 'porzione', 1, true),
('Selezione di tartare', 'Branzino, orata, salmone, tonno, capasanta', 21.00, 'crudi', 'piatto', 2, true),
('MAREMIO per 1 persona', 'Carpaccio di tonno, branzino, salmone, orata, 1 scampo e 2 gamberi rossi di Mazara del Vallo', 26.00, 'crudi', 'piatto', 3, true),
('Tartare tonno 120gr', 'Condire a piacimento. Consumare entro 2 giorni dalla data di acquisto', 16.00, 'crudi', 'porzione', 4, true),
('Tartare salmone 120gr', 'Condire a piacimento. Consumare entro 2 giorni dalla data di acquisto', 13.00, 'crudi', 'porzione', 5, true),
('Tartare orata 120gr', 'Condire a piacimento. Consumare entro 2 giorni dalla data di acquisto', 13.00, 'crudi', 'porzione', 6, true);

-- SUGHI PRONTI (4 products)
INSERT INTO public.products (name, description, price, category, unit, sort_order, available) VALUES
('Sugo all''astice', 'Mezzo astice. Riscaldare 5 minuti in padella', 6.90, 'sughi', 'porzione', 1, true),
('Ragù di gallinella', 'Riscaldare 5 minuti in padella', 4.40, 'sughi', 'porzione', 2, true),
('Sugo allo scorfano', 'Riscaldare 5 minuti in padella', 4.90, 'sughi', 'porzione', 3, true),
('Sugo di baccalà con guanciale al tartufo', 'Ultimare la cottura della pasta in padella, aggiungendo il sugo e 2 cucchiai d''acqua di cottura', 5.90, 'sughi', 'porzione', 4, true);

-- PRIMI PIATTI (3 products)
INSERT INTO public.products (name, description, price, category, unit, sort_order, available) VALUES
('Cannelloni gamberi, patate e scamorza', 'Vaschetta da 2 porzioni. Riscaldare a forno già caldo a 180° per 8-10 minuti', 3.40, 'primi', 'vaschetta', 1, true),
('Lasagne baccalà, spinaci e pinoli', 'Vaschetta da 2 porzioni. Riscaldare a forno già caldo a 180° per 8-10 minuti', 3.40, 'primi', 'vaschetta', 2, true),
('Lasagne salmone e zafferano', 'Vaschetta da 2 porzioni. Riscaldare a forno già caldo a 180° per 8-10 minuti', 2.90, 'primi', 'vaschetta', 3, true);

-- SECONDI PIATTI (3 products)
INSERT INTO public.products (name, description, price, category, unit, sort_order, available) VALUES
('Spiedini di branzino con gamberi gratinati', 'Riscaldare in forno già caldo a 180° per 5 minuti', 5.90, 'secondi', 'porzione', 1, true),
('Filetto di branzino ripieno con porcini e salmone', 'Riscaldare in forno già caldo a 180° per 6/7 minuti', 5.40, 'secondi', 'porzione', 2, true),
('Polpo alla Luciana', 'Riscaldare in padella a fuoco lento per 5 minuti', 5.90, 'secondi', 'porzione', 3, true);

-- PRONTI A CUOCERE (4 products)
INSERT INTO public.products (name, description, price, category, unit, sort_order, available) VALUES
('Capesante gratinate', 'Cuocere in forno già caldo a 180° per 10 minuti, aggiungere poi un filo d''olio a crudo', 5.00, 'pronti', 'pezzo', 1, true),
('Spiedini di baccalà, carciofi e limone', 'Cuocere in forno già caldo a 180° per 5/6 minuti', 5.90, 'pronti', 'pezzo', 2, true),
('Spiedini di salmone, porro e pomodoro secco', 'Cuocere in forno già caldo a 180° per 5/6 minuti', 5.90, 'pronti', 'pezzo', 3, true),
('Spiedini gambero e bacon con prugne e peperoni', 'Cuocere in forno già caldo a 180° per 5/6 minuti', 5.90, 'pronti', 'pezzo', 4, true);