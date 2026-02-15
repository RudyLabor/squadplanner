import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/squads', hash: '', search: '' }),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

vi.mock('../../icons', () => ({
  ChevronRight: (props: any) => createElement('span', props, '>'),
  Home: (props: any) => createElement('span', props, 'home'),
}))

vi.mock('../../../hooks', () => ({
  useSquadsStore: vi.fn().mockReturnValue({ currentSquad: null }),
  useSessionsStore: vi.fn().mockReturnValue({ currentSession: null }),
}))

import { Breadcrumbs } from '../Breadcrumbs'

describe('Breadcrumbs', () => {
  // STRICT: verifies breadcrumbs nav renders with correct aria-label, home link first, current page label last with aria-current, chevron separator, home icon
  it('renders breadcrumb trail for /squads route', () => {
    const { container } = render(<Breadcrumbs />)

    // Nav landmark with aria-label
    const nav = container.querySelector('nav')
    expect(nav).toBeTruthy()
    expect(nav!.getAttribute('aria-label')).toBe("Fil d'Ariane")

    // Ordered list structure
    const ol = container.querySelector('ol')
    expect(ol).toBeTruthy()
    const items = ol!.querySelectorAll('li')
    expect(items.length).toBe(2)

    // Home link with correct path
    const homeLink = screen.getByText('Accueil')
    expect(homeLink.closest('a')).toBeTruthy()
    expect(homeLink.closest('a')!.getAttribute('href')).toBe('/home')

    // Current page "Squads" as text (not link), with aria-current
    const squads = screen.getByText('Squads')
    expect(squads.closest('a')).toBeNull()
    expect(squads.getAttribute('aria-current')).toBe('page')
    expect(squads.classList.contains('font-medium')).toBe(true)

    // Chevron separator between items
    expect(screen.getByText('>')).toBeDefined()

    // Home icon rendered
    expect(screen.getByText('home')).toBeDefined()

    // Desktop-only class
    expect(nav!.classList.contains('desktop-only')).toBe(true)
  })

  // STRICT: verifies home link is clickable with correct href, home icon has aria-hidden, chevrons use aria-hidden
  it('renders home link with correct accessibility attributes', () => {
    render(<Breadcrumbs />)
    const homeLink = screen.getByText('Accueil')
    expect(homeLink.closest('a')!.getAttribute('href')).toBe('/home')

    // Home icon with aria-hidden
    const homeIcon = screen.getByText('home')
    expect(homeIcon.getAttribute('aria-hidden')).toBe('true')

    // Chevron separator with aria-hidden
    const chevron = screen.getByText('>')
    expect(chevron.getAttribute('aria-hidden')).toBe('true')

    // Accueil link has hover styling class
    expect(homeLink.classList.contains('text-text-secondary')).toBe(true)
  })

  // STRICT: verifies Breadcrumbs returns null on /home and / paths (no breadcrumbs needed)
  it('returns null on home page', async () => {
    const routerMod = await import('react-router')
    vi.mocked(routerMod.useLocation).mockReturnValue({ pathname: '/home', hash: '', search: '', state: null, key: '' })
    const { container } = render(<Breadcrumbs />)
    expect(container.innerHTML).toBe('')

    // Also returns null on root path
    vi.mocked(routerMod.useLocation).mockReturnValue({ pathname: '/', hash: '', search: '', state: null, key: '' })
    const { container: c2 } = render(<Breadcrumbs />)
    expect(c2.innerHTML).toBe('')

    // Restore for other tests
    vi.mocked(routerMod.useLocation).mockReturnValue({ pathname: '/squads', hash: '', search: '', state: null, key: '' })
  })
})
