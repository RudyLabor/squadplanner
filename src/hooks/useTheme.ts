import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'dark' | 'light' | 'system'

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  effectiveTheme: 'dark' | 'light'
}

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: 'dark' | 'light') {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', theme)

  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    requestAnimationFrame(() => {
      const bgBase = getComputedStyle(root).getPropertyValue('--color-bg-base').trim()
      metaThemeColor.setAttribute('content', bgBase || (theme === 'dark' ? '#050506' : '#ffffff'))
    })
  }
}

// Read persisted mode synchronously to avoid theme flash during hydration
function getPersistedMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  try {
    const raw = localStorage.getItem('squadplanner-theme')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.state?.mode) return parsed.state.mode as ThemeMode
    }
  } catch {}
  return 'system'
}

const initialMode = getPersistedMode()
const initialEffective = initialMode === 'system' ? getSystemTheme() : initialMode

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: initialMode,
      effectiveTheme: initialEffective,

      setMode: (mode: ThemeMode) => {
        const effectiveTheme = mode === 'system' ? getSystemTheme() : mode
        applyTheme(effectiveTheme)
        set({ mode, effectiveTheme })
      },
    }),
    {
      name: 'squadplanner-theme',
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const effectiveTheme = state.mode === 'system' ? getSystemTheme() : state.mode
          applyTheme(effectiveTheme)
          useThemeStore.setState({ effectiveTheme })
        }
      },
    }
  )
)

if (typeof window !== 'undefined') {
  const mql = window.matchMedia('(prefers-color-scheme: dark)')

  const handleSystemChange = (e: MediaQueryListEvent) => {
    const { mode } = useThemeStore.getState()
    if (mode === 'system') {
      const newTheme = e.matches ? 'dark' : 'light'
      applyTheme(newTheme)
      useThemeStore.setState({ effectiveTheme: newTheme })
    }
  }

  mql.addEventListener('change', handleSystemChange)
}
