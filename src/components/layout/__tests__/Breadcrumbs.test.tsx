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
  it('renders without crash', () => {
    render(<Breadcrumbs />)
    expect(screen.getByText('Squads')).toBeInTheDocument()
  })

  it('renders home link', () => {
    render(<Breadcrumbs />)
    const homeLink = screen.getByText('Accueil')
    expect(homeLink.closest('a')).toHaveAttribute('href', '/home')
  })

  it('returns null on home page', async () => {
    const routerMod = await import('react-router')
    vi.mocked(routerMod.useLocation).mockReturnValue({ pathname: '/home', hash: '', search: '', state: null, key: '' })
    const { container } = render(<Breadcrumbs />)
    expect(container.innerHTML).toBe('')
    vi.mocked(routerMod.useLocation).mockReturnValue({ pathname: '/squads', hash: '', search: '', state: null, key: '' })
  })
})
