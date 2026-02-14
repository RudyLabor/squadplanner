import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
vi.mock('../../lib/supabaseMinimal', () => ({ supabaseMinimal: { from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }) }, supabase: { from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }) }, isSupabaseReady: vi.fn().mockReturnValue(true) }))
vi.mock('../../hooks/useAuth', () => ({ useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }) }))
vi.mock('../../hooks', () => ({ useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }) }))
vi.mock('../../lib/i18n', () => ({ useT: () => (key: string) => key, useLocale: () => 'fr', useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }) }))
vi.mock('../../lib/toast', () => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn() }))
vi.mock('../../utils/haptics', () => ({ haptic: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() } }))

import { MessageReplyPreview } from '../MessageReplyPreview'

const baseMessage = {
  id: '1',
  sender_id: 'u1',
  sender_username: 'Alice',
  content: 'Hey there!',
}

describe('MessageReplyPreview', () => {
  it('renders without crash', () => {
    render(<MessageReplyPreview originalMessage={baseMessage} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Hey there!')).toBeInTheDocument()
  })

  it('displays sender username', () => {
    render(<MessageReplyPreview originalMessage={baseMessage} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('displays message content', () => {
    render(<MessageReplyPreview originalMessage={baseMessage} />)
    expect(screen.getByText('Hey there!')).toBeInTheDocument()
  })

  it('truncates long content to 100 characters', () => {
    const longContent = 'A'.repeat(150)
    render(<MessageReplyPreview originalMessage={{ ...baseMessage, content: longContent }} />)
    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument()
  })

  it('does not truncate content under 100 characters', () => {
    const shortContent = 'Short message'
    render(<MessageReplyPreview originalMessage={{ ...baseMessage, content: shortContent }} />)
    expect(screen.getByText('Short message')).toBeInTheDocument()
    expect(screen.queryByText(/\.\.\.$/)).not.toBeInTheDocument()
  })

  it('shows initial letter when no avatar is provided', () => {
    render(<MessageReplyPreview originalMessage={baseMessage} />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('shows avatar image when sender_avatar is provided', () => {
    render(
      <MessageReplyPreview
        originalMessage={{ ...baseMessage, sender_avatar: 'https://example.com/avatar.jpg' }}
      />
    )
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    expect(img).toHaveAttribute('alt', 'Alice')
  })

  it('has role="button" when onClickScrollTo is provided', () => {
    const { container } = render(
      <MessageReplyPreview originalMessage={baseMessage} onClickScrollTo={vi.fn()} />
    )
    expect(container.querySelector('[role="button"]')).toBeInTheDocument()
  })

  it('does not have role="button" when onClickScrollTo is not provided', () => {
    const { container } = render(<MessageReplyPreview originalMessage={baseMessage} />)
    expect(container.querySelector('[role="button"]')).not.toBeInTheDocument()
  })

  it('calls onClickScrollTo when clicked', () => {
    const onClickScrollTo = vi.fn()
    const { container } = render(
      <MessageReplyPreview originalMessage={baseMessage} onClickScrollTo={onClickScrollTo} />
    )
    fireEvent.click(container.firstChild!)
    expect(onClickScrollTo).toHaveBeenCalledOnce()
  })

  it('calls onClickScrollTo on Enter key', () => {
    const onClickScrollTo = vi.fn()
    const { container } = render(
      <MessageReplyPreview originalMessage={baseMessage} onClickScrollTo={onClickScrollTo} />
    )
    fireEvent.keyDown(container.firstChild!, { key: 'Enter' })
    expect(onClickScrollTo).toHaveBeenCalledOnce()
  })

  it('calls onClickScrollTo on Space key', () => {
    const onClickScrollTo = vi.fn()
    const { container } = render(
      <MessageReplyPreview originalMessage={baseMessage} onClickScrollTo={onClickScrollTo} />
    )
    fireEvent.keyDown(container.firstChild!, { key: ' ' })
    expect(onClickScrollTo).toHaveBeenCalledOnce()
  })

  it('has cursor-pointer class when clickable', () => {
    const { container } = render(
      <MessageReplyPreview originalMessage={baseMessage} onClickScrollTo={vi.fn()} />
    )
    expect(container.firstChild).toHaveClass('cursor-pointer')
  })

  it('has tabIndex 0 when clickable', () => {
    const { container } = render(
      <MessageReplyPreview originalMessage={baseMessage} onClickScrollTo={vi.fn()} />
    )
    expect(container.querySelector('[tabindex="0"]')).toBeInTheDocument()
  })

  it('renders border-primary left border', () => {
    const { container } = render(<MessageReplyPreview originalMessage={baseMessage} />)
    expect(container.firstChild).toHaveClass('border-primary')
  })
})
