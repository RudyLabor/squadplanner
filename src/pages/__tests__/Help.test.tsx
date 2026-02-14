import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/help', hash: '', search: '' }),
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
  HelpCircle: ({ children, ...props }: any) => createElement('span', props, children),
  ChevronDown: ({ children, ...props }: any) => createElement('span', props, children),
  Search: ({ children, ...props }: any) => createElement('span', props, children),
  ArrowLeft: ({ children, ...props }: any) => createElement('span', props, children),
}))

// Mock UI components
vi.mock('../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

// Mock layout components
vi.mock('../../components/layout/MobilePageHeader', () => ({
  MobilePageHeader: ({ title }: any) => createElement('div', null, title),
}))

// Mock ScrollProgress
vi.mock('../../components/ui/ScrollProgress', () => ({
  ScrollProgress: () => null,
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

// Mock HelpChatbot
vi.mock('../../components/HelpChatbot', () => ({
  HelpChatbot: () => null,
}))

// Mock help sub-components
vi.mock('../help/HelpFAQData', () => ({
  FAQ_ITEMS: [
    {
      question: 'Comment creer une squad ?',
      answer: 'Clique sur le bouton +',
      category: 'General',
    },
    {
      question: 'Comment inviter des amis ?',
      answer: 'Partage le lien de ta squad',
      category: 'General',
    },
  ],
  CATEGORIES: ['General'],
}))

vi.mock('../help/HelpIllustrations', () => ({
  FAQIllustration: () => null,
}))

vi.mock('../help/HelpContactSection', () => ({
  HelpContactSection: () => createElement('div', null, 'Contact Section'),
}))

import { Help } from '../Help'

describe('Help', () => {
  it('renders without crashing', () => {
    render(createElement(Help))
    expect(screen.getByLabelText('Aide')).toBeTruthy()
  })

  it('renders the help title', () => {
    render(createElement(Help))
    expect(screen.getByText('Aide & FAQ')).toBeTruthy()
  })

  it('renders search input', () => {
    render(createElement(Help))
    expect(screen.getByPlaceholderText("Rechercher dans l'aide...")).toBeTruthy()
  })

  it('renders FAQ questions', () => {
    render(createElement(Help))
    expect(screen.getByText('Comment creer une squad ?')).toBeTruthy()
    expect(screen.getByText('Comment inviter des amis ?')).toBeTruthy()
  })

  it('renders category filter buttons', () => {
    render(createElement(Help))
    expect(screen.getByText('Tout')).toBeTruthy()
    expect(screen.getAllByText('General').length).toBeGreaterThanOrEqual(1)
  })

  it('renders contact section', () => {
    render(createElement(Help))
    expect(screen.getByText('Contact Section')).toBeTruthy()
  })
})
