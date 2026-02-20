-- ============================================================
-- Migration: Recurring Sessions
-- Date: 2026-02-20
-- Description: Table pour les sessions récurrentes (Squad Leader+)
-- Le frontend (useRecurringSessions.ts, RecurringSessionForm.tsx)
-- attend exactement ces colonnes.
-- ============================================================

-- Table des sessions récurrentes
CREATE TABLE IF NOT EXISTS recurring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  game TEXT,
  recurrence_rule TEXT NOT NULL,  -- format: 'weekly:0,2,4:21:00'
  duration_minutes INTEGER DEFAULT 120,
  min_players INTEGER DEFAULT 2,
  max_players INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  next_occurrence TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_recurring_sessions_squad ON recurring_sessions(squad_id);
CREATE INDEX IF NOT EXISTS idx_recurring_sessions_next ON recurring_sessions(next_occurrence) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recurring_sessions_created_by ON recurring_sessions(created_by);

-- RLS
ALTER TABLE recurring_sessions ENABLE ROW LEVEL SECURITY;

-- Politique : membres de la squad peuvent voir les sessions récurrentes
CREATE POLICY "squad_members_can_view_recurring" ON recurring_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM squad_members
      WHERE squad_members.squad_id = recurring_sessions.squad_id
      AND squad_members.user_id = auth.uid()
    )
  );

-- Politique : squad leader/co_leader peuvent créer
CREATE POLICY "squad_leaders_can_insert_recurring" ON recurring_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM squad_members
      WHERE squad_members.squad_id = recurring_sessions.squad_id
      AND squad_members.user_id = auth.uid()
      AND squad_members.role IN ('leader', 'co_leader')
    )
  );

-- Politique : squad leader/co_leader peuvent modifier
CREATE POLICY "squad_leaders_can_update_recurring" ON recurring_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM squad_members
      WHERE squad_members.squad_id = recurring_sessions.squad_id
      AND squad_members.user_id = auth.uid()
      AND squad_members.role IN ('leader', 'co_leader')
    )
  );

-- Politique : squad leader/co_leader peuvent supprimer
CREATE POLICY "squad_leaders_can_delete_recurring" ON recurring_sessions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM squad_members
      WHERE squad_members.squad_id = recurring_sessions.squad_id
      AND squad_members.user_id = auth.uid()
      AND squad_members.role IN ('leader', 'co_leader')
    )
  );

-- Trigger updated_at (réutilise la fonction générique existante)
CREATE TRIGGER set_recurring_sessions_updated_at
  BEFORE UPDATE ON recurring_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
