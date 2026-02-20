/**
 * Lightweight i18n system for Squad Planner
 *
 * Features:
 * - Zustand store for locale management
 * - localStorage persistence
 * - Type-safe translations
 * - Function-based translations for plurals and dynamic values
 * - No external dependencies (except Zustand which is already in the project)
 */

import { create } from 'zustand'
import { fr } from '../locales/fr'
import { en } from '../locales/en'
import { es } from '../locales/es'
import { de } from '../locales/de'

export type Locale = 'fr' | 'en' | 'es' | 'de'

interface I18nStore {
  locale: Locale
  setLocale: (locale: Locale) => void
}

// Locale storage key
const LOCALE_STORAGE_KEY = 'squad-planner-locale'

// Get initial locale from localStorage or default to French
const getInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return 'fr'

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored === 'en' || stored === 'fr' || stored === 'es' || stored === 'de') return stored
  } catch {
    // localStorage might not be available
  }

  return 'fr'
}

// Create the i18n store
export const useI18nStore = create<I18nStore>((set) => ({
  locale: getInitialLocale(),
  setLocale: (locale: Locale) => {
    set({ locale })

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale)
      } catch {
        // Ignore localStorage errors
      }
    }
  },
}))

// Translation dictionaries
const translations = {
  fr,
  en,
  es,
  de,
} as const

/**
 * Get a value from a nested object using dot notation
 * Example: get(obj, 'settings.audio.title') returns obj.settings.audio.title
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Hook to get the translation function
 *
 * Usage:
 * ```tsx
 * const t = useT()
 *
 * // Simple translation
 * t('nav.home') // => 'Accueil' or 'Home'
 *
 * // Function-based translation (for plurals, dynamic values)
 * t('time.minutes', 5) // => '5 minutes'
 * t('squads.members', 3) // => '3 membres' or '3 members'
 * ```
 */
export function useT() {
  const locale = useI18nStore((state) => state.locale)

  return function t(key: string, ...args: unknown[]): string {
    const dict = translations[locale] as Record<string, unknown>
    const value = getNestedValue(dict, key)

    // If value is a function, call it with the arguments
    if (typeof value === 'function') {
      return value(...args)
    }

    // If value is a string, return it
    if (typeof value === 'string') {
      return value
    }

    // Fallback to the key if translation is missing
    console.warn(`Translation missing for key: ${key} (locale: ${locale})`)
    return key
  }
}

/**
 * Hook to get the current locale
 */
export function useLocale() {
  return useI18nStore((state) => state.locale)
}

/**
 * Hook to get the setLocale function
 */
export function useSetLocale() {
  return useI18nStore((state) => state.setLocale)
}

/**
 * Get translation function for server-side rendering or outside React components
 */
export function getT(locale: Locale) {
  return function t(key: string, ...args: unknown[]): string {
    const dict = translations[locale] as Record<string, unknown>
    const value = getNestedValue(dict, key)

    if (typeof value === 'function') {
      return value(...args)
    }

    if (typeof value === 'string') {
      return value
    }

    return key
  }
}
