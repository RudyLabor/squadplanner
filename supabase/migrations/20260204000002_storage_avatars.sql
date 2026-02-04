-- =====================================================
-- SQUAD PLANNER - MIGRATION STORAGE AVATARS
-- Version: 1.0.1
-- Date: 2026-02-04
-- Description: Création du bucket avatars pour les photos de profil
-- =====================================================

-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view avatars (public bucket)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'avatars'
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
)
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
);

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
);
