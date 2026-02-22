import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { CommandResultList } from '../CommandResultList'

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

const MockIcon = (props: any) => createElement('svg', { ...props, 'data-testid': 'mock-icon' })

describe('CommandResultList', () => {
  const baseProps = {
    selectedIndex: 0,
    setSelectedIndex: vi.fn(),
    onSelect: vi.fn(),
    query: '',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // STRICT: Verifies empty state — no results message with query, HelpCircle icon, correct query text interpolated
  it('renders empty state with query text, icon, and correct structure when no results', () => {
    const { container } = render(
      <CommandResultList
        {...baseProps}
        filteredCommands={[]}
        groupedCommands={{}}
        categoryLabels={{}}
        query="xyz-search"
      />
    )

    // 1. No results message with interpolated query
    expect(screen.getByText(/Aucun résultat pour "xyz-search"/)).toBeInTheDocument()
    // 2. HelpCircle icon rendered
    expect(screen.getByTestId('icon-HelpCircle')).toBeInTheDocument()
    // 3. No category labels visible
    expect(screen.queryByText('Navigation')).not.toBeInTheDocument()
    // 4. No command buttons visible
    expect(container.querySelectorAll('button').length).toBe(0)
    // 5. Container has the scrollable wrapper
    expect(container.firstChild).toBeTruthy()
    // 6. Text-center class on the empty container
    const emptyDiv = container.querySelector('.text-center')
    expect(emptyDiv).not.toBeNull()
  })

  // STRICT: Verifies grouped commands — category labels, command labels, descriptions, selected index highlighting
  it('renders grouped commands with correct labels, descriptions, and selection state', () => {
    const commands = [
      {
        id: 'c1',
        label: 'Accueil',
        description: 'Page principale',
        icon: MockIcon,
        action: vi.fn(),
        category: 'navigation' as const,
      },
      {
        id: 'c2',
        label: 'Squad Alpha',
        icon: MockIcon,
        action: vi.fn(),
        category: 'squads' as const,
      },
    ]

    const { container } = render(
      <CommandResultList
        {...baseProps}
        selectedIndex={0}
        filteredCommands={commands}
        groupedCommands={{
          navigation: [commands[0]],
          squads: [commands[1]],
        }}
        categoryLabels={{ navigation: 'Navigation', squads: 'Squads' }}
      />
    )

    // 1. Category labels rendered
    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Squads')).toBeInTheDocument()
    // 2. Command labels visible
    expect(screen.getByText('Accueil')).toBeInTheDocument()
    expect(screen.getByText('Squad Alpha')).toBeInTheDocument()
    // 3. Description for first command visible
    expect(screen.getByText('Page principale')).toBeInTheDocument()
    // 4. Two command buttons exist
    expect(container.querySelectorAll('button').length).toBe(2)
    // 5. First command is selected (index 0) — has bg-primary-15 class
    const firstBtn = container.querySelectorAll('button')[0]
    expect(firstBtn.className).toContain('bg-primary-15')
    // 6. Second command is not selected
    const secondBtn = container.querySelectorAll('button')[1]
    expect(secondBtn.className).not.toContain('bg-primary-15')
  })

  // STRICT: Verifies user interactions — onSelect called with correct command on click, setSelectedIndex on hover
  it('calls onSelect on click and setSelectedIndex on mouse enter', () => {
    const onSelect = vi.fn()
    const setSelectedIndex = vi.fn()
    const commands = [
      { id: 'c1', label: 'Home', icon: MockIcon, action: vi.fn(), category: 'navigation' as const },
      {
        id: 'c2',
        label: 'Settings',
        description: 'App config',
        icon: MockIcon,
        action: vi.fn(),
        category: 'navigation' as const,
      },
    ]

    render(
      <CommandResultList
        {...baseProps}
        onSelect={onSelect}
        setSelectedIndex={setSelectedIndex}
        filteredCommands={commands}
        groupedCommands={{ navigation: commands }}
        categoryLabels={{ navigation: 'Navigation' }}
      />
    )

    // 1. Click first command
    fireEvent.click(screen.getByText('Home'))
    // 2. onSelect called with the first command object
    expect(onSelect).toHaveBeenCalledWith(commands[0])
    // 3. onSelect called exactly once
    expect(onSelect).toHaveBeenCalledTimes(1)
    // 4. Hover over second command
    fireEvent.mouseEnter(screen.getByText('Settings').closest('button')!)
    // 5. setSelectedIndex called with index 1
    expect(setSelectedIndex).toHaveBeenCalledWith(1)
    // 6. Click second command
    fireEvent.click(screen.getByText('Settings'))
    expect(onSelect).toHaveBeenCalledWith(commands[1])
    expect(onSelect).toHaveBeenCalledTimes(2)
  })

  // STRICT: Verifies ArrowRight icon for commands with children, and selected indicator arrow
  it('shows ArrowRight for commands with children and selected indicator', () => {
    const childCommands = [
      {
        id: 'sub1',
        label: 'Sub Item',
        icon: MockIcon,
        action: vi.fn(),
        category: 'navigation' as const,
      },
    ]
    const commands = [
      {
        id: 'c1',
        label: 'Parent',
        icon: MockIcon,
        action: vi.fn(),
        category: 'navigation' as const,
        children: childCommands,
      },
      { id: 'c2', label: 'Leaf', icon: MockIcon, action: vi.fn(), category: 'navigation' as const },
    ]

    const { container } = render(
      <CommandResultList
        {...baseProps}
        selectedIndex={1}
        filteredCommands={commands}
        groupedCommands={{ navigation: commands }}
        categoryLabels={{ navigation: 'Navigation' }}
      />
    )

    // 1. Parent command has children — ArrowRight icon should be present
    const arrowIcons = screen.getAllByTestId('icon-ArrowRight')
    expect(arrowIcons.length).toBeGreaterThanOrEqual(1)
    // 2. Both commands visible
    expect(screen.getByText('Parent')).toBeInTheDocument()
    expect(screen.getByText('Leaf')).toBeInTheDocument()
    // 3. Second command (index 1) is selected — has bg-primary-15
    const buttons = container.querySelectorAll('button')
    expect(buttons[1].className).toContain('bg-primary-15')
    // 4. First command is NOT selected
    expect(buttons[0].className).not.toContain('bg-primary-15')
    // 5. Selected leaf item (no children) also shows ArrowRight indicator
    // The icon appears for both: parent (has children) and selected leaf (isSelected && !children)
    expect(arrowIcons.length).toBeGreaterThanOrEqual(2)
    // 6. Two buttons total
    expect(buttons.length).toBe(2)
  })
})
