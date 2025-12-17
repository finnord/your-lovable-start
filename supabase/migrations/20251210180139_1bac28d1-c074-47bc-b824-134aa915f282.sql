
-- Make order_number have a default value so inserts work
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT '';
