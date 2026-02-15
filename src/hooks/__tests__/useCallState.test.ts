import { describe, it, expect } from 'vitest'

// No mocks needed - these are pure utility functions and constants
import {
  generateChannelName,
  formatCallDuration,
  RING_TIMEOUT,
  MAX_RECONNECT_ATTEMPTS,
} from '../useCallState'

describe('useCallState utilities', () => {
  // ===== CONSTANTS =====
  describe('constants', () => {
    it('RING_TIMEOUT is 30000ms (30 seconds)', () => {
      expect(RING_TIMEOUT).toBe(30000)
    })

    it('MAX_RECONNECT_ATTEMPTS is 3', () => {
      expect(MAX_RECONNECT_ATTEMPTS).toBe(3)
    })
  })

  // ===== generateChannelName =====
  describe('generateChannelName', () => {
    it('produces a channel name starting with "call_"', () => {
      const name = generateChannelName('user-aaa-bbb', 'user-ccc-ddd')
      expect(name).toMatch(/^call_/)
    })

    it('produces the same name regardless of argument order', () => {
      const name1 = generateChannelName('user-aaa-bbb', 'user-ccc-ddd')
      const name2 = generateChannelName('user-ccc-ddd', 'user-aaa-bbb')
      expect(name1).toBe(name2)
    })

    it('produces consistent output for the same pair', () => {
      const name1 = generateChannelName('abc-def-123', 'xyz-789-456')
      const name2 = generateChannelName('abc-def-123', 'xyz-789-456')
      expect(name1).toBe(name2)
    })

    it('produces different names for different user pairs', () => {
      const name1 = generateChannelName('user-111', 'user-222')
      const name2 = generateChannelName('user-111', 'user-333')
      expect(name1).not.toBe(name2)
    })

    it('handles UUIDs correctly (strips dashes and takes first 8 chars)', () => {
      const uuid1 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      const uuid2 = 'f9e8d7c6-b5a4-3210-fedc-ba0987654321'
      const name = generateChannelName(uuid1, uuid2)
      // After stripping dashes: a1b2c3d4e5f67890abcdef1234567890 -> first 8: a1b2c3d4
      // After stripping dashes: f9e8d7c6b5a43210fedcba0987654321 -> first 8: f9e8d7c6
      // Sorted: [a1b2c3d4, f9e8d7c6] -> call_a1b2c3d4_f9e8d7c6
      expect(name).toBe('call_a1b2c3d4_f9e8d7c6')
    })

    it('returns a string containing two hash segments separated by underscore', () => {
      const name = generateChannelName('user-aaa', 'user-bbb')
      // Format: call_{hash1}_{hash2}
      const parts = name.split('_')
      expect(parts).toHaveLength(3)
      expect(parts[0]).toBe('call')
    })
  })

  // ===== formatCallDuration =====
  describe('formatCallDuration', () => {
    it('formats 0 seconds as "00:00"', () => {
      expect(formatCallDuration(0)).toBe('00:00')
    })

    it('formats seconds-only correctly', () => {
      expect(formatCallDuration(5)).toBe('00:05')
      expect(formatCallDuration(30)).toBe('00:30')
      expect(formatCallDuration(59)).toBe('00:59')
    })

    it('formats minutes and seconds correctly', () => {
      expect(formatCallDuration(60)).toBe('01:00')
      expect(formatCallDuration(61)).toBe('01:01')
      expect(formatCallDuration(90)).toBe('01:30')
      expect(formatCallDuration(125)).toBe('02:05')
    })

    it('formats longer durations correctly', () => {
      expect(formatCallDuration(600)).toBe('10:00')
      expect(formatCallDuration(3599)).toBe('59:59')
      expect(formatCallDuration(3600)).toBe('60:00')
    })

    it('pads single digit minutes and seconds with leading zero', () => {
      expect(formatCallDuration(65)).toBe('01:05')
      expect(formatCallDuration(9)).toBe('00:09')
    })
  })
})
