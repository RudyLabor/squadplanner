import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({ useLocation: vi.fn().mockReturnValue({ pathname: '/' }), useNavigate: vi.fn().mockReturnValue(vi.fn()), useParams: vi.fn().mockReturnValue({}), useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]), useLoaderData: vi.fn().mockReturnValue({}), Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children), NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children), Outlet: () => null, useMatches: vi.fn().mockReturnValue([]) }))
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  LazyMotion: ({ children }: any) => children,
  MotionConfig: ({ children }: any) => children,
  domAnimation: {},
  domMax: {},
  useInView: vi.fn().mockReturnValue(true),
  useScroll: vi.fn().mockReturnValue({ scrollYProgress: { get: () => 0 } }),
  useTransform: vi.fn().mockReturnValue(0),
  useMotionValue: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn(), on: vi.fn() }),
  useSpring: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn() }),
  useAnimate: vi.fn().mockReturnValue([{ current: null }, vi.fn()]),
  useAnimation: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn() }),
  useReducedMotion: vi.fn().mockReturnValue(false),
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
  motion: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
}))
vi.mock('../../lib/supabaseMinimal', () => ({ supabaseMinimal: { from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis() }) }, supabase: { from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis() }) }, isSupabaseReady: vi.fn().mockReturnValue(true) }))
vi.mock('../../hooks/useAuth', () => ({ useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' } }) }) }))
vi.mock('../../hooks', () => ({ useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' } }) }) }))
vi.mock('../../lib/i18n', () => ({ useT: () => (key: string) => key, useLocale: () => 'fr', useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }) }))
vi.mock('../../lib/toast', () => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn() }))
vi.mock('../../utils/haptics', () => ({ haptic: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() } }))

import { MessageSkeleton, MessageListSkeleton, ConversationSkeleton, DMConversationSkeleton, ConversationListSkeleton } from '../MessageSkeletons'

describe('MessageSkeletons', () => {
  it('MessageSkeleton renders without crash', () => {
    const { container } = render(<MessageSkeleton isOwn={false} showAvatar={true} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('MessageSkeleton renders own message aligned right', () => {
    const { container } = render(<MessageSkeleton isOwn={true} showAvatar={true} />)
    expect(container.firstChild).toHaveClass('flex-row-reverse')
  })

  it('MessageSkeleton renders other message aligned left', () => {
    const { container } = render(<MessageSkeleton isOwn={false} showAvatar={true} />)
    expect(container.firstChild).not.toHaveClass('flex-row-reverse')
  })

  it('MessageSkeleton hides avatar when showAvatar is false', () => {
    const { container } = render(<MessageSkeleton isOwn={false} showAvatar={false} />)
    const invisible = container.querySelector('.invisible')
    expect(invisible).toBeInTheDocument()
  })

  it('MessageSkeleton shows avatar when showAvatar is true', () => {
    const { container } = render(<MessageSkeleton isOwn={false} showAvatar={true} />)
    const visible = container.querySelector('.visible')
    expect(visible).toBeInTheDocument()
  })

  it('MessageSkeleton does not render avatar container for own messages', () => {
    const { container } = render(<MessageSkeleton isOwn={true} showAvatar={true} />)
    // Own messages don't show the avatar container
    const avatarContainers = container.querySelectorAll('.visible, .invisible')
    expect(avatarContainers.length).toBe(0)
  })

  it('MessageSkeleton is aria-hidden', () => {
    const { container } = render(<MessageSkeleton isOwn={false} showAvatar={true} />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('MessageListSkeleton renders without crash', () => {
    const { container } = render(<MessageListSkeleton count={3} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('MessageListSkeleton renders correct number of skeletons', () => {
    const { container } = render(<MessageListSkeleton count={5} />)
    // Each MessageSkeleton is a direct child div of the space-y-3 container
    const wrapper = container.querySelector('[aria-label="Chargement des messages..."]')!
    const skeletons = wrapper.querySelectorAll(':scope > [aria-hidden="true"]')
    expect(skeletons.length).toBe(5)
  })

  it('MessageListSkeleton defaults to 8 skeletons', () => {
    const { container } = render(<MessageListSkeleton />)
    const wrapper = container.querySelector('[aria-label="Chargement des messages..."]')!
    const skeletons = wrapper.querySelectorAll(':scope > [aria-hidden="true"]')
    expect(skeletons.length).toBe(8)
  })

  it('MessageListSkeleton has loading aria-label', () => {
    const { container } = render(<MessageListSkeleton count={3} />)
    expect(container.firstChild).toHaveAttribute('aria-label', 'Chargement des messages...')
  })

  it('ConversationSkeleton renders without crash', () => {
    const { container } = render(<ConversationSkeleton />)
    expect(container.firstChild).toBeTruthy()
  })

  it('ConversationSkeleton is aria-hidden', () => {
    const { container } = render(<ConversationSkeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('DMConversationSkeleton renders without crash', () => {
    const { container } = render(<DMConversationSkeleton />)
    expect(container.firstChild).toBeTruthy()
  })

  it('DMConversationSkeleton is aria-hidden', () => {
    const { container } = render(<DMConversationSkeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('ConversationListSkeleton renders without crash', () => {
    const { container } = render(<ConversationListSkeleton count={3} type="dm" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('ConversationListSkeleton renders correct count for squad type', () => {
    const { container } = render(<ConversationListSkeleton count={4} type="squad" />)
    const wrapper = container.querySelector('[aria-label="Chargement des conversations..."]')!
    const skeletons = wrapper.querySelectorAll(':scope > [aria-hidden="true"]')
    expect(skeletons.length).toBe(4)
  })

  it('ConversationListSkeleton renders correct count for dm type', () => {
    const { container } = render(<ConversationListSkeleton count={3} type="dm" />)
    const wrapper = container.querySelector('[aria-label="Chargement des conversations..."]')!
    const skeletons = wrapper.querySelectorAll(':scope > [aria-hidden="true"]')
    expect(skeletons.length).toBe(3)
  })

  it('ConversationListSkeleton has loading aria-label', () => {
    const { container } = render(<ConversationListSkeleton count={3} />)
    expect(container.firstChild).toHaveAttribute('aria-label', 'Chargement des conversations...')
  })

  it('ConversationListSkeleton defaults to 5 and squad type', () => {
    const { container } = render(<ConversationListSkeleton />)
    const wrapper = container.querySelector('[aria-label="Chargement des conversations..."]')!
    const skeletons = wrapper.querySelectorAll(':scope > [aria-hidden="true"]')
    expect(skeletons.length).toBe(5)
  })
})
