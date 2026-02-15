import { describe, it, expect, vi } from 'vitest'

// Mock react-router (used internally by useFocusManagement)
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/' }),
}))

// Mock useFocusAdvanced (re-exported by useFocusManagement)
vi.mock('../useFocusAdvanced', () => ({
  useRovingTabindex: vi.fn(),
  useA11yAnnouncements: vi.fn(),
}))

import { useFocusTrap } from '../useFocusTrap'

describe('useFocusTrap', () => {
  it('is exported and is a function', () => {
    expect(useFocusTrap).toBeDefined()
    expect(typeof useFocusTrap).toBe('function')
  })

  it('is the same reference as useFocusManagement.useFocusTrap', async () => {
    const focusManagement = await import('../useFocusManagement')
    expect(useFocusTrap).toBe(focusManagement.useFocusTrap)
  })
})
