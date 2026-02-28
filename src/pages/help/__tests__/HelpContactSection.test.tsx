import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
}))

vi.mock(
  '../../../components/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t: any, p: string) =>
          typeof p === 'string'
            ? ({ children, ...props }: any) => createElement('span', props, children)
            : undefined,
      }
    )
)

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  Select: ({ options, value, onChange, ...props }: any) =>
    createElement(
      'select',
      { value, onChange: (e: any) => onChange(e.target.value), ...props },
      options?.map((o: any) => createElement('option', { key: o.value, value: o.value }, o.label))
    ),
}))

import { HelpContactSection } from '../HelpContactSection'

describe('HelpContactSection', () => {
  // STRICT: verifies initial form state — title, description, subject selector with options, textarea placeholder, send button disabled
  it('renders contact form with title, description, subject options, message field, and disabled send button', () => {
    const { container } = render(<HelpContactSection />)

    // 1. Section title
    expect(screen.getByText('Contacter le support')).toBeDefined()
    // 2. Description text about response time
    expect(screen.getByText(/Réponse sous 48h/)).toBeDefined()
    // 3. Subject label present
    expect(screen.getByText('Sujet')).toBeDefined()
    // 4. Message label present
    expect(screen.getByText('Message')).toBeDefined()
    // 5. Textarea placeholder
    expect(screen.getByPlaceholderText('Décris ton problème ou ta suggestion...')).toBeDefined()
    // 6. Send button present
    expect(screen.getByText('Envoyer le message')).toBeDefined()
    // 7. Subject options (Bug, Suggestion, Question, Autre)
    const select = container.querySelector('select')
    expect(select).not.toBeNull()
    expect(screen.getByText('Bug')).toBeDefined()
    expect(screen.getByText('Suggestion')).toBeDefined()
    expect(screen.getByText('Question')).toBeDefined()
    expect(screen.getByText('Autre')).toBeDefined()
    // 8. Send button disabled when message is empty
    const sendButton = screen.getByText('Envoyer le message').closest('button')
    expect(sendButton?.disabled).toBe(true)
  })

  // STRICT: verifies send button enable/disable based on message content — empty disables, whitespace disables, content enables
  it('enables send button only when message has non-whitespace content', () => {
    render(<HelpContactSection />)

    const textarea = screen.getByPlaceholderText('Décris ton problème ou ta suggestion...')
    const sendButton = screen.getByText('Envoyer le message').closest('button')

    // 1. Initially disabled
    expect(sendButton?.disabled).toBe(true)

    // 2. Still disabled with whitespace only
    fireEvent.change(textarea, { target: { value: '   ' } })
    expect(sendButton?.disabled).toBe(true)

    // 3. Enabled with real content
    fireEvent.change(textarea, { target: { value: 'Mon problème est...' } })
    expect(sendButton?.disabled).toBe(false)

    // 4. Disabled again when cleared
    fireEvent.change(textarea, { target: { value: '' } })
    expect(sendButton?.disabled).toBe(true)

    // 5. Enabled with minimal content
    fireEvent.change(textarea, { target: { value: 'x' } })
    expect(sendButton?.disabled).toBe(false)

    // 6. Textarea value updates correctly
    expect((textarea as HTMLTextAreaElement).value).toBe('x')
  })

  // STRICT: verifies success state after sending — success message shown, form hidden, "Envoyer un autre message" button visible
  it('shows success state after sending and allows resetting the form', () => {
    render(<HelpContactSection />)

    const textarea = screen.getByPlaceholderText('Décris ton problème ou ta suggestion...')

    // 1. Fill in a message
    fireEvent.change(textarea, { target: { value: 'Je rencontre un bug avec le chat' } })
    expect(screen.getByText('Envoyer le message')).toBeDefined()

    // 2. Click send (we need to mock window.location)
    const originalHref = window.location.href
    Object.defineProperty(window, 'location', { value: { href: originalHref }, writable: true })
    fireEvent.click(screen.getByText('Envoyer le message').closest('button')!)

    // 3. Success message appears
    expect(screen.getByText('Message envoyé !')).toBeDefined()
    // 4. Thank you message shown
    expect(screen.getByText(/Merci pour ton message/)).toBeDefined()
    // 5. "Envoyer un autre message" button visible
    expect(screen.getByText('Envoyer un autre message')).toBeDefined()
    // 6. Original form hidden (send button gone)
    expect(screen.queryByText('Envoyer le message')).toBeNull()

    // 7. Click "Envoyer un autre message" resets the form
    fireEvent.click(screen.getByText('Envoyer un autre message'))
    expect(screen.getByText('Envoyer le message')).toBeDefined()
    // 8. Message field cleared
    const newTextarea = screen.getByPlaceholderText('Décris ton problème ou ta suggestion...')
    expect((newTextarea as HTMLTextAreaElement).value).toBe('')
  })
})
