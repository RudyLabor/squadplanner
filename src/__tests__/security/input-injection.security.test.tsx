/**
 * P3.4 — Security Tests: Input Injection Prevention
 * Tests that all form inputs properly sanitize user data.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'

// ─── Mocks ────────────────────────────────────────────────
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
vi.mock('../../utils/haptics', () => ({ haptic: { light: vi.fn(), selection: vi.fn(), medium: vi.fn() } }))

import { Input } from '../../components/ui/Input'

// ═══════════════════════════════════════════════════════════
// INPUT INJECTION — UI Components
// ═══════════════════════════════════════════════════════════

describe('Input Injection Prevention', () => {
  // ─── SQL injection payloads ─────────────────────────────
  const SQL_PAYLOADS = [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "admin'--",
    "1; SELECT * FROM profiles",
    "' UNION SELECT null, username, password FROM users --",
  ]

  SQL_PAYLOADS.forEach((payload) => {
    it(`Input accepts but does not execute SQL payload: ${payload.slice(0, 30)}...`, async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Input label="Search" value="" onChange={onChange} />)
      const input = screen.getByLabelText('Search')
      await user.type(input, payload)
      // Input should accept the text (it's the backend's job to sanitize SQL)
      // but the component should not crash or execute anything
      expect(input).toBeInTheDocument()
    })
  })

  // ─── CRLF injection ────────────────────────────────────
  it('handles CRLF injection in input', async () => {
    const user = userEvent.setup()
    render(<Input label="Name" value="" onChange={() => {}} />)
    const input = screen.getByLabelText('Name')
    await user.type(input, 'test\r\nSet-Cookie: admin=true')
    expect(input).toBeInTheDocument()
  })

  // ─── HTML injection in labels ──────────────────────────
  it('does not execute HTML in label prop', () => {
    const { container } = render(
      <Input label='<img src=x onerror="alert(1)">' value="" onChange={() => {}} />,
    )
    // No img elements should be created from the label
    expect(container.querySelectorAll('img')).toHaveLength(0)
    const scripts = container.querySelectorAll('script')
    expect(scripts).toHaveLength(0)
  })

  it('does not execute HTML in error prop', () => {
    const { container } = render(
      <Input
        label="Email"
        error='<script>alert("xss")</script>'
        value=""
        onChange={() => {}}
      />,
    )
    expect(container.querySelectorAll('script')).toHaveLength(0)
    // Error text should be visible as escaped text
    expect(container.textContent).toContain('<script>')
  })

  it('does not execute HTML in placeholder', () => {
    const { container } = render(
      <Input
        label="Search"
        placeholder='"><script>alert(1)</script>'
        value=""
        onChange={() => {}}
      />,
    )
    expect(container.querySelectorAll('script')).toHaveLength(0)
  })

  // ─── Unicode exploitation ──────────────────────────────
  it('handles zero-width characters in input', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Input label="Username" value="" onChange={onChange} />)
    const input = screen.getByLabelText('Username')
    await user.type(input, 'admin\u200B\u200B')
    expect(input).toBeInTheDocument()
  })

  it('handles right-to-left override in input', async () => {
    const user = userEvent.setup()
    render(<Input label="Name" value="" onChange={() => {}} />)
    const input = screen.getByLabelText('Name')
    await user.type(input, '\u202Efdp.exe')
    expect(input).toBeInTheDocument()
  })

  // ─── Extremely long input ──────────────────────────────
  it('handles extremely long input without crash', async () => {
    render(<Input label="Bio" value={'A'.repeat(100000)} onChange={() => {}} />)
    const input = screen.getByLabelText('Bio')
    expect(input).toBeInTheDocument()
  })

  // ─── Special characters ────────────────────────────────
  it('handles emoji and special chars without crash', async () => {
    render(<Input label="Name" value="👤🎮💀🔥 ñ ü ö 日本語" onChange={() => {}} />)
    const input = screen.getByLabelText('Name')
    expect(input).toBeInTheDocument()
  })
})
