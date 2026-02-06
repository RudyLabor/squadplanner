/**
 * Theme management hook - PHASE 4.4
 * Supports dark/light/system themes with persistence
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'dark' | 'light' | 'system'

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  effectiveTheme: 'dark' | 'light'
}

// Get system preference
function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Apply theme to document
function applyTheme(theme: 'dark' | 'light') {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)

  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#050506' : '#ffffff')
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      effectiveTheme: getSystemTheme(),

      setMode: (mode: ThemeMode) => {
        const effectiveTheme = mode === 'system' ? getSystemTheme() : mode
        applyTheme(effectiveTheme)
        set({ mode, effectiveTheme })
      },
    }),
    {
      name: 'squadplanner-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const effectiveTheme = state.mode === 'system' ? getSystemTheme() : state.mode
          applyTheme(effectiveTheme)
          state.effectiveTheme = effectiveTheme
        }
      },
    }
  )
)

// Initialize theme on load and listen for system changes
if (typeof window !== 'undefined') {
  // Apply initial theme
  const state = useThemeStore.getState()
  const effectiveTheme = state.mode === 'system' ? getSystemTheme() : state.mode
  applyTheme(effectiveTheme)

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const state = useThemeStore.getState()
    if (state.mode === 'system') {
      const newTheme = e.matches ? 'dark' : 'light'
      applyTheme(newTheme)
      useThemeStore.setState({ effectiveTheme: newTheme })
    }
  })
}
