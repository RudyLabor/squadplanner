import { describe, it, expect } from 'vitest'
import {
  parseRecurrenceRule,
  formatRecurrenceRule,
  formatRecurrenceDisplay,
  getNextOccurrence,
} from '../useRecurringSessions'

describe('recurring sessions pure functions', () => {
  describe('parseRecurrenceRule', () => {
    it('parses valid rule with multiple days', () => {
      const result = parseRecurrenceRule('weekly:0,2,4:21:00')
      expect(result.days).toEqual([0, 2, 4])
      expect(result.hour).toBe(21)
      expect(result.minute).toBe(0)
    })

    it('parses rule with single day', () => {
      const result = parseRecurrenceRule('weekly:3:18:30')
      expect(result.days).toEqual([3])
      expect(result.hour).toBe(18)
      expect(result.minute).toBe(30)
    })

    it('parses rule with all days', () => {
      const result = parseRecurrenceRule('weekly:0,1,2,3,4,5,6:09:00')
      expect(result.days).toEqual([0, 1, 2, 3, 4, 5, 6])
      expect(result.hour).toBe(9)
      expect(result.minute).toBe(0)
    })

    it('filters out invalid day numbers', () => {
      const result = parseRecurrenceRule('weekly:0,7,8:21:00')
      expect(result.days).toEqual([0]) // 7 and 8 are invalid (>6)
    })

    it('throws on invalid format (missing parts)', () => {
      expect(() => parseRecurrenceRule('weekly')).toThrow('Invalid recurrence rule format')
      expect(() => parseRecurrenceRule('weekly:0')).toThrow('Invalid recurrence rule format')
      expect(() => parseRecurrenceRule('weekly:0:21')).toThrow('Invalid recurrence rule format')
    })

    it('throws on invalid time (hour > 23)', () => {
      expect(() => parseRecurrenceRule('weekly:0:25:00')).toThrow('Invalid time')
    })

    it('throws on invalid time (minute > 59)', () => {
      expect(() => parseRecurrenceRule('weekly:0:21:60')).toThrow('Invalid time')
    })

    it('throws on negative hours', () => {
      expect(() => parseRecurrenceRule('weekly:0:-1:00')).toThrow('Invalid time')
    })
  })

  describe('formatRecurrenceRule', () => {
    it('formats days and time correctly', () => {
      expect(formatRecurrenceRule([0, 2, 4], 21, 0)).toBe('weekly:0,2,4:21:00')
    })

    it('sorts days in ascending order', () => {
      expect(formatRecurrenceRule([4, 0, 2], 21, 0)).toBe('weekly:0,2,4:21:00')
    })

    it('removes duplicate days', () => {
      expect(formatRecurrenceRule([2, 2, 4, 4], 18, 30)).toBe('weekly:2,4:18:30')
    })

    it('pads single-digit hours and minutes with zeros', () => {
      expect(formatRecurrenceRule([1], 9, 5)).toBe('weekly:1:09:05')
    })

    it('handles midnight correctly', () => {
      expect(formatRecurrenceRule([0], 0, 0)).toBe('weekly:0:00:00')
    })

    it('roundtrips with parseRecurrenceRule', () => {
      const original = 'weekly:1,3,5:14:30'
      const parsed = parseRecurrenceRule(original)
      const formatted = formatRecurrenceRule(parsed.days, parsed.hour, parsed.minute)
      expect(formatted).toBe(original)
    })
  })

  describe('formatRecurrenceDisplay', () => {
    it('formats to French day abbreviations', () => {
      const display = formatRecurrenceDisplay('weekly:0,2,4:21:00')
      expect(display).toBe('Dim, Mar, Jeu à 21h00')
    })

    it('formats single day', () => {
      const display = formatRecurrenceDisplay('weekly:5:18:30')
      expect(display).toBe('Ven à 18h30')
    })

    it('formats all days', () => {
      const display = formatRecurrenceDisplay('weekly:0,1,2,3,4,5,6:20:00')
      expect(display).toBe('Dim, Lun, Mar, Mer, Jeu, Ven, Sam à 20h00')
    })

    it('pads minutes in display', () => {
      const display = formatRecurrenceDisplay('weekly:1:9:05')
      expect(display).toContain('09h05')
    })

    it('maps day numbers correctly to French names', () => {
      expect(formatRecurrenceDisplay('weekly:0:12:00')).toContain('Dim')
      expect(formatRecurrenceDisplay('weekly:1:12:00')).toContain('Lun')
      expect(formatRecurrenceDisplay('weekly:2:12:00')).toContain('Mar')
      expect(formatRecurrenceDisplay('weekly:3:12:00')).toContain('Mer')
      expect(formatRecurrenceDisplay('weekly:4:12:00')).toContain('Jeu')
      expect(formatRecurrenceDisplay('weekly:5:12:00')).toContain('Ven')
      expect(formatRecurrenceDisplay('weekly:6:12:00')).toContain('Sam')
    })
  })

  describe('getNextOccurrence', () => {
    it('returns a Date object', () => {
      const result = getNextOccurrence('weekly:0,1,2,3,4,5,6:23:59')
      expect(result).toBeInstanceOf(Date)
    })

    it('returns a date in the future', () => {
      const result = getNextOccurrence('weekly:0,1,2,3,4,5,6:23:59')
      expect(result.getTime()).toBeGreaterThan(Date.now() - 60000) // Allow 1 min margin
    })

    it('sets correct hour and minute', () => {
      const result = getNextOccurrence('weekly:0,1,2,3,4,5,6:14:30')
      expect(result.getHours()).toBe(14)
      expect(result.getMinutes()).toBe(30)
      expect(result.getSeconds()).toBe(0)
    })

    it('returns a date on one of the specified days', () => {
      const result = getNextOccurrence('weekly:1,3,5:21:00') // Mon, Wed, Fri
      const day = result.getDay()
      expect([1, 3, 5]).toContain(day)
    })
  })
})
