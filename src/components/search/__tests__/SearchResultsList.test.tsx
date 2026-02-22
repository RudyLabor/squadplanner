import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { SearchResultsList } from '../SearchResultsList'

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
  '../../icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t, name) =>
          typeof name === 'string'
            ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
            : undefined,
      }
    )
)

const MockIcon = (props: any) => createElement('svg', { ...props })

describe('SearchResultsList', () => {
  const baseProps = {
    selectedIndex: 0,
    setSelectedIndex: vi.fn(),
    onSelect: vi.fn(),
    isLoading: false,
  }

  it('renders loading state', () => {
    render(
      <SearchResultsList
        {...baseProps}
        query="test"
        results={[]}
        groupedResults={{}}
        isLoading={true}
      />
    )
    expect(screen.getByText('Recherche en cours...')).toBeDefined()
  })

  it('renders no results message when query has no matches', () => {
    render(<SearchResultsList {...baseProps} query="xyz" results={[]} groupedResults={{}} />)
    expect(screen.getByText(/Aucun résultat pour "xyz"/)).toBeDefined()
  })

  it('renders prompt when no query', () => {
    render(<SearchResultsList {...baseProps} query="" results={[]} groupedResults={{}} />)
    expect(screen.getByText('Commence à taper pour rechercher')).toBeDefined()
  })

  it('renders grouped results', () => {
    const results = [
      { id: 'r1', type: 'squad' as const, title: 'Alpha', icon: MockIcon, path: '/squad/1' },
      {
        id: 'r2',
        type: 'session' as const,
        title: 'Session 1',
        icon: MockIcon,
        path: '/session/1',
      },
    ]
    render(
      <SearchResultsList
        {...baseProps}
        query="test"
        results={results}
        groupedResults={{
          squad: [results[0]],
          session: [results[1]],
        }}
      />
    )
    expect(screen.getByText('Squads')).toBeDefined()
    expect(screen.getByText('Sessions')).toBeDefined()
    expect(screen.getByText('Alpha')).toBeDefined()
    expect(screen.getByText('Session 1')).toBeDefined()
  })

  it('calls onSelect when result is clicked', () => {
    const onSelect = vi.fn()
    const results = [
      { id: 'r1', type: 'squad' as const, title: 'Alpha', icon: MockIcon, path: '/squad/1' },
    ]
    render(
      <SearchResultsList
        {...baseProps}
        onSelect={onSelect}
        query="test"
        results={results}
        groupedResults={{ squad: results }}
      />
    )
    fireEvent.click(screen.getByText('Alpha'))
    expect(onSelect).toHaveBeenCalledWith(results[0])
  })

  it('renders subtitle when present', () => {
    const results = [
      {
        id: 'r1',
        type: 'squad' as const,
        title: 'Alpha',
        subtitle: 'Valorant squad',
        icon: MockIcon,
        path: '/squad/1',
      },
    ]
    render(
      <SearchResultsList
        {...baseProps}
        query="test"
        results={results}
        groupedResults={{ squad: results }}
      />
    )
    expect(screen.getByText('Valorant squad')).toBeDefined()
  })
})
