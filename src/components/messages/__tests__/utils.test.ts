import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatTime, formatDateSeparator } from '../utils'

describe('utils', () => {
  describe('formatTime', () => {
    let now: Date

    beforeEach(() => {
      now = new Date('2026-02-14T12:00:00Z')
      vi.useFakeTimers()
      vi.setSystemTime(now)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns empty string for empty input', () => {
      expect(formatTime('')).toBe('')
    })

    it('returns empty string for invalid date', () => {
      expect(formatTime('not-a-date')).toBe('')
    })

    it('returns "maintenant" for dates less than 1 minute ago', () => {
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000).toISOString()
      expect(formatTime(thirtySecondsAgo)).toBe('maintenant')
    })

    it('returns minutes for dates less than 1 hour ago', () => {
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString()
      expect(formatTime(tenMinutesAgo)).toBe('10min')
    })

    it('returns time string for dates within the same day', () => {
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      const result = formatTime(twoHoursAgo)
      // Should be a time like "10:00"
      expect(result).toMatch(/\d{2}:\d{2}/)
    })

    it('returns "Hier" for dates from yesterday', () => {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      expect(formatTime(yesterday)).toBe('Hier')
    })

    it('returns weekday for dates within last 7 days', () => {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      const result = formatTime(threeDaysAgo)
      // Should be a short weekday name
      expect(result).toBeTruthy()
      expect(result).not.toBe('')
    })

    it('returns date string for dates older than 7 days', () => {
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
      const result = formatTime(twoWeeksAgo)
      expect(result).toBeTruthy()
      expect(result).not.toBe('')
    })
  })

  describe('formatDateSeparator', () => {
    let now: Date

    beforeEach(() => {
      now = new Date('2026-02-14T12:00:00Z')
      vi.useFakeTimers()
      vi.setSystemTime(now)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns empty string for empty input', () => {
      expect(formatDateSeparator('')).toBe('')
    })

    it('returns empty string for invalid date', () => {
      expect(formatDateSeparator('not-a-date')).toBe('')
    })

    it('returns "Aujourd\'hui" for today', () => {
      expect(formatDateSeparator(now.toISOString())).toBe("Aujourd'hui")
    })

    it('returns "Hier" for yesterday', () => {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      expect(formatDateSeparator(yesterday.toISOString())).toBe('Hier')
    })

    it('returns full date for older dates', () => {
      const oldDate = new Date('2026-01-01T12:00:00Z')
      const result = formatDateSeparator(oldDate.toISOString())
      expect(result).toBeTruthy()
      expect(result).not.toBe('')
      // Should contain a month name
      expect(result.length).toBeGreaterThan(3)
    })
  })
})
