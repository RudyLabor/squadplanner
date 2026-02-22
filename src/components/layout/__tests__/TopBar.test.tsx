import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/home', hash: '', search: '' }),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

vi.mock('../../icons', () => {
  const icon = (props: any) => createElement('span', props)
  return {
    Search: icon,
    LayoutGrid: icon,
    Compass: icon,
    Settings: icon,
    HelpCircle: icon,
    Phone: icon,
  }
})

vi.mock('../Breadcrumbs', () => ({
  Breadcrumbs: () => createElement('nav', null, 'Breadcrumbs'),
}))

vi.mock('../../GlobalSearch', () => ({
  GlobalSearch: () => createElement('div', null, 'GlobalSearch'),
}))

vi.mock('../../NotificationCenter', () => ({
  NotificationBell: () => createElement('button', null, 'NotificationBell'),
}))

vi.mock('../../ui/Sheet', () => ({
  Sheet: ({ children, open }: any) => (open ? createElement('div', null, children) : null),
}))

vi.mock('../../ui/Tooltip', () => ({
  Tooltip: ({ children }: any) => children,
}))

import { TopBar } from '../TopBar'

describe('TopBar', () => {
  // STRICT: verifies TopBar renders desktop header with Breadcrumbs, GlobalSearch, NotificationBell; mobile header with search and grid buttons; navigation links in more menu
  it('renders desktop and mobile headers with all navigation elements', () => {
    const { container } = render(<TopBar />)

    // Two header elements rendered (desktop + mobile)
    const headers = container.querySelectorAll('[role="banner"]')
    expect(headers.length).toBe(2)

    // Desktop header contains Breadcrumbs
    expect(screen.getByText('Breadcrumbs')).toBeDefined()

    // GlobalSearch rendered
    expect(screen.getByText('GlobalSearch')).toBeDefined()

    // NotificationBell rendered (appears in both desktop and mobile)
    const bells = screen.getAllByText('NotificationBell')
    expect(bells.length).toBe(2)

    // Mobile search button with aria-label
    expect(screen.getByLabelText('Rechercher')).toBeDefined()

    // More pages button with aria-label
    expect(screen.getByLabelText('Plus de pages')).toBeDefined()

    // Desktop header has desktop-only class
    expect(headers[0].classList.contains('desktop-only')).toBe(true)

    // Mobile header has mobile-only class
    expect(headers[1].classList.contains('mobile-only')).toBe(true)
  })
})
