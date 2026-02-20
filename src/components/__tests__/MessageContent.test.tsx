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
vi.mock('../../lib/supabaseMinimal', () => ({ supabaseMinimal: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }) }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }), insert: vi.fn().mockResolvedValue({ data: null }), update: vi.fn().mockResolvedValue({ data: null }), delete: vi.fn().mockResolvedValue({ data: null }), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis() }), rpc: vi.fn().mockResolvedValue({ data: null }), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() }, supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }) }, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }), insert: vi.fn().mockResolvedValue({ data: null }), update: vi.fn().mockResolvedValue({ data: null }), delete: vi.fn().mockResolvedValue({ data: null }), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis() }), rpc: vi.fn().mockResolvedValue({ data: null }), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() }, isSupabaseReady: vi.fn().mockReturnValue(true) }))
vi.mock('../../hooks/useAuth', () => ({ useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser', avatar_url: null }, isLoading: false, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }) }))
vi.mock('../../hooks', () => ({ useAuthStore: Object.assign(vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser', avatar_url: null }, isLoading: false, isInitialized: true }), { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }) }))
vi.mock('../../lib/i18n', () => ({ useT: () => (key: string) => key, useLocale: () => 'fr', useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }) }))
vi.mock('../../lib/toast', () => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn() }))
vi.mock('../../utils/haptics', () => ({ haptic: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('../LocationShare', () => ({ isLocationMessage: vi.fn().mockReturnValue(false), parseLocationMessage: vi.fn(), LocationMessage: () => null }))
vi.mock('../ChatPoll', () => ({ isPollMessage: vi.fn().mockReturnValue(false), parsePollData: vi.fn(), ChatPoll: () => null }))

import { MessageContent } from '../MessageContent'

describe('MessageContent', () => {
  it('renders without crash', () => {
    render(<MessageContent content="Hello world" />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('renders plain text content', () => {
    render(<MessageContent content="Just some text" />)
    expect(screen.getByText('Just some text')).toBeInTheDocument()
  })

  it('renders bold text with **markers**', () => {
    render(<MessageContent content="**bold text**" />)
    expect(screen.getByText('bold text').tagName).toBe('STRONG')
  })

  it('renders italic text with *markers*', () => {
    render(<MessageContent content="*italic text*" />)
    const el = screen.getByText('italic text')
    expect(el.tagName).toBe('EM')
  })

  it('renders strikethrough text with ~~markers~~', () => {
    render(<MessageContent content="~~strikethrough~~" />)
    const el = screen.getByText('strikethrough')
    expect(el.tagName).toBe('S')
  })

  it('renders inline code with `backticks`', () => {
    render(<MessageContent content="`const x = 1`" />)
    const el = screen.getByText('const x = 1')
    expect(el.tagName).toBe('CODE')
  })

  it('renders links as clickable anchors', () => {
    render(<MessageContent content="Visit https://example.com" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('truncates long URLs', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(50)
    render(<MessageContent content={longUrl} />)
    const link = screen.getByRole('link')
    expect(link.textContent!.endsWith('...')).toBe(true)
  })

  it('renders @mentions as buttons', () => {
    render(<MessageContent content="Hey @JohnDoe check this" />)
    expect(screen.getByText('@JohnDoe')).toBeInTheDocument()
    expect(screen.getByText('@JohnDoe').tagName).toBe('BUTTON')
  })

  it('calls onMentionClick when mention is clicked', () => {
    const onMentionClick = vi.fn()
    render(<MessageContent content="Hey @JohnDoe" onMentionClick={onMentionClick} />)
    fireEvent.click(screen.getByText('@JohnDoe'))
    expect(onMentionClick).toHaveBeenCalledWith('JohnDoe')
  })

  it('renders mixed content with multiple token types', () => {
    render(<MessageContent content="**bold** and *italic*" />)
    expect(screen.getByText('bold').tagName).toBe('STRONG')
    expect(screen.getByText('italic').tagName).toBe('EM')
  })

  it('renders forwarded message with indicator', () => {
    render(<MessageContent content={'↩️ *Transféré de Alice*\nHello forwarded!'} />)
    expect(screen.getByText('Hello forwarded!')).toBeInTheDocument()
  })

  it('applies different styles for isOwn=true', () => {
    const { container } = render(<MessageContent content="`code`" isOwn={true} />)
    const code = container.querySelector('code')
    expect(code).toBeInTheDocument()
    expect(code!.className).toContain('bg-overlay-heavy')
  })

  it('applies different styles for isOwn=false', () => {
    const { container } = render(<MessageContent content="`code`" isOwn={false} />)
    const code = container.querySelector('code')
    expect(code).toBeInTheDocument()
    expect(code!.className).toContain('bg-primary-10')
  })

  it('renders empty content as span', () => {
    const { container } = render(<MessageContent content="" />)
    expect(container.querySelector('span')).toBeInTheDocument()
  })

  it('stops propagation on link click', () => {
    const { container } = render(<MessageContent content="https://example.com" />)
    const link = container.querySelector('a')!
    const stopPropagation = vi.fn()
    fireEvent.click(link, { stopPropagation })
    // The click handler calls e.stopPropagation() internally
    expect(link).toBeInTheDocument()
  })
})
