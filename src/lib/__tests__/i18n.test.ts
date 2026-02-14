import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useI18nStore, getT } from '../i18n'

describe('i18n', () => {
  beforeEach(() => {
    act(() => { useI18nStore.setState({ locale: 'fr' }) })
  })

  it('default locale is fr', () => {
    expect(useI18nStore.getState().locale).toBe('fr')
  })

  it('setLocale changes locale', () => {
    act(() => { useI18nStore.getState().setLocale('en') })
    expect(useI18nStore.getState().locale).toBe('en')
  })

  describe('getT', () => {
    it('returns French translation', () => {
      const t = getT('fr')
      const result = t('nav.home')
      expect(typeof result).toBe('string')
    })

    it('returns English translation', () => {
      const t = getT('en')
      const result = t('nav.home')
      expect(typeof result).toBe('string')
    })

    it('returns key for missing translation', () => {
      const t = getT('fr')
      expect(t('this.key.does.not.exist')).toBe('this.key.does.not.exist')
    })
  })
})
