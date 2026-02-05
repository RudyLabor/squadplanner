-- Script pour ajouter la policy RLS permettant aux membres de marquer les messages comme lus
-- À exécuter dans Supabase SQL Editor

-- Supprimer l'ancienne policy restrictive
DROP POLICY IF EXISTS "Users can update own messages" ON messages;

-- Nouvelle policy : le sender peut modifier son message OU un membre peut mettre à jour read_by
CREATE POLICY "Users can update messages"
ON messages FOR UPDATE
USING (
  -- Le sender peut tout modifier
  auth.uid() = sender_id
  OR
  -- Les membres de la squad peuvent mettre à jour read_by
  EXISTS (
    SELECT 1 FROM squad_members
    WHERE squad_members.squad_id = messages.squad_id
    AND squad_members.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Le sender peut tout modifier
  auth.uid() = sender_id
  OR
  -- Les membres de la squad peuvent mettre à jour read_by
  EXISTS (
    SELECT 1 FROM squad_members
    WHERE squad_members.squad_id = messages.squad_id
    AND squad_members.user_id = auth.uid()
  )
);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Policy mise à jour pour les read receipts sur messages !';
END $$;
