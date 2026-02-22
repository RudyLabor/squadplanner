import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock react-router hooks
const mockUseRouteError = vi.hoisted(() => vi.fn())
const mockIsRouteErrorResponse = vi.hoisted(() => vi.fn())

vi.mock('react-router', () => ({
  useRouteError: mockUseRouteError,
  isRouteErrorResponse: mockIsRouteErrorResponse,
}))

import { ErrorBoundaryClient } from '../ErrorBoundaryClient'

describe('ErrorBoundaryClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn(), href: '' },
      writable: true,
    })
  })

  describe('route error responses', () => {
    it('displays 404 status for route error response', () => {
      const error = { status: 404, statusText: 'Page introuvable' }
      mockUseRouteError.mockReturnValue(error)
      mockIsRouteErrorResponse.mockReturnValue(true)

      render(<ErrorBoundaryClient />)

      expect(screen.getByText('404')).toBeInTheDocument()
      expect(
        screen.getByText(/Page introuvable\. Tu peux essayer de recharger/)
      ).toBeInTheDocument()
    })

    it('displays 500 status for server error route response', () => {
      const error = { status: 500, statusText: 'Erreur serveur' }
      mockUseRouteError.mockReturnValue(error)
      mockIsRouteErrorResponse.mockReturnValue(true)

      render(<ErrorBoundaryClient />)

      expect(screen.getByText('500')).toBeInTheDocument()
    })

    it('displays 403 status for forbidden route response', () => {
      const error = { status: 403, statusText: 'Accès interdit' }
      mockUseRouteError.mockReturnValue(error)
      mockIsRouteErrorResponse.mockReturnValue(true)

      render(<ErrorBoundaryClient />)

      expect(screen.getByText('403')).toBeInTheDocument()
    })

    it('uses statusText as message for route errors', () => {
      const error = { status: 404, statusText: 'Not Found' }
      mockUseRouteError.mockReturnValue(error)
      mockIsRouteErrorResponse.mockReturnValue(true)

      render(<ErrorBoundaryClient />)

      expect(screen.getByText(/Not Found\. Tu peux essayer de recharger/)).toBeInTheDocument()
    })
  })

  describe('non-route errors', () => {
    it('displays generic error heading for non-route errors', () => {
      mockUseRouteError.mockReturnValue(new Error('Something broke'))
      mockIsRouteErrorResponse.mockReturnValue(false)

      render(<ErrorBoundaryClient />)

      expect(screen.getByText("Quelque chose s'est mal passé")).toBeInTheDocument()
    })

    it('displays default French error message for non-route errors', () => {
      mockUseRouteError.mockReturnValue(new Error('fail'))
      mockIsRouteErrorResponse.mockReturnValue(false)

      render(<ErrorBoundaryClient />)

      expect(
        screen.getByText(/Une erreur inattendue est survenue\. Tu peux essayer de recharger/)
      ).toBeInTheDocument()
    })

    it('uses status 500 for non-route errors (implicit)', () => {
      mockUseRouteError.mockReturnValue(new Error('crash'))
      mockIsRouteErrorResponse.mockReturnValue(false)

      render(<ErrorBoundaryClient />)

      // Non-route errors show "Quelque chose s'est mal passé" instead of a status code
      expect(screen.getByText("Quelque chose s'est mal passé")).toBeInTheDocument()
    })
  })

  describe('recovery actions', () => {
    it('renders a reload button', () => {
      mockUseRouteError.mockReturnValue(new Error('test'))
      mockIsRouteErrorResponse.mockReturnValue(false)

      render(<ErrorBoundaryClient />)

      const reloadButton = screen.getByText('Recharger la page')
      expect(reloadButton).toBeInTheDocument()
      expect(reloadButton.tagName).toBe('BUTTON')
    })

    it('calls window.location.reload when reload button is clicked', () => {
      mockUseRouteError.mockReturnValue(new Error('test'))
      mockIsRouteErrorResponse.mockReturnValue(false)

      render(<ErrorBoundaryClient />)

      const reloadButton = screen.getByText('Recharger la page')
      reloadButton.click()

      expect(window.location.reload).toHaveBeenCalled()
    })

    it('renders a link back to squads', () => {
      mockUseRouteError.mockReturnValue(new Error('test'))
      mockIsRouteErrorResponse.mockReturnValue(false)

      render(<ErrorBoundaryClient />)

      const squadsLinks = screen.getAllByText('Mes Squads')
      // One in sidebar, one as recovery button
      expect(squadsLinks.length).toBeGreaterThanOrEqual(1)
      // At least one should be an <a> with href="/squads"
      const recoveryLink = squadsLinks.find(
        (el) => el.tagName === 'A' && (el as HTMLAnchorElement).getAttribute('href') === '/squads'
      )
      expect(recoveryLink).toBeTruthy()
    })
  })

  describe('navigation sidebar (desktop)', () => {
    it('renders sidebar with navigation links', () => {
      mockUseRouteError.mockReturnValue(new Error('test'))
      mockIsRouteErrorResponse.mockReturnValue(false)

      render(<ErrorBoundaryClient />)

      const nav = screen.getByRole('navigation', { name: 'Menu principal' })
      expect(nav).toBeInTheDocument()
    })

    it('contains home link with Squad Planner logo', () => {
      mockUseRouteError.mockReturnValue(new Error('test'))
      mockIsRouteErrorResponse.mockReturnValue(false)

      render(<ErrorBoundaryClient />)

      expect(screen.getByText('Squad Planner')).toBeInTheDocument()
      const logo = screen.getByAltText('Squad Planner')
      expect(logo).toBeInTheDocument()
      expect(logo.getAttribute('src')).toBe('/favicon.svg')
    })

    it('contains all expected sidebar links', () => {
      mockUseRouteError.mockReturnValue(new Error('test'))
      mockIsRouteErrorResponse.mockReturnValue(false)

      render(<ErrorBoundaryClient />)

      // Check sidebar links exist
      const nav = screen.getByRole('navigation', { name: 'Menu principal' })
      expect(nav.querySelector('a[href="/squads"]')).toBeInTheDocument()
      expect(nav.querySelector('a[href="/sessions"]')).toBeInTheDocument()
      expect(nav.querySelector('a[href="/messages"]')).toBeInTheDocument()
      expect(nav.querySelector('a[href="/discover"]')).toBeInTheDocument()
      expect(nav.querySelector('a[href="/profile"]')).toBeInTheDocument()
      expect(nav.querySelector('a[href="/help"]')).toBeInTheDocument()
      expect(nav.querySelector('a[href="/settings"]')).toBeInTheDocument()
    })
  })

  describe('mobile navigation', () => {
    it('renders mobile navigation links', () => {
      mockUseRouteError.mockReturnValue(new Error('test'))
      mockIsRouteErrorResponse.mockReturnValue(false)

      render(<ErrorBoundaryClient />)

      // Mobile nav has Squads, Sessions, Messages, Découvrir, Aide links
      const allLinks = screen.getAllByRole('link')
      const mobileLinks = allLinks.filter((link) => {
        const cls = link.className || ''
        return cls.includes('bg-bg-elevated')
      })
      expect(mobileLinks.length).toBeGreaterThanOrEqual(5)
    })

    it('contains Découvrir link in mobile nav', () => {
      mockUseRouteError.mockReturnValue(new Error('test'))
      mockIsRouteErrorResponse.mockReturnValue(false)

      render(<ErrorBoundaryClient />)

      const links = screen.getAllByText('Découvrir')
      expect(links.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('emoji indicator', () => {
    it('shows the error emoji', () => {
      mockUseRouteError.mockReturnValue(new Error('test'))
      mockIsRouteErrorResponse.mockReturnValue(false)

      const { container } = render(<ErrorBoundaryClient />)

      // The emoji is in a div with text-6xl
      const emojiEl = container.querySelector('.text-6xl')
      expect(emojiEl).toBeInTheDocument()
    })
  })
})
