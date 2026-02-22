import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock react-router Link
vi.mock('react-router', () => ({
  Link: ({ children, to, className, ...props }: any) =>
    createElement('a', { href: to, className, ...props }, children),
}))

// Mock icon components
vi.mock('../icons', () => ({
  Zap: ({ className }: any) =>
    createElement('span', { className, 'data-testid': 'icon-zap' }, 'Zap'),
  Crown: ({ className }: any) =>
    createElement('span', { className, 'data-testid': 'icon-crown' }, 'Crown'),
}))

import { PlanBadge } from '../PlanBadge'

describe('PlanBadge', () => {
  // =========================================================================
  // Free tier — sm size
  // =========================================================================
  describe('free tier — sm size', () => {
    it('renders an upgrade CTA link for free/sm', () => {
      render(createElement(PlanBadge, { tier: 'free', size: 'sm' }))

      // 1 - "Passer Premium" text is shown
      expect(screen.getByText('Passer Premium')).toBeTruthy()

      // 2 - link points to /premium
      const link = screen.getByText('Passer Premium').closest('a')
      expect(link).toBeTruthy()
      expect(link!.getAttribute('href')).toBe('/premium')

      // 3 - Zap icon is present
      expect(screen.getByTestId('icon-zap')).toBeTruthy()

      // 4 - does NOT show "Free" label (it shows upgrade CTA instead)
      expect(screen.queryByText('Free')).toBeNull()
    })
  })

  // =========================================================================
  // Free tier — md size
  // =========================================================================
  describe('free tier — md size', () => {
    it('renders a card-style upgrade CTA for free/md', () => {
      render(createElement(PlanBadge, { tier: 'free', size: 'md' }))

      // 1 - shows plan label
      expect(screen.getByText('Plan Free')).toBeTruthy()

      // 2 - shows descriptive upgrade text
      expect(screen.getByText(/Passer Premium pour tout/)).toBeTruthy()

      // 3 - link to /premium
      const link = screen.getByText('Plan Free').closest('a')
      expect(link).toBeTruthy()
      expect(link!.getAttribute('href')).toBe('/premium')

      // 4 - Zap icon present
      expect(screen.getByTestId('icon-zap')).toBeTruthy()
    })
  })

  // =========================================================================
  // Premium tier — sm size
  // =========================================================================
  describe('premium tier — sm size', () => {
    it('renders premium badge with correct label and icon', () => {
      render(createElement(PlanBadge, { tier: 'premium', size: 'sm' }))

      // 1 - shows "Premium" label
      expect(screen.getByText('Premium')).toBeTruthy()

      // 2 - Zap icon present
      expect(screen.getByTestId('icon-zap')).toBeTruthy()

      // 3 - links to /premium
      const link = screen.getByText('Premium').closest('a')
      expect(link).toBeTruthy()
      expect(link!.getAttribute('href')).toBe('/premium')

      // 4 - does not show "Passer Premium" upgrade CTA
      expect(screen.queryByText('Passer Premium')).toBeNull()
    })
  })

  // =========================================================================
  // Premium tier — md size
  // =========================================================================
  describe('premium tier — md size', () => {
    it('renders a card-style badge for premium/md', () => {
      render(createElement(PlanBadge, { tier: 'premium', size: 'md' }))

      // 1 - shows plan label
      expect(screen.getByText('Plan Premium')).toBeTruthy()

      // 2 - shows "Abonnement actif"
      expect(screen.getByText('Abonnement actif')).toBeTruthy()

      // 3 - Zap icon present
      expect(screen.getByTestId('icon-zap')).toBeTruthy()

      // 4 - link to /premium
      const link = screen.getByText('Plan Premium').closest('a')
      expect(link!.getAttribute('href')).toBe('/premium')
    })
  })

  // =========================================================================
  // Squad Leader tier
  // =========================================================================
  describe('squad_leader tier', () => {
    it('renders squad leader badge with Crown icon', () => {
      render(createElement(PlanBadge, { tier: 'squad_leader', size: 'sm' }))

      // 1 - shows "Squad Leader" label
      expect(screen.getByText('Squad Leader')).toBeTruthy()

      // 2 - Crown icon present
      expect(screen.getByTestId('icon-crown')).toBeTruthy()

      // 3 - links to /premium
      const link = screen.getByText('Squad Leader').closest('a')
      expect(link).toBeTruthy()
      expect(link!.getAttribute('href')).toBe('/premium')

      // 4 - no Zap icon (Crown is used for squad_leader)
      expect(screen.queryByTestId('icon-zap')).toBeNull()
    })
  })

  // =========================================================================
  // Club tier
  // =========================================================================
  describe('club tier', () => {
    it('renders club badge with Crown icon', () => {
      render(createElement(PlanBadge, { tier: 'club', size: 'sm' }))

      // 1 - shows "Club" label
      expect(screen.getByText('Club')).toBeTruthy()

      // 2 - Crown icon present
      expect(screen.getByTestId('icon-crown')).toBeTruthy()

      // 3 - links to /premium
      const link = screen.getByText('Club').closest('a')
      expect(link).toBeTruthy()
      expect(link!.getAttribute('href')).toBe('/premium')

      // 4 - not showing "Squad Leader" label
      expect(screen.queryByText('Squad Leader')).toBeNull()
    })
  })

  // =========================================================================
  // Custom className
  // =========================================================================
  describe('custom className', () => {
    it('applies custom className to the rendered element', () => {
      const { container } = render(
        createElement(PlanBadge, { tier: 'premium', size: 'sm', className: 'my-custom-class' })
      )

      // 1 - custom class is applied
      const link = container.querySelector('a')
      expect(link).toBeTruthy()
      expect(link!.className).toContain('my-custom-class')

      // 2 - still has default styling classes
      expect(link!.className).toContain('inline-flex')

      // 3 - className does not override existing classes
      expect(link!.className).toContain('rounded-full')

      // 4 - content still renders correctly
      expect(screen.getByText('Premium')).toBeTruthy()
    })
  })
})
