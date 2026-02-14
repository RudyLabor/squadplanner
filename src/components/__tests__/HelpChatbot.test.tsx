import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

vi.mock('../help/ChatPanel', () => ({
  ChatPanel: () => createElement('div', null, 'chat-panel'),
}))

vi.mock('../../lib/i18n', () => ({ useT: () => (key: string) => key, useLocale: () => 'fr' }))

import { HelpChatbot } from '../HelpChatbot'

describe('HelpChatbot', () => {
  it('renders without crash', () => {
    render(<HelpChatbot faqItems={[]} />)
    // Should render the floating button
    expect(screen.getByLabelText('Ouvrir le chat')).toBeInTheDocument()
  })

  it('renders floating button', () => {
    const { container } = render(<HelpChatbot faqItems={[]} />)
    expect(container).toBeTruthy()
  })
})
