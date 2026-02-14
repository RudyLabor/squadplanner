import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockUseLocation = vi.fn().mockReturnValue({ pathname: '/', hash: '' })

vi.mock('react-router', () => ({
  useLocation: () => mockUseLocation(),
}))

import { useHashNavigation } from '../useHashNavigation'

describe('useHashNavigation', () => {
  beforeEach(() => {
    mockUseLocation.mockReturnValue({ pathname: '/', hash: '' })
    vi.restoreAllMocks()
  })

  it('returns empty currentHash when no hash', () => {
    const { result } = renderHook(() => useHashNavigation())
    expect(result.current.currentHash).toBe('')
  })

  it('returns currentHash from location hash', () => {
    mockUseLocation.mockReturnValue({ pathname: '/', hash: '#features' })

    const { result } = renderHook(() => useHashNavigation())
    expect(result.current.currentHash).toBe('features')
  })

  it('navigateToSection calls replaceState with hash', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')
    const { result } = renderHook(() => useHashNavigation())

    act(() => {
      result.current.navigateToSection('pricing')
    })

    expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '#pricing')
    replaceStateSpy.mockRestore()
  })

  it('navigateToSection scrolls to element via requestAnimationFrame', () => {
    const mockElement = document.createElement('div')
    mockElement.id = 'about'
    mockElement.scrollIntoView = vi.fn()
    mockElement.classList.add = vi.fn()
    document.body.appendChild(mockElement)

    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

    const { result } = renderHook(() => useHashNavigation())

    act(() => {
      result.current.navigateToSection('about')
    })

    expect(rafSpy).toHaveBeenCalled()
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })

    document.body.removeChild(mockElement)
    rafSpy.mockRestore()
    replaceStateSpy.mockRestore()
  })

  it('navigateToSection returns function', () => {
    const { result } = renderHook(() => useHashNavigation())
    expect(typeof result.current.navigateToSection).toBe('function')
  })
})
