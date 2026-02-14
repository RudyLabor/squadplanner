import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

vi.mock('framer-motion', () => ({
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
}))

vi.mock('../../icons', () => {
  const icon = (props: any) => createElement('span', props)
  return { Home: icon, Users: icon, Mic: icon, MessageCircle: icon, User: icon }
})

vi.mock('../../../hooks/usePrefetch', () => ({
  usePrefetch: () => ({
    createPrefetchHandler: vi.fn().mockReturnValue(vi.fn()),
    cancelPrefetch: vi.fn(),
  }),
}))

import { MobileBottomNav } from '../MobileBottomNav'

describe('MobileBottomNav', () => {
  const defaultProps = {
    currentPath: '/home',
    isPartyActive: false,
    isInVoiceChat: false,
    isKeyboardVisible: false,
    unreadMessages: 0,
  }

  it('renders without crash', () => {
    const { container } = render(<MobileBottomNav {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('shows unread badge', () => {
    const { container } = render(<MobileBottomNav {...defaultProps} unreadMessages={3} />)
    expect(container.textContent).toContain('3')
  })
})
