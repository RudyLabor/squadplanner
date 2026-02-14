import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/home', hash: '', search: '' }),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

vi.mock('../../icons', () => {
  const icon = (props: any) => createElement('span', props)
  return { Search: icon, LayoutGrid: icon, Compass: icon, Settings: icon, HelpCircle: icon, Phone: icon }
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
  Sheet: ({ children, open }: any) => open ? createElement('div', null, children) : null,
}))

vi.mock('../../ui/Tooltip', () => ({
  Tooltip: ({ children }: any) => children,
}))

import { TopBar } from '../TopBar'

describe('TopBar', () => {
  it('renders without crash', () => {
    const { container } = render(<TopBar />)
    expect(container).toBeTruthy()
  })
})
