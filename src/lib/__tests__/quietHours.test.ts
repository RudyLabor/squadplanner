import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import { useQuietHoursStore } from '../quietHours'

describe('useQuietHoursStore', () => {
  beforeEach(() => {
    act(() => {
      useQuietHoursStore.setState({
        enabled: true,
        startHour: 23,
        endHour: 8,
      })
    })
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('default state', () => {
    it('defaults to enabled', () => {
      expect(useQuietHoursStore.getState().enabled).toBe(true)
    })

    it('defaults startHour to 23', () => {
      expect(useQuietHoursStore.getState().startHour).toBe(23)
    })

    it('defaults endHour to 8', () => {
      expect(useQuietHoursStore.getState().endHour).toBe(8)
    })
  })

  describe('setEnabled', () => {
    it('disables quiet hours', () => {
      act(() => {
        useQuietHoursStore.getState().setEnabled(false)
      })
      expect(useQuietHoursStore.getState().enabled).toBe(false)
    })

    it('enables quiet hours', () => {
      act(() => {
        useQuietHoursStore.getState().setEnabled(false)
        useQuietHoursStore.getState().setEnabled(true)
      })
      expect(useQuietHoursStore.getState().enabled).toBe(true)
    })
  })

  describe('setStartHour / setEndHour', () => {
    it('updates startHour', () => {
      act(() => {
        useQuietHoursStore.getState().setStartHour(22)
      })
      expect(useQuietHoursStore.getState().startHour).toBe(22)
    })

    it('updates endHour', () => {
      act(() => {
        useQuietHoursStore.getState().setEndHour(7)
      })
      expect(useQuietHoursStore.getState().endHour).toBe(7)
    })
  })

  describe('isQuietNow', () => {
    it('returns false when disabled', () => {
      act(() => {
        useQuietHoursStore.setState({ enabled: false })
      })
      expect(useQuietHoursStore.getState().isQuietNow()).toBe(false)
    })

    it('returns true during overnight quiet hours (23:00)', () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(23)
      act(() => {
        useQuietHoursStore.setState({ enabled: true, startHour: 23, endHour: 8 })
      })
      expect(useQuietHoursStore.getState().isQuietNow()).toBe(true)
    })

    it('returns true during overnight quiet hours (3:00 AM)', () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(3)
      act(() => {
        useQuietHoursStore.setState({ enabled: true, startHour: 23, endHour: 8 })
      })
      expect(useQuietHoursStore.getState().isQuietNow()).toBe(true)
    })

    it('returns false outside overnight quiet hours (12:00)', () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(12)
      act(() => {
        useQuietHoursStore.setState({ enabled: true, startHour: 23, endHour: 8 })
      })
      expect(useQuietHoursStore.getState().isQuietNow()).toBe(false)
    })

    it('returns false at exactly endHour (boundary)', () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(8)
      act(() => {
        useQuietHoursStore.setState({ enabled: true, startHour: 23, endHour: 8 })
      })
      expect(useQuietHoursStore.getState().isQuietNow()).toBe(false)
    })

    it('handles daytime range (start < end)', () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(14)
      act(() => {
        useQuietHoursStore.setState({ enabled: true, startHour: 9, endHour: 17 })
      })
      expect(useQuietHoursStore.getState().isQuietNow()).toBe(true)
    })

    it('returns false outside daytime range', () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(20)
      act(() => {
        useQuietHoursStore.setState({ enabled: true, startHour: 9, endHour: 17 })
      })
      expect(useQuietHoursStore.getState().isQuietNow()).toBe(false)
    })

    it('returns true at exactly startHour', () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(9)
      act(() => {
        useQuietHoursStore.setState({ enabled: true, startHour: 9, endHour: 17 })
      })
      expect(useQuietHoursStore.getState().isQuietNow()).toBe(true)
    })

    it('returns false at exactly endHour for daytime range', () => {
      vi.spyOn(Date.prototype, 'getHours').mockReturnValue(17)
      act(() => {
        useQuietHoursStore.setState({ enabled: true, startHour: 9, endHour: 17 })
      })
      expect(useQuietHoursStore.getState().isQuietNow()).toBe(false)
    })
  })
})
