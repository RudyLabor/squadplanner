import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { CommandResultList } from '../CommandResultList'

vi.mock('../../icons', () =>
  new Proxy({}, {
    get: (_t, name) =>
      typeof name === 'string'
        ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
        : undefined,
  })
)

const MockIcon = (props: any) => createElement('svg', { ...props })

describe('CommandResultList', () => {
  const baseProps = {
    selectedIndex: 0,
    setSelectedIndex: vi.fn(),
    onSelect: vi.fn(),
    query: '',
  }

  it('renders empty state when no results and query exists', () => {
    render(
      <CommandResultList
        {...baseProps}
        filteredCommands={[]}
        groupedCommands={{}}
        categoryLabels={{}}
        query="xyz"
      />
    )
    expect(screen.getByText(/Aucun résultat pour "xyz"/)).toBeDefined()
  })

  it('renders grouped commands', () => {
    const commands = [
      { id: 'c1', label: 'Home', icon: MockIcon, action: vi.fn(), category: 'navigation' as const },
      { id: 'c2', label: 'Squad A', icon: MockIcon, action: vi.fn(), category: 'squads' as const },
    ]
    render(
      <CommandResultList
        {...baseProps}
        filteredCommands={commands}
        groupedCommands={{
          navigation: [commands[0]],
          squads: [commands[1]],
        }}
        categoryLabels={{ navigation: 'Navigation', squads: 'Squads' }}
      />
    )
    expect(screen.getByText('Navigation')).toBeDefined()
    expect(screen.getByText('Squads')).toBeDefined()
    expect(screen.getByText('Home')).toBeDefined()
    expect(screen.getByText('Squad A')).toBeDefined()
  })

  it('calls onSelect when a command is clicked', () => {
    const onSelect = vi.fn()
    const commands = [
      { id: 'c1', label: 'Home', icon: MockIcon, action: vi.fn(), category: 'navigation' as const },
    ]
    render(
      <CommandResultList
        {...baseProps}
        onSelect={onSelect}
        filteredCommands={commands}
        groupedCommands={{ navigation: commands }}
        categoryLabels={{ navigation: 'Navigation' }}
      />
    )
    fireEvent.click(screen.getByText('Home'))
    expect(onSelect).toHaveBeenCalledWith(commands[0])
  })

  it('renders description when present', () => {
    const commands = [
      { id: 'c1', label: 'Home', description: 'Main page', icon: MockIcon, action: vi.fn(), category: 'navigation' as const },
    ]
    render(
      <CommandResultList
        {...baseProps}
        filteredCommands={commands}
        groupedCommands={{ navigation: commands }}
        categoryLabels={{ navigation: 'Navigation' }}
      />
    )
    expect(screen.getByText('Main page')).toBeDefined()
  })
})
