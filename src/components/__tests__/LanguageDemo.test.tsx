import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockSetLocale = vi.fn()

vi.mock('../../lib/i18n', () => ({
  useT:
    () =>
    (key: string, ..._args: any[]) =>
      key,
  useLocale: () => 'fr',
  useSetLocale: () => mockSetLocale,
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), {
    getState: vi.fn().mockReturnValue({ locale: 'fr' }),
  }),
}))

import { LanguageDemo } from '../LanguageDemo'

describe('LanguageDemo', () => {
  it('renders i18n demo heading', () => {
    render(<LanguageDemo />)
    expect(screen.getByText(/i18n Demo/)).toBeInTheDocument()
  })

  it('renders FR and EN buttons', () => {
    render(<LanguageDemo />)
    expect(screen.getByText(/FR/)).toBeInTheDocument()
    expect(screen.getByText(/EN/)).toBeInTheDocument()
  })

  it('shows current locale', () => {
    render(<LanguageDemo />)
    expect(screen.getByText('fr')).toBeInTheDocument()
  })

  it('renders translation keys', () => {
    render(<LanguageDemo />)
    expect(screen.getByText('nav.home')).toBeInTheDocument()
    expect(screen.getByText('nav.sessions')).toBeInTheDocument()
    expect(screen.getByText('nav.squads')).toBeInTheDocument()
  })

  it('renders action translations', () => {
    render(<LanguageDemo />)
    expect(screen.getByText('actions.create')).toBeInTheDocument()
    expect(screen.getByText('actions.edit')).toBeInTheDocument()
    expect(screen.getByText('actions.delete')).toBeInTheDocument()
  })

  it('calls setLocale when language button is clicked', () => {
    render(<LanguageDemo />)
    fireEvent.click(screen.getByText(/EN/))
    expect(mockSetLocale).toHaveBeenCalledWith('en')
  })
})
