-- Fix: Allow squad owners/leaders to invite members directly
-- Previously, only self-join was allowed (auth.uid() = user_id)

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can join squads" ON squad_members;

-- Create a new policy that allows:
-- 1. Users to join themselves (via invite code)
-- 2. Squad owners to add anyone
-- 3. Leaders/co-leaders to add anyone
CREATE POLICY "Users can join or be invited to squads"
    ON squad_members FOR INSERT
    WITH CHECK (
        -- User joining themselves
        auth.uid() = user_id
        OR
        -- Squad owner inviting someone
        EXISTS (
            SELECT 1 FROM squads
            WHERE squads.id = squad_id
            AND squads.owner_id = auth.uid()
        )
        OR
        -- Leader/co-leader inviting someone
        EXISTS (
            SELECT 1 FROM squad_members sm
            WHERE sm.squad_id = squad_members.squad_id
            AND sm.user_id = auth.uid()
            AND sm.role IN ('leader', 'co_leader')
        )
    );
