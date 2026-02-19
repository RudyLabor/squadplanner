/**
 * P3.4 — Security Tests: XSS Prevention
 * Verifies that user-controlled content is properly sanitized
 * and cannot execute arbitrary scripts when rendered.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// ─── Mocks ────────────────────────────────────────────────
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
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
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }), insert: vi.fn().mockResolvedValue({ data: null }), update: vi.fn().mockResolvedValue({ data: null }), delete: vi.fn().mockResolvedValue({ data: null }), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis() }),
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
vi.mock('../../utils/haptics', () => ({ haptic: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() } }))
vi.mock('../../components/LocationShare', () => ({ isLocationMessage: vi.fn().mockReturnValue(false), parseLocationMessage: vi.fn(), LocationMessage: () => null }))
vi.mock('../../components/ChatPoll', () => ({ isPollMessage: vi.fn().mockReturnValue(false), parsePollData: vi.fn(), ChatPoll: () => null }))

import { MessageContent } from '../../components/MessageContent'

// ═══════════════════════════════════════════════════════════
// XSS PREVENTION — MessageContent
// ═══════════════════════════════════════════════════════════

describe('XSS Prevention — MessageContent', () => {
  function assertNoScriptExecution(container: HTMLElement) {
    // No <script> elements in the rendered output
    expect(container.querySelectorAll('script')).toHaveLength(0)
    // No inline event handlers (onclick, onerror, onload, etc.)
    const allElements = container.querySelectorAll('*')
    allElements.forEach((el) => {
      const attrs = Array.from(el.attributes)
      attrs.forEach((attr) => {
        expect(attr.name.toLowerCase()).not.toMatch(/^on[a-z]/)
      })
    })
    // No javascript: URLs
    const links = container.querySelectorAll('a[href]')
    links.forEach((link) => {
      const href = link.getAttribute('href') || ''
      expect(href.toLowerCase()).not.toMatch(/^javascript:/i)
    })
    // No data: URLs with script content
    const allSrc = container.querySelectorAll('[src]')
    allSrc.forEach((el) => {
      const src = el.getAttribute('src') || ''
      expect(src.toLowerCase()).not.toMatch(/^data:text\/html/i)
    })
  }

  // ─── Script injection ───────────────────────────────────
  it('neutralizes <script> tags in message content', () => {
    const { container } = render(
      <MessageContent content='<script>alert("xss")</script>' />,
    )
    assertNoScriptExecution(container)
    // The raw text should be visible as escaped text
    expect(container.textContent).toContain('<script>')
  })

  it('neutralizes <script> with encoded characters', () => {
    const { container } = render(
      <MessageContent content='<scr&#105;pt>alert("xss")</script>' />,
    )
    assertNoScriptExecution(container)
  })

  it('neutralizes uppercase <SCRIPT> tags', () => {
    const { container } = render(
      <MessageContent content='<SCRIPT>document.cookie</SCRIPT>' />,
    )
    assertNoScriptExecution(container)
  })

  // ─── Event handler injection ────────────────────────────
  it('neutralizes onerror handlers in img tags', () => {
    const { container } = render(
      <MessageContent content='<img src=x onerror="alert(1)">' />,
    )
    assertNoScriptExecution(container)
  })

  it('neutralizes onload handlers', () => {
    const { container } = render(
      <MessageContent content='<body onload="alert(1)">' />,
    )
    assertNoScriptExecution(container)
  })

  it('neutralizes onmouseover handlers', () => {
    const { container } = render(
      <MessageContent content='<div onmouseover="alert(1)">hover me</div>' />,
    )
    assertNoScriptExecution(container)
  })

  // ─── JavaScript URL injection ───────────────────────────
  it('neutralizes javascript: protocol in URLs', () => {
    const { container } = render(
      <MessageContent content='javascript:alert(document.cookie)' />,
    )
    assertNoScriptExecution(container)
  })

  it('neutralizes encoded javascript: URLs', () => {
    const { container } = render(
      <MessageContent content='java&#115;cript:alert(1)' />,
    )
    assertNoScriptExecution(container)
  })

  // ─── XSS via markdown-like formatting ───────────────────
  it('neutralizes XSS in bold markers', () => {
    const { container } = render(
      <MessageContent content='**<img src=x onerror=alert(1)>**' />,
    )
    assertNoScriptExecution(container)
  })

  it('neutralizes XSS in code markers', () => {
    const { container } = render(
      <MessageContent content='`<script>alert(1)</script>`' />,
    )
    assertNoScriptExecution(container)
    // Should show raw content inside code block
    expect(container.textContent).toContain('<script>')
  })

  // ─── XSS via @mention ──────────────────────────────────
  it('neutralizes XSS in @mention usernames', () => {
    const { container } = render(
      <MessageContent content='@<script>alert(1)</script>' />,
    )
    assertNoScriptExecution(container)
  })

  it('neutralizes SVG/XML payloads in mentions', () => {
    const { container } = render(
      <MessageContent content='@"><svg/onload=alert(1)>' />,
    )
    assertNoScriptExecution(container)
  })

  // ─── XSS via URL detection ─────────────────────────────
  it('renders safe URLs as links', () => {
    const { container } = render(
      <MessageContent content='Visit https://example.com for more' />,
    )
    const link = container.querySelector('a')
    expect(link).toBeTruthy()
    expect(link?.getAttribute('href')).toBe('https://example.com')
  })

  it('does not render javascript: as clickable link', () => {
    const { container } = render(
      <MessageContent content='javascript:void(0)' />,
    )
    const links = container.querySelectorAll('a')
    links.forEach((link) => {
      expect(link.getAttribute('href')?.toLowerCase()).not.toMatch(/^javascript:/i)
    })
  })

  // ─── XSS via GIF URL injection ─────────────────────────
  it('does not execute JS from a crafted image src', () => {
    const { container } = render(
      <MessageContent content='https://media.giphy.com/media/test/giphy.gif" onerror="alert(1)' />,
    )
    assertNoScriptExecution(container)
  })

  // ─── HTML entity exploitation ──────────────────────────
  it('handles HTML entities without script execution', () => {
    const { container } = render(
      <MessageContent content='&lt;script&gt;alert(1)&lt;/script&gt;' />,
    )
    assertNoScriptExecution(container)
  })

  // ─── Null byte injection ───────────────────────────────
  it('handles null bytes in content', () => {
    const { container } = render(
      <MessageContent content={'Hello\x00<script>alert(1)</script>'} />,
    )
    assertNoScriptExecution(container)
  })

  // ─── Unicode direction override ────────────────────────
  it('handles Unicode bidirectional override characters', () => {
    const { container } = render(
      <MessageContent content={'Hello \u202E\u0070\u0069\u0072\u0063\u0073\u003C'} />,
    )
    assertNoScriptExecution(container)
  })

  // ─── Long content / DoS ────────────────────────────────
  it('handles extremely long messages without hanging', () => {
    const longContent = 'A'.repeat(100000)
    const start = performance.now()
    const { container } = render(<MessageContent content={longContent} />)
    const elapsed = performance.now() - start
    expect(container).toBeTruthy()
    expect(elapsed).toBeLessThan(5000) // Should render within 5s
  })

  it('handles deeply nested markdown without ReDoS', () => {
    const nestedContent = '**'.repeat(100) + 'text' + '**'.repeat(100)
    const start = performance.now()
    const { container } = render(<MessageContent content={nestedContent} />)
    const elapsed = performance.now() - start
    expect(container).toBeTruthy()
    expect(elapsed).toBeLessThan(5000)
  })
})
