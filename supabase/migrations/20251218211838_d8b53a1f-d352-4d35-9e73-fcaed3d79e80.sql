-- Add occasion/special event fields to reservations
ALTER TABLE reservations 
ADD COLUMN occasion_type text,
ADD COLUMN occasion_notes text,
ADD COLUMN needs_cake boolean DEFAULT false,
ADD COLUMN cake_message text;