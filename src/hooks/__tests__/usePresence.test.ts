import { describe, it, expect, vi } from 'vitest'
import { getOnlineIndicatorClasses } from '../usePresence'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      track: vi.fn().mockResolvedValue(undefined),
      untrack: vi.fn(),
      presenceState: vi.fn().mockReturnValue({}),
    }),
    removeChannel: vi.fn(),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    }),
  },
}))

describe('getOnlineIndicatorClasses', () => {
  it('returns green classes when online', () => {
    const classes = getOnlineIndicatorClasses(true)
    expect(classes).toContain('bg-emerald-500')
    expect(classes).toContain('rounded-full')
  })

  it('returns gray classes when offline', () => {
    const classes = getOnlineIndicatorClasses(false)
    expect(classes).toContain('bg-zinc-600')
    expect(classes).toContain('rounded-full')
  })

  it('returns small size classes by default', () => {
    const classes = getOnlineIndicatorClasses(true)
    expect(classes).toContain('w-2 h-2')
  })

  it('returns small size classes explicitly', () => {
    const classes = getOnlineIndicatorClasses(true, 'sm')
    expect(classes).toContain('w-2 h-2')
  })

  it('returns medium size classes', () => {
    const classes = getOnlineIndicatorClasses(true, 'md')
    expect(classes).toContain('w-2.5 h-2.5')
  })

  it('returns large size classes', () => {
    const classes = getOnlineIndicatorClasses(true, 'lg')
    expect(classes).toContain('w-3 h-3')
  })

  it('includes border classes in all sizes', () => {
    const sm = getOnlineIndicatorClasses(true, 'sm')
    const md = getOnlineIndicatorClasses(false, 'md')
    const lg = getOnlineIndicatorClasses(true, 'lg')

    expect(sm).toContain('border-2')
    expect(md).toContain('border-2')
    expect(lg).toContain('border-2')
  })

  it('includes glow effect for online users', () => {
    const classes = getOnlineIndicatorClasses(true)
    expect(classes).toContain('shadow-glow-success')
  })

  it('does not include glow effect for offline users', () => {
    const classes = getOnlineIndicatorClasses(false)
    expect(classes).not.toContain('shadow-glow-success')
  })
})
