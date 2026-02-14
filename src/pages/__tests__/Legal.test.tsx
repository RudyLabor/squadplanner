import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/legal', hash: '', search: '' }),
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
  ArrowLeft: ({ children, ...props }: any) => createElement('span', props, children),
  Shield: ({ children, ...props }: any) => createElement('span', props, children),
  FileText: ({ children, ...props }: any) => createElement('span', props, children),
}))

// Mock ScrollProgress
vi.mock('../../components/ui/ScrollProgress', () => ({
  ScrollProgress: () => null,
}))

// Mock SquadPlannerLogo
vi.mock('../../components/SquadPlannerLogo', () => ({
  SquadPlannerLogo: ({ size }: any) => createElement('span', { 'data-testid': 'logo', style: { width: size } }),
}))

// Mock hooks
vi.mock('../../hooks/useStatePersistence', () => ({
  useStatePersistence: (key: string, defaultValue: any) => {
    const { useState } = require('react')
    return useState(defaultValue)
  },
}))

vi.mock('../../hooks/useHashNavigation', () => ({
  useHashNavigation: vi.fn(),
}))

// Mock legal sub-components
vi.mock('../legal/CGUContent', () => ({
  CGUContent: () => createElement('div', { 'data-testid': 'cgu-content' }, 'CGU Content'),
}))

vi.mock('../legal/PrivacyContent', () => ({
  PrivacyContent: () => createElement('div', { 'data-testid': 'privacy-content' }, 'Privacy Content'),
}))

import { Legal } from '../Legal'

describe('Legal', () => {
  it('renders without crashing', () => {
    render(createElement(Legal))
    expect(screen.getByText('Squad Planner')).toBeTruthy()
  })

  it('renders tab buttons for CGU and Privacy', () => {
    render(createElement(Legal))
    expect(screen.getByText("Conditions d'utilisation")).toBeTruthy()
    expect(screen.getByText('Politique de confidentialité')).toBeTruthy()
  })

  it('renders CGU content by default', () => {
    render(createElement(Legal))
    expect(screen.getByTestId('cgu-content')).toBeTruthy()
  })

  it('renders the Squad Planner logo', () => {
    render(createElement(Legal))
    expect(screen.getByTestId('logo')).toBeTruthy()
  })

  it('renders footer text', () => {
    render(createElement(Legal))
    expect(screen.getByText(/Squad Planner SAS/)).toBeTruthy()
  })
})
