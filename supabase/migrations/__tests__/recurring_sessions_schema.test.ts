/**
 * Test de cohérence : vérifie que les colonnes de la migration
 * recurring_sessions correspondent à l'interface TypeScript du frontend.
 */
import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

// Colonnes attendues par le frontend (src/hooks/useRecurringSessions.ts)
const FRONTEND_COLUMNS = [
  'id',
  'squad_id',
  'created_by',
  'title',
  'game',
  'recurrence_rule',
  'duration_minutes',
  'min_players',
  'max_players',
  'is_active',
  'next_occurrence',
  'created_at',
] as const

// Colonnes insérées par RecurringSessionForm.tsx
const FORM_INSERT_COLUMNS = [
  'squad_id',
  'created_by',
  'title',
  'game',
  'recurrence_rule',
  'duration_minutes',
  'min_players',
  'max_players',
  'is_active',
  'next_occurrence',
] as const

describe('recurring_sessions migration schema', () => {
  const migrationPath = path.resolve(
    __dirname,
    '..',
    '20260220000001_recurring_sessions.sql'
  )

  let migrationSQL: string

  it('migration file exists', () => {
    expect(fs.existsSync(migrationPath)).toBe(true)
    migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
  })

  it('creates the recurring_sessions table', () => {
    expect(migrationSQL).toContain('CREATE TABLE')
    expect(migrationSQL).toContain('recurring_sessions')
  })

  it('defines all columns expected by the frontend interface', () => {
    for (const col of FRONTEND_COLUMNS) {
      expect(
        migrationSQL,
        `Migration should define column "${col}"`
      ).toContain(col)
    }
  })

  it('defines all columns inserted by RecurringSessionForm', () => {
    for (const col of FORM_INSERT_COLUMNS) {
      expect(
        migrationSQL,
        `Migration should define column "${col}" used by the form insert`
      ).toContain(col)
    }
  })

  it('has RLS enabled', () => {
    expect(migrationSQL).toContain('ENABLE ROW LEVEL SECURITY')
  })

  it('has SELECT policy for squad members', () => {
    expect(migrationSQL).toContain('squad_members_can_view_recurring')
    expect(migrationSQL).toContain('FOR SELECT')
  })

  it('has INSERT policy restricted to leaders/co_leaders', () => {
    expect(migrationSQL).toContain('squad_leaders_can_insert_recurring')
    expect(migrationSQL).toContain('FOR INSERT')
    expect(migrationSQL).toContain("'leader'")
    expect(migrationSQL).toContain("'co_leader'")
  })

  it('has UPDATE policy for leaders', () => {
    expect(migrationSQL).toContain('squad_leaders_can_update_recurring')
    expect(migrationSQL).toContain('FOR UPDATE')
  })

  it('has DELETE policy for leaders', () => {
    expect(migrationSQL).toContain('squad_leaders_can_delete_recurring')
    expect(migrationSQL).toContain('FOR DELETE')
  })

  it('has updated_at trigger', () => {
    expect(migrationSQL).toContain('set_recurring_sessions_updated_at')
    expect(migrationSQL).toContain('update_updated_at')
  })

  it('has performance indexes', () => {
    expect(migrationSQL).toContain('idx_recurring_sessions_squad')
    expect(migrationSQL).toContain('idx_recurring_sessions_next')
    expect(migrationSQL).toContain('idx_recurring_sessions_created_by')
  })

  it('squad_id references squads(id) with CASCADE', () => {
    expect(migrationSQL).toMatch(/squad_id.*REFERENCES\s+squads\(id\)\s+ON DELETE CASCADE/s)
  })

  it('created_by references profiles(id)', () => {
    expect(migrationSQL).toMatch(/created_by.*REFERENCES\s+profiles\(id\)/)
  })
})
