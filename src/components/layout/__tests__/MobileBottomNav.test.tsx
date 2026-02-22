import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

vi.mock('framer-motion', () => ({
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
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

  // STRICT: verifies nav renders with correct aria-label, 5 nav items (Accueil, Squads, Party, Messages, Profil), links point to correct paths, active item has aria-current
  it('renders all navigation items with correct structure and accessibility', () => {
    const { container } = render(<MobileBottomNav {...defaultProps} />)

    // Nav landmark with correct aria-label
    const nav = container.querySelector('nav')
    expect(nav).toBeTruthy()
    expect(nav!.getAttribute('aria-label')).toBe('Navigation mobile')

    // Fixed positioning with correct classes
    expect(nav!.classList.contains('fixed')).toBe(true)
    expect(nav!.classList.contains('bottom-0')).toBe(true)
    expect(nav!.classList.contains('z-50')).toBe(true)

    // 5 navigation links
    const links = container.querySelectorAll('a')
    expect(links.length).toBe(5)

    // Correct labels
    expect(screen.getByText('Accueil')).toBeDefined()
    expect(screen.getByText('Squads')).toBeDefined()
    expect(screen.getByText('Party')).toBeDefined()
    expect(screen.getByText('Messages')).toBeDefined()
    expect(screen.getByText('Profil')).toBeDefined()

    // Links point to correct paths
    expect(links[0].getAttribute('href')).toBe('/home')
    expect(links[1].getAttribute('href')).toBe('/squads')
    expect(links[2].getAttribute('href')).toBe('/party')
    expect(links[3].getAttribute('href')).toBe('/messages')
    expect(links[4].getAttribute('href')).toBe('/profile')

    // Active item (home) has aria-current="page"
    expect(links[0].getAttribute('aria-current')).toBe('page')
    expect(links[1].getAttribute('aria-current')).toBeNull()

    // Not hidden when keyboard not visible
    expect(nav!.classList.contains('translate-y-full')).toBe(false)
    expect(nav!.classList.contains('translate-y-0')).toBe(true)
  })

  // STRICT: verifies unread badge renders with count, keyboard hides nav, voice chat active state changes Party label/icon
  it('shows unread badge, hides on keyboard, and reflects voice chat state', () => {
    // Unread messages badge
    const { container: c1 } = render(<MobileBottomNav {...defaultProps} unreadMessages={3} />)
    expect(c1.textContent).toContain('3')

    // Badge > 99 shows 99+
    const { container: c2 } = render(<MobileBottomNav {...defaultProps} unreadMessages={150} />)
    expect(c2.textContent).toContain('99+')

    // Keyboard visible hides nav
    const { container: c3 } = render(<MobileBottomNav {...defaultProps} isKeyboardVisible={true} />)
    const nav3 = c3.querySelector('nav')
    expect(nav3!.classList.contains('translate-y-full')).toBe(true)

    // Voice chat active changes Party button aria-label
    const { container: c4 } = render(<MobileBottomNav {...defaultProps} isInVoiceChat={true} />)
    const partyLink = c4.querySelector('a[href="/party"]')
    expect(partyLink?.getAttribute('aria-label')).toBe('Party vocale - En cours')

    // No voice chat: standard aria-label
    const partyLink2 = c1.querySelector('a[href="/party"]')
    expect(partyLink2?.getAttribute('aria-label')).toBe('Party vocale')

    // No badge when unreadMessages is 0
    const { container: c5 } = render(<MobileBottomNav {...defaultProps} unreadMessages={0} />)
    expect(c5.querySelector('[aria-label*="non lus"]')).toBeNull()
  })
})
