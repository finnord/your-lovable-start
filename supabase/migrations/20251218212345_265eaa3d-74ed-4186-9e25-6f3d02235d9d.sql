-- Add new columns for multi-room table map with shapes and modular tables
ALTER TABLE public.tables
ADD COLUMN IF NOT EXISTS shape text NOT NULL DEFAULT 'square',
ADD COLUMN IF NOT EXISTS min_capacity integer,
ADD COLUMN IF NOT EXISTS max_capacity integer,
ADD COLUMN IF NOT EXISTS module_group text,
ADD COLUMN IF NOT EXISTS module_position integer,
ADD COLUMN IF NOT EXISTS is_combinable boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS room text NOT NULL DEFAULT 'grande';

-- Add comment for documentation
COMMENT ON COLUMN public.tables.shape IS 'Table shape: square, round, bistro';
COMMENT ON COLUMN public.tables.min_capacity IS 'Minimum capacity when table is alone';
COMMENT ON COLUMN public.tables.max_capacity IS 'Maximum capacity when combined with module group';
COMMENT ON COLUMN public.tables.module_group IS 'Group identifier for combinable tables (e.g., A, B, 34-35)';
COMMENT ON COLUMN public.tables.module_position IS 'Position within the module group for ordering';
COMMENT ON COLUMN public.tables.is_combinable IS 'Whether this table can be combined with others';
COMMENT ON COLUMN public.tables.room IS 'Room location: grande, blu, rosa';