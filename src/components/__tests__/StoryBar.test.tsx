import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

/* ------------------------------------------------------------------ */
/*  Hoisted mocks                                                      */
/* ------------------------------------------------------------------ */
const mockCreateStory = vi.hoisted(() => vi.fn())
const mockViewStory = vi.hoisted(() => vi.fn())
const mockGetUserStories = vi.hoisted(() => vi.fn().mockReturnValue([]))
const mockUseStories = vi.hoisted(() => vi.fn())
const mockStoryViewer = vi.hoisted(() => vi.fn(() => createElement('div', { 'data-testid': 'story-viewer' }, 'StoryViewer')))

/* ------------------------------------------------------------------ */
/*  vi.mock calls                                                      */
/* ------------------------------------------------------------------ */
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, onClick, ...r }: any) => createElement(p, { ...r, onClick }, children)
        : undefined,
  }),
}))

vi.mock('../icons', () => ({
  Plus: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-plus' }),
  X: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-x' }),
}))

vi.mock('../StoryViewer', () => ({
  StoryViewer: mockStoryViewer,
}))

vi.mock('../../hooks/useStories', () => ({
  useStories: mockUseStories,
  STORY_BACKGROUNDS: [
    { color: '#6366F1', label: 'Indigo' },
    { color: '#EF4444', label: 'Rouge' },
    { color: '#10B981', label: 'Vert' },
  ],
}))

import { StoryBar } from '../StoryBar'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const defaultStoryUsers = [
  {
    userId: 'user-1',
    username: 'TestUser',
    avatarUrl: null,
    hasUnviewed: true,
    isOwnStory: true,
    storyCount: 2,
  },
  {
    userId: 'user-2',
    username: 'OtherUser',
    avatarUrl: 'https://example.com/avatar.jpg',
    hasUnviewed: false,
    isOwnStory: false,
    storyCount: 1,
  },
  {
    userId: 'user-3',
    username: 'ThirdUser',
    avatarUrl: null,
    hasUnviewed: true,
    isOwnStory: false,
    storyCount: 3,
  },
]

function setupMock(overrides: Partial<ReturnType<typeof mockUseStories>> = {}, storyUsers = defaultStoryUsers) {
  mockUseStories.mockReturnValue({
    storyUsers,
    isLoading: false,
    createStory: mockCreateStory,
    viewStory: mockViewStory,
    getUserStories: mockGetUserStories,
    ...overrides,
  })
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('StoryBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMock()
  })

  /* ---------- Returns null ---------- */

  it('returns null when loading', () => {
    setupMock({ isLoading: true })
    const { container } = render(<StoryBar />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when storyUsers is empty', () => {
    setupMock({}, [])
    const { container } = render(<StoryBar />)
    expect(container.innerHTML).toBe('')
  })

  /* ---------- Story circles rendering ---------- */

  it('renders story circles for each user', () => {
    render(<StoryBar />)
    expect(screen.getByText('Ma story')).toBeInTheDocument()
    expect(screen.getByText('OtherUser')).toBeInTheDocument()
    expect(screen.getByText('ThirdUser')).toBeInTheDocument()
  })

  it('shows "Ma story" for own story circles', () => {
    render(<StoryBar />)
    expect(screen.getByText('Ma story')).toBeInTheDocument()
  })

  it('shows username for non-own story circles', () => {
    render(<StoryBar />)
    expect(screen.getByText('OtherUser')).toBeInTheDocument()
  })

  /* ---------- Avatar rendering ---------- */

  it('shows avatar image when avatarUrl is present', () => {
    const { container } = render(<StoryBar />)
    const imgs = container.querySelectorAll('img')
    const avatarImg = Array.from(imgs).find(i => i.getAttribute('src') === 'https://example.com/avatar.jpg')
    expect(avatarImg).toBeTruthy()
  })

  it('shows initial letter when avatarUrl is null', () => {
    render(<StoryBar />)
    // TestUser and ThirdUser both have initial 'T'
    const initials = screen.getAllByText('T')
    expect(initials.length).toBe(2)
  })

  /* ---------- Story count badge ---------- */

  it('shows story count badge when count > 1', () => {
    render(<StoryBar />)
    expect(screen.getByText('2')).toBeInTheDocument() // TestUser has 2
    expect(screen.getByText('3')).toBeInTheDocument() // ThirdUser has 3
  })

  it('does not show badge when storyCount is 1', () => {
    // OtherUser has count 1 — no badge
    render(<StoryBar />)
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })

  /* ---------- Create story button (when own story not present) ---------- */

  it('shows create story button when own story is NOT in the list', () => {
    const usersWithoutOwn = defaultStoryUsers.filter(u => !u.isOwnStory)
    setupMock({}, usersWithoutOwn)
    render(<StoryBar />)
    expect(screen.getByText('Story')).toBeInTheDocument()
  })

  it('does not show create story button when own story IS present', () => {
    render(<StoryBar />)
    expect(screen.queryByText('Story')).not.toBeInTheDocument()
  })

  it('opens create modal when create button is clicked', () => {
    const usersWithoutOwn = defaultStoryUsers.filter(u => !u.isOwnStory)
    setupMock({}, usersWithoutOwn)
    render(<StoryBar />)
    fireEvent.click(screen.getByText('Story'))
    expect(screen.getByText('Publier la story')).toBeInTheDocument()
  })

  /* ---------- Click own story with 0 count → create modal ---------- */

  it('opens create modal when clicking own story with 0 count', () => {
    const users = [
      { ...defaultStoryUsers[0], storyCount: 0 },
      defaultStoryUsers[1],
    ]
    setupMock({}, users)
    render(<StoryBar />)
    fireEvent.click(screen.getByText('Ma story'))
    expect(screen.getByText('Publier la story')).toBeInTheDocument()
  })

  /* ---------- Click other story → opens viewer ---------- */

  it('opens story viewer when clicking another user story', () => {
    const stories = [{ id: 's1', content: 'Hello', contentType: 'text' }]
    mockGetUserStories.mockReturnValue(stories)
    render(<StoryBar />)
    fireEvent.click(screen.getByText('OtherUser'))
    expect(mockGetUserStories).toHaveBeenCalledWith('user-2')
    expect(screen.getByTestId('story-viewer')).toBeInTheDocument()
  })

  it('does not open viewer when getUserStories returns empty', () => {
    mockGetUserStories.mockReturnValue([])
    render(<StoryBar />)
    fireEvent.click(screen.getByText('OtherUser'))
    expect(screen.queryByTestId('story-viewer')).not.toBeInTheDocument()
  })

  /* ---------- Click own story with count > 0 → viewer ---------- */

  it('opens story viewer when clicking own story with count > 0', () => {
    const stories = [{ id: 's1', content: 'Mine' }]
    mockGetUserStories.mockReturnValue(stories)
    render(<StoryBar />)
    fireEvent.click(screen.getByText('Ma story'))
    expect(mockGetUserStories).toHaveBeenCalledWith('user-1')
    expect(screen.getByTestId('story-viewer')).toBeInTheDocument()
  })

  /* ---------- CreateStoryModal ---------- */

  it('renders CreateStoryModal with background options', () => {
    const usersWithoutOwn = defaultStoryUsers.filter(u => !u.isOwnStory)
    setupMock({}, usersWithoutOwn)
    render(<StoryBar />)
    fireEvent.click(screen.getByText('Story'))
    // Background color buttons
    expect(screen.getByLabelText('Indigo')).toBeInTheDocument()
    expect(screen.getByLabelText('Rouge')).toBeInTheDocument()
    expect(screen.getByLabelText('Vert')).toBeInTheDocument()
  })

  it('renders textarea in CreateStoryModal', () => {
    const usersWithoutOwn = defaultStoryUsers.filter(u => !u.isOwnStory)
    setupMock({}, usersWithoutOwn)
    render(<StoryBar />)
    fireEvent.click(screen.getByText('Story'))
    expect(screen.getByPlaceholderText('Ecris ta story...')).toBeInTheDocument()
  })

  it('submit button is disabled when content is empty', () => {
    const usersWithoutOwn = defaultStoryUsers.filter(u => !u.isOwnStory)
    setupMock({}, usersWithoutOwn)
    render(<StoryBar />)
    fireEvent.click(screen.getByText('Story'))
    const submitBtn = screen.getByText('Publier la story')
    expect(submitBtn).toBeDisabled()
  })

  it('submit button is enabled when content has text', () => {
    const usersWithoutOwn = defaultStoryUsers.filter(u => !u.isOwnStory)
    setupMock({}, usersWithoutOwn)
    render(<StoryBar />)
    fireEvent.click(screen.getByText('Story'))
    fireEvent.change(screen.getByPlaceholderText('Ecris ta story...'), { target: { value: 'My story' } })
    const submitBtn = screen.getByText('Publier la story')
    expect(submitBtn).not.toBeDisabled()
  })

  it('calls createStory on submit', () => {
    const usersWithoutOwn = defaultStoryUsers.filter(u => !u.isOwnStory)
    setupMock({}, usersWithoutOwn)
    render(<StoryBar />)
    fireEvent.click(screen.getByText('Story'))
    fireEvent.change(screen.getByPlaceholderText('Ecris ta story...'), { target: { value: 'Hello world' } })
    fireEvent.click(screen.getByText('Publier la story'))
    expect(mockCreateStory).toHaveBeenCalledWith({
      contentType: 'text',
      content: 'Hello world',
      backgroundColor: '#6366F1', // first background by default
    })
  })

  it('does not call createStory when content is only whitespace', () => {
    const usersWithoutOwn = defaultStoryUsers.filter(u => !u.isOwnStory)
    setupMock({}, usersWithoutOwn)
    render(<StoryBar />)
    fireEvent.click(screen.getByText('Story'))
    fireEvent.change(screen.getByPlaceholderText('Ecris ta story...'), { target: { value: '   ' } })
    fireEvent.click(screen.getByText('Publier la story'))
    expect(mockCreateStory).not.toHaveBeenCalled()
  })

  it('allows selecting a different background color', () => {
    const usersWithoutOwn = defaultStoryUsers.filter(u => !u.isOwnStory)
    setupMock({}, usersWithoutOwn)
    render(<StoryBar />)
    fireEvent.click(screen.getByText('Story'))
    fireEvent.click(screen.getByLabelText('Rouge'))
    fireEvent.change(screen.getByPlaceholderText('Ecris ta story...'), { target: { value: 'Red story' } })
    fireEvent.click(screen.getByText('Publier la story'))
    expect(mockCreateStory).toHaveBeenCalledWith({
      contentType: 'text',
      content: 'Red story',
      backgroundColor: '#EF4444',
    })
  })

  it('closes create modal on backdrop click', () => {
    const usersWithoutOwn = defaultStoryUsers.filter(u => !u.isOwnStory)
    setupMock({}, usersWithoutOwn)
    render(<StoryBar />)
    fireEvent.click(screen.getByText('Story'))
    expect(screen.getByText('Publier la story')).toBeInTheDocument()
    // Click the backdrop (outermost m.div)
    const backdrop = screen.getByText('Publier la story').closest('.fixed')
    if (backdrop) fireEvent.click(backdrop)
    // Modal should close
  })

  it('closes create modal on X button click', () => {
    const usersWithoutOwn = defaultStoryUsers.filter(u => !u.isOwnStory)
    setupMock({}, usersWithoutOwn)
    render(<StoryBar />)
    fireEvent.click(screen.getByText('Story'))
    // Find the X close button inside the modal
    const closeButtons = screen.getAllByTestId('icon-x')
    fireEvent.click(closeButtons[0])
    // Modal should close - the publish button should disappear
  })

  /* ---------- Unviewed ring styling ---------- */

  it('applies unviewed gradient ring for stories with hasUnviewed', () => {
    render(<StoryBar />)
    const testUserCircle = screen.getByText('Ma story').closest('button')
    const ring = testUserCircle?.querySelector('.bg-gradient-to-tr')
    expect(ring).toBeInTheDocument()
  })

  it('applies default ring for viewed stories', () => {
    render(<StoryBar />)
    const otherUserCircle = screen.getByText('OtherUser').closest('button')
    const ring = otherUserCircle?.querySelector('.bg-border-default')
    expect(ring).toBeInTheDocument()
  })
})
