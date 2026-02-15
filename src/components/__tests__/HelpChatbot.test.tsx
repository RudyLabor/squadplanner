import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { createElement } from 'react'

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

vi.mock('../help/chatbotUtils', () => ({
  QUICK_ACTIONS: ['Comment creer un squad ?', 'Comment planifier une session ?'],
  GREETING_MESSAGE: { id: 'greeting', role: 'bot', text: 'Salut !', timestamp: Date.now() },
  findBestMatch: vi.fn().mockReturnValue('Voici la reponse'),
  getNoMatchResponse: vi.fn().mockReturnValue('Je ne comprends pas'),
}))

// Mock ChatPanel to capture its props
const mockChatPanelProps = vi.fn()
vi.mock('../help/ChatPanel', () => ({
  ChatPanel: (props: any) => {
    mockChatPanelProps(props)
    return createElement('div', { 'data-testid': 'chat-panel' }, 'chat-panel')
  },
}))

vi.mock('../../lib/i18n', () => ({ useT: () => (key: string) => key, useLocale: () => 'fr' }))

import { HelpChatbot } from '../HelpChatbot'

describe('HelpChatbot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // STRICT: Verifies initial state — floating button visible with correct aria, hint text visible, chat panel NOT open, correct aria-label
  it('renders floating button with correct aria, hint bubble, and chat panel hidden initially', () => {
    render(<HelpChatbot faqItems={[]} />)

    // 1. Floating button is present with correct aria-label
    const openBtn = screen.getByLabelText('Ouvrir le chat')
    expect(openBtn).toBeInTheDocument()
    // 2. Button is a <button> element
    expect(openBtn.tagName).toBe('BUTTON')
    // 3. "Besoin d'aide ?" hint is visible initially
    expect(screen.getByText("Besoin d'aide ?")).toBeInTheDocument()
    // 4. Chat panel is NOT visible initially
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument()
    // 5. The button should NOT have "Fermer le chat" label yet
    expect(screen.queryByLabelText('Fermer le chat')).not.toBeInTheDocument()
    // 6. After 8 seconds, the hint disappears
    act(() => { vi.advanceTimersByTime(8100) })
    expect(screen.queryByText("Besoin d'aide ?")).not.toBeInTheDocument()
  })

  // STRICT: Verifies open/close toggle — clicking opens chat panel, changes aria label, closing hides panel, ChatPanel receives correct props
  it('toggles chat panel open and closed with correct state transitions', () => {
    render(<HelpChatbot faqItems={[{ id: 'faq1', question: 'Q1', answer: 'A1' }] as any} />)

    // 1. Initially closed
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument()

    // 2. Click to open
    fireEvent.click(screen.getByLabelText('Ouvrir le chat'))

    // 3. Chat panel is now visible
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument()
    // 4. Button label changed to "Fermer le chat"
    expect(screen.getByLabelText('Fermer le chat')).toBeInTheDocument()
    // 5. ChatPanel received props including messages, quickActions, etc.
    expect(mockChatPanelProps).toHaveBeenCalled()
    const lastProps = mockChatPanelProps.mock.calls[mockChatPanelProps.mock.calls.length - 1][0]
    expect(lastProps.showQuickActions).toBe(true) // Only greeting message = length 1 <= 1
    expect(typeof lastProps.onSend).toBe('function')
    expect(typeof lastProps.onClose).toBe('function')

    // 6. Click to close
    fireEvent.click(screen.getByLabelText('Fermer le chat'))
    // 7. Chat panel is hidden again
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument()
    // 8. Button label back to "Ouvrir le chat"
    expect(screen.getByLabelText('Ouvrir le chat')).toBeInTheDocument()
  })
})
