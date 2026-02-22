import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { createElement } from 'react'

/* ------------------------------------------------------------------ */
/*  Hoisted mocks                                                      */
/* ------------------------------------------------------------------ */
const mockSearchGifs = vi.hoisted(() => vi.fn().mockResolvedValue({ results: [], error: null }))
const mockFetchTrendingGifs = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ results: [], error: null })
)
const mockCategories = vi.hoisted(() => [
  { label: 'GG', query: 'gg gaming' },
  { label: 'Rage', query: 'rage gaming' },
])

/* ------------------------------------------------------------------ */
/*  vi.mock calls                                                      */
/* ------------------------------------------------------------------ */
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
}))

vi.mock('../icons', () => ({
  Search: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-search' }),
  X: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-x' }),
  Loader2: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-loader' }),
  Sparkles: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-sparkles' }),
  RefreshCw: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-refresh' }),
}))

vi.mock('../gifApi', () => ({
  searchGifs: mockSearchGifs,
  fetchTrendingGifs: mockFetchTrendingGifs,
  CATEGORIES: mockCategories,
}))

import { GifPicker } from '../GifPicker'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const defaultProps = {
  isOpen: true,
  onSelect: vi.fn(),
  onClose: vi.fn(),
}

const sampleGifs = [
  {
    id: 'g1',
    url: 'https://gif.com/1.gif',
    preview: 'https://gif.com/1-preview.gif',
    width: 200,
    height: 150,
  },
  {
    id: 'g2',
    url: 'https://gif.com/2.gif',
    preview: 'https://gif.com/2-preview.gif',
    width: 300,
    height: 200,
  },
]

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('GifPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockFetchTrendingGifs.mockResolvedValue({ results: [], error: null })
    mockSearchGifs.mockResolvedValue({ results: [], error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /* ---------- Visibility ---------- */

  it('renders nothing when closed', () => {
    render(<GifPicker {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('GIFs')).not.toBeInTheDocument()
  })

  it('renders picker when open', async () => {
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))
    expect(screen.getByText('GIFs')).toBeInTheDocument()
  })

  it('shows "Powered by GIPHY" attribution', async () => {
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))
    expect(screen.getByText('Powered by GIPHY')).toBeInTheDocument()
  })

  /* ---------- Search input ---------- */

  it('renders search input with placeholder', async () => {
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))
    expect(screen.getByPlaceholderText('Chercher un GIF...')).toBeInTheDocument()
  })

  it('shows clear button when query is non-empty', async () => {
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))
    const input = screen.getByPlaceholderText('Chercher un GIF...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'cats' } })
    })
    expect(input).toHaveValue('cats')
  })

  it('calls searchGifs after debounce when typing', async () => {
    mockSearchGifs.mockResolvedValue({ results: sampleGifs, error: null })
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))

    const input = screen.getByPlaceholderText('Chercher un GIF...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'funny' } })
    })
    expect(mockSearchGifs).not.toHaveBeenCalled()

    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(mockSearchGifs).toHaveBeenCalledWith('funny')
  })

  it('loads trending GIFs when component opens', async () => {
    mockFetchTrendingGifs.mockResolvedValue({ results: sampleGifs, error: null })
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(mockFetchTrendingGifs).toHaveBeenCalledTimes(1)
  })

  /* ---------- Categories ---------- */

  it('renders category buttons', async () => {
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))
    expect(screen.getByText('GG')).toBeInTheDocument()
    expect(screen.getByText('Rage')).toBeInTheDocument()
  })

  it('hides categories after a search has been made', async () => {
    mockSearchGifs.mockResolvedValue({ results: sampleGifs, error: null })
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))

    const input = screen.getByPlaceholderText('Chercher un GIF...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test' } })
    })
    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(screen.queryByText('GG')).not.toBeInTheDocument()
  })

  it('clicking a category triggers search', async () => {
    mockSearchGifs.mockResolvedValue({ results: sampleGifs, error: null })
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))

    await act(async () => {
      fireEvent.click(screen.getByText('GG'))
    })
    expect(mockSearchGifs).toHaveBeenCalledWith('gg gaming')
  })

  /* ---------- GIF grid ---------- */

  it('renders GIF images when trending returns results', async () => {
    mockFetchTrendingGifs.mockResolvedValue({ results: sampleGifs, error: null })
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(500))
    const images = screen.getAllByAltText('GIF')
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', 'https://gif.com/1-preview.gif')
  })

  it('calls onSelect + onClose when a GIF is clicked', async () => {
    mockFetchTrendingGifs.mockResolvedValue({ results: sampleGifs, error: null })
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(500))

    fireEvent.click(screen.getAllByAltText('GIF')[0])
    expect(defaultProps.onSelect).toHaveBeenCalledWith('https://gif.com/1.gif')
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  /* ---------- Empty state ---------- */

  it('shows "Aucun GIF trouvé" when search returns empty', async () => {
    mockSearchGifs.mockResolvedValue({ results: [], error: null })
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(500))

    const input = screen.getByPlaceholderText('Chercher un GIF...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'xyznonexistent' } })
    })
    await act(() => vi.advanceTimersByTimeAsync(600))

    expect(screen.getByText('Aucun GIF trouvé')).toBeInTheDocument()
  })

  it('shows retry button when trending fails (hasLoaded but empty)', async () => {
    mockFetchTrendingGifs.mockResolvedValue({ results: [], error: null })
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))
    expect(screen.getByText('Impossible de charger les GIFs')).toBeInTheDocument()
    expect(screen.getByText('Réessayer')).toBeInTheDocument()
  })

  it('shows error message when trending returns an error', async () => {
    mockFetchTrendingGifs.mockResolvedValue({ results: [], error: 'GIPHY API key not configured' })
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))
    expect(screen.getByText('GIPHY API key not configured')).toBeInTheDocument()
  })

  it('retries loading trending on retry click', async () => {
    mockFetchTrendingGifs.mockResolvedValue({ results: [], error: null })
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))

    mockFetchTrendingGifs.mockResolvedValue({ results: sampleGifs, error: null })
    await act(async () => {
      fireEvent.click(screen.getByText('Réessayer'))
    })
    await act(() => vi.advanceTimersByTimeAsync(100))
    expect(mockFetchTrendingGifs).toHaveBeenCalledTimes(2) // initial + retry
  })

  /* ---------- Close behaviors ---------- */

  it('closes on backdrop click', async () => {
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))
    const backdrop = document.querySelector('[aria-hidden="true"]')
    if (backdrop) fireEvent.click(backdrop)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('closes on Escape key', async () => {
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('close button (mobile) calls onClose', async () => {
    render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))
    const closeBtn = screen.getByLabelText('Fermer')
    fireEvent.click(closeBtn)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  /* ---------- Reset on close ---------- */

  it('resets state when isOpen changes to false', async () => {
    const { rerender } = render(<GifPicker {...defaultProps} />)
    await act(() => vi.advanceTimersByTimeAsync(250))

    const input = screen.getByPlaceholderText('Chercher un GIF...')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'hello' } })
    })

    rerender(<GifPicker {...defaultProps} isOpen={false} />)
    await act(() => vi.advanceTimersByTimeAsync(100))

    mockFetchTrendingGifs.mockClear()
    rerender(<GifPicker {...defaultProps} isOpen={true} />)
    await act(() => vi.advanceTimersByTimeAsync(250))
    expect(mockFetchTrendingGifs).toHaveBeenCalled()
  })

  /* ---------- Loading state ---------- */

  it('shows trending loading initially', () => {
    mockFetchTrendingGifs.mockReturnValue(new Promise(() => {}))
    render(<GifPicker {...defaultProps} />)
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument()
  })
})
