import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStatePersistence } from '../useStatePersistence'

describe('useStatePersistence', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('returns default value when nothing stored', () => {
    const { result } = renderHook(() => useStatePersistence('test-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('returns stored value when available', () => {
    sessionStorage.setItem('sp_persist_test-key', JSON.stringify('stored-value'))

    const { result } = renderHook(() => useStatePersistence('test-key', 'default'))
    expect(result.current[0]).toBe('stored-value')
  })

  it('updates value and persists to sessionStorage', () => {
    const { result } = renderHook(() => useStatePersistence('test-key', 'initial'))

    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
    expect(JSON.parse(sessionStorage.getItem('sp_persist_test-key')!)).toBe('updated')
  })

  it('supports function updater', () => {
    const { result } = renderHook(() => useStatePersistence('counter', 0))

    act(() => {
      result.current[1]((prev: number) => prev + 1)
    })

    expect(result.current[0]).toBe(1)

    act(() => {
      result.current[1]((prev: number) => prev + 5)
    })

    expect(result.current[0]).toBe(6)
  })

  it('works with object values', () => {
    const defaultObj = { name: 'test', count: 0 }
    const { result } = renderHook(() => useStatePersistence('obj-key', defaultObj))

    expect(result.current[0]).toEqual(defaultObj)

    act(() => {
      result.current[1]({ name: 'updated', count: 5 })
    })

    expect(result.current[0]).toEqual({ name: 'updated', count: 5 })
  })

  it('works with array values', () => {
    const { result } = renderHook(() => useStatePersistence<string[]>('arr-key', []))

    act(() => {
      result.current[1](['item1', 'item2'])
    })

    expect(result.current[0]).toEqual(['item1', 'item2'])
  })

  it('handles corrupted storage gracefully', () => {
    sessionStorage.setItem('sp_persist_bad-key', 'not-json{{{')

    const { result } = renderHook(() => useStatePersistence('bad-key', 'fallback'))
    expect(result.current[0]).toBe('fallback')
  })

  it('works with boolean values', () => {
    const { result } = renderHook(() => useStatePersistence('bool-key', false))

    expect(result.current[0]).toBe(false)

    act(() => {
      result.current[1](true)
    })

    expect(result.current[0]).toBe(true)
    expect(JSON.parse(sessionStorage.getItem('sp_persist_bool-key')!)).toBe(true)
  })

  it('namespaces keys correctly', () => {
    const { result } = renderHook(() => useStatePersistence('my-key', 'value'))

    act(() => {
      result.current[1]('new-value')
    })

    // Key should be namespaced
    expect(sessionStorage.getItem('sp_persist_my-key')).toBeTruthy()
    // Raw key should not exist
    expect(sessionStorage.getItem('my-key')).toBeNull()
  })

  it('handles null values', () => {
    const { result } = renderHook(() => useStatePersistence<string | null>('null-key', null))

    expect(result.current[0]).toBeNull()

    act(() => {
      result.current[1]('something')
    })

    expect(result.current[0]).toBe('something')

    act(() => {
      result.current[1](null)
    })

    expect(result.current[0]).toBeNull()
  })
})
