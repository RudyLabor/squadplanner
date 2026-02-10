import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAdaptiveLoading } from '../useAdaptiveLoading'

describe('useAdaptiveLoading', () => {
  beforeEach(() => {
    // Reset navigator.connection mock
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: undefined,
    })
  })

  it('returns high tier when no connection info available', () => {
    const { result } = renderHook(() => useAdaptiveLoading())
    expect(result.current.tier).toBe('high')
    expect(result.current.isSlowConnection).toBe(false)
    expect(result.current.isSaveData).toBe(false)
    expect(result.current.effectiveType).toBe('4g')
  })

  it('returns low tier for 2g connections', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: { effectiveType: '2g' },
    })

    const { result } = renderHook(() => useAdaptiveLoading())
    expect(result.current.tier).toBe('low')
    expect(result.current.isSlowConnection).toBe(true)
  })

  it('returns low tier for slow-2g connections', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: { effectiveType: 'slow-2g' },
    })

    const { result } = renderHook(() => useAdaptiveLoading())
    expect(result.current.tier).toBe('low')
    expect(result.current.isSlowConnection).toBe(true)
  })

  it('returns medium tier for 3g connections', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: { effectiveType: '3g' },
    })

    const { result } = renderHook(() => useAdaptiveLoading())
    expect(result.current.tier).toBe('medium')
    expect(result.current.isSlowConnection).toBe(false)
  })

  it('returns high tier for 4g connections', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: { effectiveType: '4g' },
    })

    const { result } = renderHook(() => useAdaptiveLoading())
    expect(result.current.tier).toBe('high')
    expect(result.current.isSlowConnection).toBe(false)
  })

  it('returns low tier when saveData is true', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: { effectiveType: '4g', saveData: true },
    })

    const { result } = renderHook(() => useAdaptiveLoading())
    expect(result.current.tier).toBe('low')
    expect(result.current.isSaveData).toBe(true)
  })

  it('reports correct effectiveType', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: { effectiveType: '3g' },
    })

    const { result } = renderHook(() => useAdaptiveLoading())
    expect(result.current.effectiveType).toBe('3g')
  })
})
