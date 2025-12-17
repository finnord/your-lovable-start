-- Create private storage bucket for backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: service role has full access to backups bucket
CREATE POLICY "Service role full access to backups"
ON storage.objects
FOR ALL
USING (bucket_id = 'backups')
WITH CHECK (bucket_id = 'backups');