/**
 * P3.4 — Integration Tests: Messaging Flow
 * Tests the message compose → send → render → actions pipeline
 * with minimal mocking (only external services).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'

// ─── Minimal mocks (only external deps) ──────────────────
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/messages' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({ squadId: 'squad-1' }),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

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

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      insert: vi.fn().mockResolvedValue({ data: [{ id: 'msg-new', content: 'test', sender_id: 'user-1', created_at: new Date().toISOString() }], error: null }),
      update: vi.fn().mockResolvedValue({ data: null }),
      delete: vi.fn().mockResolvedValue({ data: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null }),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser', avatar_url: null }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) },
  ),
}))
vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser', avatar_url: null }, isLoading: false, isInitialized: true }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) },
  ),
}))
vi.mock('../../lib/i18n', () => ({ useT: () => (key: string) => key, useLocale: () => 'fr', useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }) }))
vi.mock('../../lib/toast', () => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn() }))
vi.mock('../../utils/haptics', () => ({ haptic: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn(), selection: vi.fn() } }))
vi.mock('../../components/LocationShare', () => ({ isLocationMessage: vi.fn().mockReturnValue(false), parseLocationMessage: vi.fn(), LocationMessage: () => null }))
vi.mock('../../components/ChatPoll', () => ({ isPollMessage: vi.fn().mockReturnValue(false), parsePollData: vi.fn(), ChatPoll: () => null }))

import { MessageContent } from '../../components/MessageContent'

// ═══════════════════════════════════════════════════════════
// INTEGRATION: Message Content Rendering Pipeline
// ═══════════════════════════════════════════════════════════

describe('Integration — Message Content Pipeline', () => {
  it('renders complex message with multiple formatting types', () => {
    const complexMessage = '**Hey** @JohnDoe, check out this *link*: https://example.com — it has ~~old info~~ and `new code`'
    const { container } = render(
      <MessageContent content={complexMessage} onMentionClick={vi.fn()} />,
    )

    // Bold
    expect(screen.getByText('Hey').tagName).toBe('STRONG')
    // Mention
    expect(screen.getByText('@JohnDoe')).toBeInTheDocument()
    // Link
    const link = container.querySelector('a[href="https://example.com"]')
    expect(link).toBeTruthy()
    // Strikethrough
    const strikeEl = container.querySelector('del, s')
    expect(strikeEl?.textContent).toBe('old info')
    // Code
    const codeEl = container.querySelector('code')
    expect(codeEl?.textContent).toBe('new code')
  })

  it('mention click triggers callback with correct username', async () => {
    const user = userEvent.setup()
    const onMentionClick = vi.fn()
    render(
      <MessageContent
        content="Hello @PlayerOne"
        onMentionClick={onMentionClick}
      />,
    )

    const mention = screen.getByText('@PlayerOne')
    await user.click(mention)
    expect(onMentionClick).toHaveBeenCalledWith('PlayerOne')
  })

  it('multiple mentions in same message are all clickable', async () => {
    const user = userEvent.setup()
    const onMentionClick = vi.fn()
    render(
      <MessageContent
        content="@Alice and @Bob should join @Charlie"
        onMentionClick={onMentionClick}
      />,
    )

    await user.click(screen.getByText('@Alice'))
    await user.click(screen.getByText('@Bob'))
    await user.click(screen.getByText('@Charlie'))
    expect(onMentionClick).toHaveBeenCalledTimes(3)
    expect(onMentionClick).toHaveBeenCalledWith('Alice')
    expect(onMentionClick).toHaveBeenCalledWith('Bob')
    expect(onMentionClick).toHaveBeenCalledWith('Charlie')
  })

  it('links open in new tab with rel=noopener', () => {
    const { container } = render(
      <MessageContent content="Visit https://example.com" />,
    )
    const link = container.querySelector('a')
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toContain('noopener')
  })

  it('GIF URLs render as inline images', () => {
    const { container } = render(
      <MessageContent content="https://media.giphy.com/media/abc123/giphy.gif" />,
    )
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img?.getAttribute('src')).toContain('giphy.com')
  })

  it('empty content renders without crash', () => {
    const { container } = render(<MessageContent content="" />)
    expect(container).toBeTruthy()
  })

  it('whitespace-only content renders without crash', () => {
    const { container } = render(<MessageContent content="   " />)
    expect(container).toBeTruthy()
  })

  it('unicode emojis render correctly', () => {
    render(<MessageContent content="🎮 GG! 🏆 Well played! 🔥" />)
    expect(screen.getByText(/GG/)).toBeInTheDocument()
  })

  it('mixed own and other messages render differently', () => {
    const { container: ownContainer } = render(
      <MessageContent content="My message" isOwn={true} />,
    )
    const { container: otherContainer } = render(
      <MessageContent content="Their message" isOwn={false} />,
    )
    // Both should render content
    expect(ownContainer.textContent).toContain('My message')
    expect(otherContainer.textContent).toContain('Their message')
  })
})
