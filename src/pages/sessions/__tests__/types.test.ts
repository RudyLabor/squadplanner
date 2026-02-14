import { describe, it, expect } from 'vitest'
import { dayNames, formatDate } from '../types'
import type { SessionEntry, SlotSuggestion, CoachTip } from '../types'

describe('sessions/types', () => {
  it('exports dayNames as 7-element array', () => {
    expect(dayNames).toHaveLength(7)
    expect(dayNames[0]).toBe('Dimanche')
    expect(dayNames[6]).toBe('Samedi')
  })

  it('formatDate returns formatted string', () => {
    const result = formatDate('2026-02-14T21:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('SessionEntry type is usable', () => {
    const entry: SessionEntry = {
      id: 'test',
      scheduled_at: '2026-02-14T21:00:00Z',
    }
    expect(entry.id).toBe('test')
  })

  it('SlotSuggestion type is usable', () => {
    const slot: SlotSuggestion = {
      day_of_week: 3,
      hour: 21,
      reliability_score: 85,
    }
    expect(slot.day_of_week).toBe(3)
  })

  it('CoachTip type is usable', () => {
    const tip: CoachTip = { content: 'Test tip' }
    expect(tip.content).toBe('Test tip')
  })
})
