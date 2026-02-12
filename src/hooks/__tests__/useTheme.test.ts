import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useThemeStore } from '../useTheme'

describe('useThemeStore', () => {
  beforeEach(() => {
    act(() => {
      useThemeStore.setState({ mode: 'system', effectiveTheme: 'dark' })
    })
  })

  it('defaults to system mode', () => {
    expect(useThemeStore.getState().mode).toBe('system')
  })

  it('sets mode to dark', () => {
    act(() => {
      useThemeStore.getState().setMode('dark')
    })
    expect(useThemeStore.getState().mode).toBe('dark')
    expect(useThemeStore.getState().effectiveTheme).toBe('dark')
  })

  it('sets mode to light', () => {
    act(() => {
      useThemeStore.getState().setMode('light')
    })
    expect(useThemeStore.getState().mode).toBe('light')
    expect(useThemeStore.getState().effectiveTheme).toBe('light')
  })

  it('applies theme to document', () => {
    act(() => {
      useThemeStore.getState().setMode('light')
    })
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('sets data-theme on document for dark', () => {
    act(() => {
      useThemeStore.getState().setMode('dark')
    })
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
