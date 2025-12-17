-- FASE 1: Aggiungere campo unit ai prodotti
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT 'porzione';

-- Pulire prodotti esistenti e inserire menu completo Mare Mio 2025
DELETE FROM public.products;

-- ANTIPASTI
INSERT INTO public.products (name, description, price, category, unit, sort_order, available) VALUES
('Salmone marinato', 'Salmone fresco marinato agli agrumi', 6.90, 'antipasti', 'etto', 1, true),
('Insalata di polpo', 'Polpo tenero con patate e olive', 6.90, 'antipasti', 'etto', 2, true),
('Gamberoni al vapore', 'Gamberoni freschi cotti al vapore', 6.90, 'antipasti', 'etto', 3, true),
('Cocktail di gamberi', 'Gamberi in salsa rosa', 6.90, 'antipasti', 'etto', 4, true),
('Insalata di mare', 'Mix di frutti di mare in insalata', 5.90, 'antipasti', 'etto', 5, true),
('Alici marinate', 'Alici fresche marinate al limone', 4.40, 'antipasti', 'etto', 6, true),
('Baccalà mantecato', 'Baccalà cremoso alla veneziana', 5.40, 'antipasti', 'etto', 7, true),
('Capesante gratinate', 'Capesante al gratin', 5.00, 'antipasti', 'pezzo', 8, true),
('Cozze gratinate', 'Cozze ripiene gratinate', 1.50, 'antipasti', 'pezzo', 9, true),
('Gamberone in crosta', 'Gamberone avvolto in pasta fillo', 4.50, 'antipasti', 'pezzo', 10, true),
('Involtino di spada', 'Involtino di pesce spada', 4.00, 'antipasti', 'pezzo', 11, true);

-- SUGHI
INSERT INTO public.products (name, description, price, category, unit, sort_order, available) VALUES
('Sugo all''astice', 'Sugo ricco con astice fresco', 6.90, 'sughi', 'etto', 1, true),
('Ragù di gallinella', 'Ragù delicato di gallinella', 4.40, 'sughi', 'etto', 2, true),
('Sugo allo scoglio', 'Sugo con frutti di mare misti', 4.90, 'sughi', 'etto', 3, true),
('Sugo alle vongole', 'Sugo classico alle vongole veraci', 4.90, 'sughi', 'etto', 4, true);

-- PRIMI
INSERT INTO public.products (name, description, price, category, unit, sort_order, available) VALUES
('Cannelloni di pesce', 'Cannelloni ripieni di pesce', 3.40, 'primi', 'etto', 1, true),
('Lasagne al baccalà', 'Lasagne con baccalà e besciamella', 3.40, 'primi', 'etto', 2, true),
('Lasagne allo scoglio', 'Lasagne ai frutti di mare', 3.40, 'primi', 'etto', 3, true);

-- SECONDI
INSERT INTO public.products (name, description, price, category, unit, sort_order, available) VALUES
('Spiedini di branzino', 'Spiedini di branzino alla griglia', 6.00, 'secondi', 'pezzo', 1, true),
('Filetto ripieno', 'Filetto di pesce ripieno', 5.90, 'secondi', 'etto', 2, true),
('Baccalà alla vicentina', 'Baccalà tradizionale vicentino', 4.90, 'secondi', 'etto', 3, true),
('Seppie in umido', 'Seppie con piselli in umido', 4.40, 'secondi', 'etto', 4, true);

-- PRONTI A CUOCERE
INSERT INTO public.products (name, description, price, category, unit, sort_order, available) VALUES
('Capesante pronte', 'Capesante pronte da gratinare', 5.00, 'pronti_cuocere', 'pezzo', 1, true),
('Spiedini di baccalà', 'Spiedini pronti da cuocere', 5.90, 'pronti_cuocere', 'etto', 2, true),
('Gamberoni panati', 'Gamberoni in panatura croccante', 6.90, 'pronti_cuocere', 'etto', 3, true),
('Frittura mista', 'Mix per frittura di pesce', 4.90, 'pronti_cuocere', 'etto', 4, true);

-- CRUDI
INSERT INTO public.products (name, description, price, category, unit, sort_order, available) VALUES
('Tartare Selezione', 'Tartare di pesce fresco selezione', 21.00, 'crudi', 'porzione', 1, true),
('MAREMIO Crudo', 'Selezione crudi premium MAREMIO', 26.00, 'crudi', 'porzione', 2, true),
('Carpaccio di tonno', 'Carpaccio di tonno fresco', 18.00, 'crudi', 'porzione', 3, true),
('Carpaccio di salmone', 'Carpaccio di salmone norvegese', 16.00, 'crudi', 'porzione', 4, true),
('Ostriche', 'Ostriche fresche', 4.50, 'crudi', 'pezzo', 5, true),
('Ricci di mare', 'Ricci freschi', 5.00, 'crudi', 'pezzo', 6, true);

-- DOLCI
INSERT INTO public.products (name, description, price, category, unit, sort_order, available) VALUES
('Tiramisù', 'Tiramisù della casa', 4.50, 'dolci', 'porzione', 1, true),
('Panna cotta', 'Panna cotta con frutti di bosco', 4.00, 'dolci', 'porzione', 2, true),
('Semifreddo', 'Semifreddo al torrone', 4.50, 'dolci', 'porzione', 3, true);