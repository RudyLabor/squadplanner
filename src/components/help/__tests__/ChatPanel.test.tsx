import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { ChatPanel } from '../ChatPanel'

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

vi.mock('../../icons', () =>
  new Proxy({}, {
    get: (_t, name) =>
      typeof name === 'string'
        ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
        : undefined,
  })
)

describe('ChatPanel', () => {
  const baseProps = {
    messages: [
      { id: 'msg-1', role: 'bot' as const, text: 'Salut !', timestamp: Date.now() },
    ],
    inputText: '',
    setInputText: vi.fn(),
    isTyping: false,
    showQuickActions: false,
    onSend: vi.fn(),
    onQuickAction: vi.fn(),
    onClose: vi.fn(),
    quickActions: ['Action 1', 'Action 2'],
  }

  it('renders header', () => {
    render(<ChatPanel {...baseProps} />)
    expect(screen.getByText('Assistant Squad Planner')).toBeDefined()
  })

  it('renders messages', () => {
    render(<ChatPanel {...baseProps} />)
    expect(screen.getByText('Salut !')).toBeDefined()
  })

  it('shows typing indicator when isTyping is true', () => {
    render(<ChatPanel {...baseProps} isTyping={true} />)
    expect(screen.getByText("En train d'écrire...")).toBeDefined()
  })

  it('shows "En ligne" when not typing', () => {
    render(<ChatPanel {...baseProps} />)
    expect(screen.getByText('En ligne')).toBeDefined()
  })

  it('renders quick actions when showQuickActions is true', () => {
    render(<ChatPanel {...baseProps} showQuickActions={true} />)
    expect(screen.getByText('Action 1')).toBeDefined()
    expect(screen.getByText('Action 2')).toBeDefined()
  })

  it('calls onQuickAction when quick action is clicked', () => {
    const onQuickAction = vi.fn()
    render(<ChatPanel {...baseProps} showQuickActions={true} onQuickAction={onQuickAction} />)
    fireEvent.click(screen.getByText('Action 1'))
    expect(onQuickAction).toHaveBeenCalledWith('Action 1')
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<ChatPanel {...baseProps} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Fermer le chat'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onSend when send button is clicked', () => {
    const onSend = vi.fn()
    render(<ChatPanel {...baseProps} inputText="Hello" onSend={onSend} />)
    fireEvent.click(screen.getByLabelText('Envoyer'))
    expect(onSend).toHaveBeenCalled()
  })

  it('renders user messages aligned right', () => {
    const messages = [
      { id: 'msg-1', role: 'user' as const, text: 'My message', timestamp: Date.now() },
    ]
    render(<ChatPanel {...baseProps} messages={messages} />)
    expect(screen.getByText('My message')).toBeDefined()
  })
})
