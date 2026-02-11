import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import React from 'react'
import { useDocumentTitle } from '../useDocumentTitle'

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(MemoryRouter, { initialEntries: ['/home'] }, children)
}

describe('useDocumentTitle', () => {
  it('sets document title for /home', () => {
    renderHook(() => useDocumentTitle(), { wrapper })
    expect(document.title).toBe('Accueil — Squad Planner')
  })

  it('sets document title for root', () => {
    function rootWrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(MemoryRouter, { initialEntries: ['/'] }, children)
    }
    renderHook(() => useDocumentTitle(), { wrapper: rootWrapper })
    expect(document.title).toBe('Squad Planner — Le Calendly du gaming')
  })

  it('sets document title for settings', () => {
    function settingsWrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(MemoryRouter, { initialEntries: ['/settings'] }, children)
    }
    renderHook(() => useDocumentTitle(), { wrapper: settingsWrapper })
    expect(document.title).toBe('Paramètres — Squad Planner')
  })

  it('sets fallback title for unknown path', () => {
    function unknownWrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(MemoryRouter, { initialEntries: ['/unknown-page'] }, children)
    }
    renderHook(() => useDocumentTitle(), { wrapper: unknownWrapper })
    expect(document.title).toBe('Page non trouvée — Squad Planner')
  })

  it('handles dynamic squad route', () => {
    function squadWrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(MemoryRouter, { initialEntries: ['/squad/123'] }, children)
    }
    renderHook(() => useDocumentTitle(), { wrapper: squadWrapper })
    expect(document.title).toBe('Squad — Squad Planner')
  })
})
