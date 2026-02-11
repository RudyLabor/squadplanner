import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, Tab, TabsContent } from '../Tabs'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    useMotionValue: () => ({ get: () => 0, set: vi.fn(), onChange: vi.fn() }),
    useTransform: () => ({ get: () => 1 }),
    animate: vi.fn(),
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const { layoutId, transition, initial, animate: a, exit, drag, dragConstraints, dragElastic, onDragEnd, style: mStyle, ...rest } = props
        return <div style={mStyle} {...rest}>{children}</div>
      },
    },
    m: {
      ...actual.m,
      div: ({ children, ...props }: any) => {
        const { layoutId, transition, initial, animate: a, exit, drag, dragConstraints, dragElastic, onDragEnd, style: mStyle, ...rest } = props
        return <div style={mStyle} {...rest}>{children}</div>
      },
    },
  }
})

vi.mock('../../../utils/haptics', () => ({
  haptic: { selection: vi.fn() },
  getHapticEnabled: () => false,
}))

describe('Tabs', () => {
  it('renders tab list with role=tablist', () => {
    render(
      <Tabs value="tab1" onChange={() => {}}>
        <TabsList>
          <Tab value="tab1">Tab 1</Tab>
          <Tab value="tab2">Tab 2</Tab>
        </TabsList>
      </Tabs>
    )
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('renders tabs with role=tab', () => {
    render(
      <Tabs value="tab1" onChange={() => {}}>
        <TabsList>
          <Tab value="tab1">Tab 1</Tab>
          <Tab value="tab2">Tab 2</Tab>
        </TabsList>
      </Tabs>
    )
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })

  it('marks active tab as selected', () => {
    render(
      <Tabs value="tab2" onChange={() => {}}>
        <TabsList>
          <Tab value="tab1">Tab 1</Tab>
          <Tab value="tab2">Tab 2</Tab>
        </TabsList>
      </Tabs>
    )
    expect(screen.getByText('Tab 1').closest('[role="tab"]')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByText('Tab 2').closest('[role="tab"]')).toHaveAttribute('aria-selected', 'true')
  })

  it('calls onChange on tab click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Tabs value="tab1" onChange={onChange}>
        <TabsList>
          <Tab value="tab1">Tab 1</Tab>
          <Tab value="tab2">Tab 2</Tab>
        </TabsList>
      </Tabs>
    )
    await user.click(screen.getByText('Tab 2'))
    expect(onChange).toHaveBeenCalledWith('tab2')
  })

  it('does not call onChange for disabled tab', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Tabs value="tab1" onChange={onChange}>
        <TabsList>
          <Tab value="tab1">Tab 1</Tab>
          <Tab value="tab2" disabled>Tab 2</Tab>
        </TabsList>
      </Tabs>
    )
    await user.click(screen.getByText('Tab 2'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders tab panel', () => {
    render(
      <Tabs value="tab1" onChange={() => {}}>
        <TabsList>
          <Tab value="tab1">Tab 1</Tab>
        </TabsList>
        <TabsContent value="tab1">Panel 1 content</TabsContent>
      </Tabs>
    )
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
    expect(screen.getByText('Panel 1 content')).toBeInTheDocument()
  })

  it('hides inactive tab panel', () => {
    render(
      <Tabs value="tab1" onChange={() => {}}>
        <TabsList>
          <Tab value="tab1">Tab 1</Tab>
          <Tab value="tab2">Tab 2</Tab>
        </TabsList>
        <TabsContent value="tab1">Panel 1</TabsContent>
        <TabsContent value="tab2">Panel 2</TabsContent>
      </Tabs>
    )
    expect(screen.getByText('Panel 1')).toBeInTheDocument()
    expect(screen.queryByText('Panel 2')).not.toBeInTheDocument()
  })

  it('sets correct tabIndex on tabs', () => {
    render(
      <Tabs value="tab2" onChange={() => {}}>
        <TabsList>
          <Tab value="tab1">Tab 1</Tab>
          <Tab value="tab2">Tab 2</Tab>
        </TabsList>
      </Tabs>
    )
    const tabs = screen.getAllByRole('tab')
    expect(tabs[0]).toHaveAttribute('tabindex', '-1')
    expect(tabs[1]).toHaveAttribute('tabindex', '0')
  })
})
