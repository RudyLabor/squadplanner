import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, forwardRef } from 'react'

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
}))

function makeMotionProxy() {
  const cache = new Map<string, any>()
  return new Proxy(
    {},
    {
      get: (_t: any, p: string) => {
        if (typeof p !== 'string') return undefined
        if (!cache.has(p)) {
          const comp = forwardRef(({ children, ...r }: any, ref: any) =>
            createElement(p, { ...r, ref }, children)
          )
          comp.displayName = `motion.${p}`
          cache.set(p, comp)
        }
        return cache.get(p)
      },
    }
  )
}

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
  m: makeMotionProxy(),
  motion: makeMotionProxy(),
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
  Button: ({ children, ...props }: any) => createElement('button', props, children),
}))

vi.mock('../../../components/ui/Tooltip', () => ({
  Tooltip: ({ children }: any) => children,
}))

vi.mock('../../../hooks/useCallHistory', () => ({
  formatDuration: (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
  formatRelativeTime: () => 'il y a 5min',
}))

import { CallHistoryList } from '../CallHistoryList'

// Helper to make calls at specific dates
function makeCall(
  overrides: Partial<{
    id: string
    type: 'incoming' | 'outgoing'
    status: string
    contactId: string
    contactName: string
    contactAvatar: string | null
    durationSeconds: number | null
    createdAt: Date | string
  }> = {}
) {
  const now = new Date()
  return {
    id: overrides.id ?? '1',
    type: overrides.type ?? 'incoming',
    status: overrides.status ?? 'completed',
    contactId: overrides.contactId ?? 'c1',
    contactName: overrides.contactName ?? 'TestUser',
    contactAvatar: overrides.contactAvatar ?? null,
    durationSeconds: overrides.durationSeconds ?? 120,
    createdAt: overrides.createdAt ?? now.toISOString(),
  }
}

const defaultProps = {
  filteredCalls: [] as any[],
  filter: 'all',
  callStatus: 'idle',
  onCall: vi.fn(),
}

describe('CallHistoryList', () => {
  // =========================================================================
  // Empty state
  // =========================================================================
  describe('empty state', () => {
    it('shows "Prêt à appeler ta squad" when no calls and filter=all', () => {
      render(<CallHistoryList {...defaultProps} />)
      expect(screen.getByText(/Prêt à appeler ta squad/)).toBeInTheDocument()
    })

    it('shows "Lance un appel vocal" description when filter=all', () => {
      render(<CallHistoryList {...defaultProps} />)
      expect(screen.getByText(/Lance un appel vocal/)).toBeInTheDocument()
    })

    it('shows "Aller en party vocale" link when filter=all', () => {
      render(<CallHistoryList {...defaultProps} />)
      expect(screen.getByText('Aller en party vocale')).toBeInTheDocument()
    })

    it('shows "Rien pour le moment" when filter=incoming and no calls', () => {
      render(<CallHistoryList {...defaultProps} filter="incoming" />)
      expect(screen.getByText(/Rien pour le moment/)).toBeInTheDocument()
    })

    it('shows "entrant" in description for incoming filter', () => {
      render(<CallHistoryList {...defaultProps} filter="incoming" />)
      expect(screen.getByText(/entrant/)).toBeInTheDocument()
    })

    it('shows "sortant" in description for outgoing filter', () => {
      render(<CallHistoryList {...defaultProps} filter="outgoing" />)
      expect(screen.getByText(/sortant/)).toBeInTheDocument()
    })

    it('shows "manqué" in description for missed filter', () => {
      render(<CallHistoryList {...defaultProps} filter="missed" />)
      expect(screen.getByText(/manqu/)).toBeInTheDocument()
    })

    it('does not show "Aller en party vocale" link for non-all filter', () => {
      render(<CallHistoryList {...defaultProps} filter="incoming" />)
      expect(screen.queryByText('Aller en party vocale')).not.toBeInTheDocument()
    })
  })

  // =========================================================================
  // Call rendering
  // =========================================================================
  describe('call rendering', () => {
    it('renders contact name', () => {
      const calls = [makeCall({ contactName: 'Alice' })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('renders call duration formatted', () => {
      const calls = [makeCall({ durationSeconds: 120 })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.getByText('2:00')).toBeInTheDocument()
    })

    it('renders relative time', () => {
      const calls = [makeCall()]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.getByText('il y a 5min')).toBeInTheDocument()
    })

    it('does not render duration when null', () => {
      const calls = [makeCall({ durationSeconds: null })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.queryByText(':')).not.toBeInTheDocument()
    })

    it('does not render duration when 0', () => {
      const calls = [makeCall({ durationSeconds: 0 })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      // 0:00 should not be shown (condition: durationSeconds > 0)
      expect(screen.queryByText('0:00')).not.toBeInTheDocument()
    })
  })

  // =========================================================================
  // Call types and status labels
  // =========================================================================
  describe('call types and statuses', () => {
    it('shows "Entrant" label for incoming completed call', () => {
      const calls = [makeCall({ type: 'incoming', status: 'completed' })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.getByText('Entrant')).toBeInTheDocument()
    })

    it('shows "Sortant" label for outgoing completed call', () => {
      const calls = [makeCall({ type: 'outgoing', status: 'completed' })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.getByText('Sortant')).toBeInTheDocument()
    })

    it('shows "Manqué" label for missed call', () => {
      const calls = [makeCall({ status: 'missed' })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.getByText('Manqué')).toBeInTheDocument()
    })

    it('shows "Rejeté" label for rejected call', () => {
      const calls = [makeCall({ status: 'rejected' })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.getByText('Rejeté')).toBeInTheDocument()
    })

    it('shows contact name with error styling for missed call', () => {
      const calls = [makeCall({ status: 'missed', contactName: 'Bob' })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      const name = screen.getByText('Bob')
      expect(name.className).toContain('text-error')
    })

    it('shows contact name with warning styling for rejected call', () => {
      const calls = [makeCall({ status: 'rejected', contactName: 'Bob' })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      const name = screen.getByText('Bob')
      expect(name.className).toContain('text-warning')
    })
  })

  // =========================================================================
  // Contact avatar
  // =========================================================================
  describe('contact avatar', () => {
    it('renders avatar image when contactAvatar is provided', () => {
      const calls = [
        makeCall({ contactAvatar: 'https://example.com/avatar.jpg', contactName: 'Alice' }),
      ]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      const img = screen.getByAltText('Alice')
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('renders fallback icon when contactAvatar is null', () => {
      const calls = [makeCall({ contactAvatar: null })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  // =========================================================================
  // Call button
  // =========================================================================
  describe('call button', () => {
    it('renders call button with correct aria-label', () => {
      const calls = [makeCall({ contactName: 'Alice' })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.getByLabelText('Appeler Alice')).toBeInTheDocument()
    })

    it('calls onCall with contact info when call button clicked', async () => {
      const user = userEvent.setup()
      const onCall = vi.fn()
      const calls = [
        makeCall({ contactId: 'c1', contactName: 'Alice', contactAvatar: 'avatar.jpg' }),
      ]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} onCall={onCall} />)
      await user.click(screen.getByLabelText('Appeler Alice'))
      expect(onCall).toHaveBeenCalledWith('c1', 'Alice', 'avatar.jpg')
    })

    it('disables call button when callStatus is not idle', () => {
      const calls = [makeCall({ contactName: 'Alice' })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} callStatus="calling" />)
      expect(screen.getByLabelText('Appeler Alice')).toBeDisabled()
    })

    it('enables call button when callStatus is idle', () => {
      const calls = [makeCall({ contactName: 'Alice' })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} callStatus="idle" />)
      expect(screen.getByLabelText('Appeler Alice')).not.toBeDisabled()
    })
  })

  // =========================================================================
  // Grouping by date
  // =========================================================================
  describe('grouping', () => {
    it('groups today calls under "Aujourd\'hui"', () => {
      const today = new Date()
      const calls = [makeCall({ createdAt: today.toISOString() })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.getByText("Aujourd'hui")).toBeInTheDocument()
    })

    it('groups yesterday calls under "Hier"', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(12, 0, 0, 0)
      const calls = [makeCall({ createdAt: yesterday.toISOString() })]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.getByText('Hier')).toBeInTheDocument()
    })

    it('renders multiple groups when calls span different periods', () => {
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(12, 0, 0, 0)
      const calls = [
        makeCall({ id: '1', createdAt: today.toISOString() }),
        makeCall({ id: '2', createdAt: yesterday.toISOString() }),
      ]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.getByText("Aujourd'hui")).toBeInTheDocument()
      expect(screen.getByText('Hier')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // "You've seen all calls" message
  // =========================================================================
  describe('pagination indicators', () => {
    it('shows "Tu as vu tous tes appels" when all calls displayed', () => {
      const calls = [makeCall()]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.getByText('Tu as vu tous tes appels')).toBeInTheDocument()
    })

    it('shows loading indicator when there are more calls to show', () => {
      // Create more than PAGE_SIZE (10) calls
      const calls = Array.from({ length: 15 }, (_, i) =>
        makeCall({ id: String(i), contactName: `User${i}` })
      )
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.getByText('Chargement...')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Multiple calls rendering
  // =========================================================================
  describe('multiple calls', () => {
    it('renders multiple call entries', () => {
      const calls = [
        makeCall({ id: '1', contactName: 'Alice' }),
        makeCall({ id: '2', contactName: 'Bob' }),
        makeCall({ id: '3', contactName: 'Charlie' }),
      ]
      render(<CallHistoryList {...defaultProps} filteredCalls={calls} />)
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()
    })
  })
})
