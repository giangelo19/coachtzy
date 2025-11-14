-- Create storage bucket for team logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload team logos
CREATE POLICY "Authenticated users can upload team logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-logos' AND
  auth.uid() IN (
    SELECT coach_id FROM teams
  )
);

-- Policy: Anyone can view team logos (public bucket)
CREATE POLICY "Anyone can view team logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'team-logos');

-- Policy: Team owners can update their team logos
CREATE POLICY "Team owners can update their logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'team-logos' AND
  auth.uid() IN (
    SELECT coach_id FROM teams
  )
)
WITH CHECK (
  bucket_id = 'team-logos' AND
  auth.uid() IN (
    SELECT coach_id FROM teams
  )
);

-- Policy: Team owners can delete their team logos
CREATE POLICY "Team owners can delete their logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-logos' AND
  auth.uid() IN (
    SELECT coach_id FROM teams
  )
);
