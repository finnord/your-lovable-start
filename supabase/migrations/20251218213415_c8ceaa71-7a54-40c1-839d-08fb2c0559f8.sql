-- Add is_separator field to tables for managing empty divider modules
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS is_separator boolean NOT NULL DEFAULT false;