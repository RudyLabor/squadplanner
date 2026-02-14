import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => children,
    m: new Proxy({}, {
      get: (_target: any, prop: string) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      }
    }),
    motion: new Proxy({}, {
      get: (_target: any, prop: string) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      }
    }),
  }
})

// Mock icons
vi.mock('../../components/icons', () => ({
  Home: ({ children, ...props }: any) => createElement('span', props, children),
  Gamepad2: ({ children, ...props }: any) => createElement('span', props, children),
  ArrowLeft: ({ children, ...props }: any) => createElement('span', props, children),
  Users: ({ children, ...props }: any) => createElement('span', props, children),
  MessageCircle: ({ children, ...props }: any) => createElement('span', props, children),
  HelpCircle: ({ children, ...props }: any) => createElement('span', props, children),
}))

// Mock UI components
vi.mock('../../components/ui', () => ({
  Button: ({ children, ...props }: any) => createElement('button', props, children),
}))

import { NotFound } from '../NotFound'

describe('NotFound', () => {
  it('renders without crashing', () => {
    render(createElement(NotFound))
    expect(screen.getByRole('main')).toBeTruthy()
  })

  it('renders 404 heading', () => {
    render(createElement(NotFound))
    expect(screen.getByText('404')).toBeTruthy()
  })

  it('renders error message', () => {
    render(createElement(NotFound))
    expect(screen.getByText("Oups, cette page n'existe pas !")).toBeTruthy()
  })

  it('renders link to home', () => {
    render(createElement(NotFound))
    const homeLink = screen.getByText("Retour à l'accueil")
    expect(homeLink).toBeTruthy()
  })

  it('renders popular page links', () => {
    render(createElement(NotFound))
    expect(screen.getByText('Mes squads')).toBeTruthy()
    expect(screen.getByText('Messages')).toBeTruthy()
    expect(screen.getByText('Aide')).toBeTruthy()
  })

  it('has correct aria-label on main', () => {
    render(createElement(NotFound))
    expect(screen.getByLabelText('Page introuvable')).toBeTruthy()
  })
})
