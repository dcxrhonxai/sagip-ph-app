-- Create storage buckets for emergency evidence
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('emergency-photos', 'emergency-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('emergency-videos', 'emergency-videos', false, 104857600, ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo']),
  ('emergency-audio', 'emergency-audio', false, 10485760, ARRAY['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm']);

-- Storage policies for photos
CREATE POLICY "Users can upload their own emergency photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'emergency-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own emergency photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'emergency-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own emergency photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'emergency-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for videos
CREATE POLICY "Users can upload their own emergency videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'emergency-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own emergency videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'emergency-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own emergency videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'emergency-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for audio
CREATE POLICY "Users can upload their own emergency audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'emergency-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own emergency audio"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'emergency-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own emergency audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'emergency-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add evidence_files column to emergency_alerts table
ALTER TABLE emergency_alerts
ADD COLUMN IF NOT EXISTS evidence_files jsonb DEFAULT '[]'::jsonb;