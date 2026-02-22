import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select, type SelectOption } from '../Select'
import { createElement, forwardRef } from 'react'

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

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

vi.mock('../../../utils/haptics', () => ({
  haptic: { selection: vi.fn() },
}))

const options: SelectOption[] = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular', disabled: true },
]

const optionsWithDescription: SelectOption[] = [
  { value: 'react', label: 'React', description: 'A JavaScript library' },
  { value: 'vue', label: 'Vue', description: 'Progressive framework' },
]

const optionsWithGroups: SelectOption[] = [
  { value: 'react', label: 'React', group: 'JavaScript' },
  { value: 'vue', label: 'Vue', group: 'JavaScript' },
  { value: 'django', label: 'Django', group: 'Python' },
  { value: 'flask', label: 'Flask', group: 'Python' },
]

const optionsWithIcons: SelectOption[] = [
  {
    value: 'react',
    label: 'React',
    icon: createElement('span', { 'data-testid': 'icon-react' }, 'R'),
  },
  { value: 'vue', label: 'Vue', icon: createElement('span', { 'data-testid': 'icon-vue' }, 'V') },
]

describe('Select', () => {
  // =========================================================================
  // Basic rendering
  // =========================================================================
  describe('basic rendering', () => {
    it('renders with role=combobox', () => {
      render(<Select options={options} onChange={() => {}} />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('shows default placeholder "Select..." when no value', () => {
      render(<Select options={options} onChange={() => {}} />)
      expect(screen.getByText('Select...')).toBeInTheDocument()
    })

    it('shows custom placeholder', () => {
      render(<Select options={options} onChange={() => {}} placeholder="Choose framework" />)
      expect(screen.getByText('Choose framework')).toBeInTheDocument()
    })

    it('shows selected value label for single select', () => {
      render(<Select options={options} value="react" onChange={() => {}} />)
      expect(screen.getByText('React')).toBeInTheDocument()
    })

    it('does not show placeholder when value is selected', () => {
      render(<Select options={options} value="react" onChange={() => {}} placeholder="Choose..." />)
      expect(screen.queryByText('Choose...')).not.toBeInTheDocument()
    })

    it('renders label when provided', () => {
      render(<Select options={options} onChange={() => {}} label="Framework" />)
      expect(screen.getByText('Framework')).toBeInTheDocument()
    })

    it('does not render label when not provided', () => {
      render(<Select options={options} onChange={() => {}} />)
      expect(screen.queryByText('Framework')).not.toBeInTheDocument()
    })
  })

  // =========================================================================
  // Error state
  // =========================================================================
  describe('error state', () => {
    it('shows error message text', () => {
      render(<Select options={options} onChange={() => {}} error="Required field" />)
      expect(screen.getByText('Required field')).toBeInTheDocument()
    })

    it('sets aria-invalid=true when error', () => {
      render(<Select options={options} onChange={() => {}} error="Required" />)
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
    })

    it('sets aria-invalid=false when no error', () => {
      render(<Select options={options} onChange={() => {}} />)
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'false')
    })
  })

  // =========================================================================
  // Disabled state
  // =========================================================================
  describe('disabled state', () => {
    it('sets aria-disabled=true', () => {
      render(<Select options={options} onChange={() => {}} disabled />)
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-disabled', 'true')
    })

    it('sets tabIndex=-1 when disabled', () => {
      render(<Select options={options} onChange={() => {}} disabled />)
      expect(screen.getByRole('combobox')).toHaveAttribute('tabindex', '-1')
    })

    it('sets tabIndex=0 when not disabled', () => {
      render(<Select options={options} onChange={() => {}} />)
      expect(screen.getByRole('combobox')).toHaveAttribute('tabindex', '0')
    })

    it('does not open dropdown when disabled and clicked', async () => {
      const user = userEvent.setup()
      render(<Select options={options} onChange={() => {}} disabled />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })

  // =========================================================================
  // Opening / closing dropdown
  // =========================================================================
  describe('dropdown open/close', () => {
    it('opens dropdown on click', async () => {
      const user = userEvent.setup()
      render(<Select options={options} onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('closes dropdown on second click (toggle)', async () => {
      const user = userEvent.setup()
      render(<Select options={options} onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      await user.click(screen.getByRole('combobox'))
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('sets aria-expanded=true when open', async () => {
      const user = userEvent.setup()
      render(<Select options={options} onChange={() => {}} />)
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false')
      await user.click(screen.getByRole('combobox'))
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true')
    })

    it('renders all options in listbox', async () => {
      const user = userEvent.setup()
      render(<Select options={options} onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.getAllByRole('option')).toHaveLength(3)
    })
  })

  // =========================================================================
  // Single select behavior
  // =========================================================================
  describe('single select', () => {
    it('calls onChange with selected value', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Select options={options} onChange={onChange} />)
      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByText('React'))
      expect(onChange).toHaveBeenCalledWith('react')
    })

    it('closes dropdown after selection in single mode', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Select options={options} onChange={onChange} />)
      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByText('Vue'))
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('does not allow selecting disabled options', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Select options={options} onChange={onChange} />)
      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByText('Angular'))
      expect(onChange).not.toHaveBeenCalled()
    })

    it('marks selected option with aria-selected', async () => {
      const user = userEvent.setup()
      render(<Select options={options} value="react" onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      const reactOption = screen
        .getAllByRole('option')
        .find((o) => o.textContent?.includes('React'))
      expect(reactOption).toHaveAttribute('aria-selected', 'true')
    })

    it('marks disabled option with aria-disabled', async () => {
      const user = userEvent.setup()
      render(<Select options={options} onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      const angularOption = screen
        .getAllByRole('option')
        .find((o) => o.textContent?.includes('Angular'))
      expect(angularOption).toHaveAttribute('aria-disabled', 'true')
    })
  })

  // =========================================================================
  // Multiple select behavior
  // =========================================================================
  describe('multiple select', () => {
    it('shows placeholder when no value selected', () => {
      render(<Select options={options} multiple onChange={() => {}} placeholder="Pick items" />)
      expect(screen.getByText('Pick items')).toBeInTheDocument()
    })

    it('renders tags for selected values', () => {
      render(<Select options={options} multiple value={['react', 'vue']} onChange={() => {}} />)
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('Vue')).toBeInTheDocument()
    })

    it('calls onChange with added value in multi mode', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Select options={options} multiple value={['react']} onChange={onChange} />)
      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByText('Vue'))
      expect(onChange).toHaveBeenCalledWith(['react', 'vue'])
    })

    it('calls onChange to remove already selected value (toggle)', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Select options={options} multiple value={['react', 'vue']} onChange={onChange} />)
      await user.click(screen.getByRole('combobox'))
      // Click on the option element (not the tag) - find by role
      const reactOption = screen
        .getAllByRole('option')
        .find((o) => o.textContent?.includes('React'))!
      await user.click(reactOption)
      expect(onChange).toHaveBeenCalledWith(['vue'])
    })

    it('does not close dropdown after selection in multi mode', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Select options={options} multiple value={[]} onChange={onChange} />)
      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByText('React'))
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('removes tag when X button on tag is clicked', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Select options={options} multiple value={['react', 'vue']} onChange={onChange} />)
      const removeReactBtn = screen.getByLabelText('Remove React')
      await user.click(removeReactBtn)
      expect(onChange).toHaveBeenCalledWith(['vue'])
    })

    it('sets aria-multiselectable on listbox in multi mode', async () => {
      const user = userEvent.setup()
      render(<Select options={options} multiple onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true')
    })

    it('shows value string as tag text when option not found', () => {
      render(<Select options={options} multiple value={['unknown-value']} onChange={() => {}} />)
      expect(screen.getByText('unknown-value')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Clearable
  // =========================================================================
  describe('clearable', () => {
    it('does not show clear button when no value', async () => {
      render(<Select options={options} clearable onChange={() => {}} />)
      expect(screen.queryByLabelText('Clear')).not.toBeInTheDocument()
    })

    it('shows clear button when value selected and clearable', async () => {
      render(<Select options={options} clearable value="react" onChange={() => {}} />)
      expect(screen.getByLabelText('Clear')).toBeInTheDocument()
    })

    it('calls onChange with empty string for single select on clear', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Select options={options} clearable value="react" onChange={onChange} />)
      await user.click(screen.getByLabelText('Clear'))
      expect(onChange).toHaveBeenCalledWith('')
    })

    it('calls onChange with empty array for multi select on clear', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Select options={options} multiple clearable value={['react']} onChange={onChange} />)
      await user.click(screen.getByLabelText('Clear'))
      expect(onChange).toHaveBeenCalledWith([])
    })

    it('does not show clear button when disabled', () => {
      render(<Select options={options} clearable value="react" onChange={() => {}} disabled />)
      expect(screen.queryByLabelText('Clear')).not.toBeInTheDocument()
    })
  })

  // =========================================================================
  // Loading state
  // =========================================================================
  describe('loading', () => {
    it('shows loading indicator when open and loading', async () => {
      const user = userEvent.setup()
      render(<Select options={options} loading onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('does not show options when loading', async () => {
      const user = userEvent.setup()
      render(<Select options={options} loading onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.queryAllByRole('option')).toHaveLength(0)
    })
  })

  // =========================================================================
  // Empty message
  // =========================================================================
  describe('empty message', () => {
    it('shows default empty message when no options', async () => {
      const user = userEvent.setup()
      render(<Select options={[]} onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })

    it('shows custom empty message', async () => {
      const user = userEvent.setup()
      render(<Select options={[]} onChange={() => {}} emptyMessage="Nothing here" />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.getByText('Nothing here')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Searchable
  // =========================================================================
  describe('searchable', () => {
    it('renders search input when searchable and open', async () => {
      const user = userEvent.setup()
      render(<Select options={options} searchable onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.getByLabelText('Search options')).toBeInTheDocument()
    })

    it('does not render search input when not searchable', async () => {
      const user = userEvent.setup()
      render(<Select options={options} onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.queryByLabelText('Search options')).not.toBeInTheDocument()
    })

    it('filters options by label text', async () => {
      const user = userEvent.setup()
      render(<Select options={options} searchable onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      await user.type(screen.getByLabelText('Search options'), 'rea')
      const optionEls = screen.getAllByRole('option')
      expect(optionEls).toHaveLength(1)
      expect(optionEls[0]).toHaveTextContent('React')
    })

    it('filters options by description text', async () => {
      const user = userEvent.setup()
      render(<Select options={optionsWithDescription} searchable onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      await user.type(screen.getByLabelText('Search options'), 'progressive')
      const optionEls = screen.getAllByRole('option')
      expect(optionEls).toHaveLength(1)
      expect(optionEls[0]).toHaveTextContent('Vue')
    })

    it('shows empty message when search matches nothing', async () => {
      const user = userEvent.setup()
      render(<Select options={options} searchable onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      await user.type(screen.getByLabelText('Search options'), 'nonexistent')
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Grouped options
  // =========================================================================
  describe('grouped options', () => {
    it('renders group headers', async () => {
      const user = userEvent.setup()
      render(<Select options={optionsWithGroups} onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.getByText('JavaScript')).toBeInTheDocument()
      expect(screen.getByText('Python')).toBeInTheDocument()
    })

    it('renders options under their groups', async () => {
      const user = userEvent.setup()
      render(<Select options={optionsWithGroups} onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.getAllByRole('option')).toHaveLength(4)
    })
  })

  // =========================================================================
  // Options with icons
  // =========================================================================
  describe('option icons', () => {
    it('renders icon element for options that have icons', async () => {
      const user = userEvent.setup()
      render(<Select options={optionsWithIcons} onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.getByTestId('icon-react')).toBeInTheDocument()
      expect(screen.getByTestId('icon-vue')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Options with descriptions
  // =========================================================================
  describe('option descriptions', () => {
    it('renders description for options that have one', async () => {
      const user = userEvent.setup()
      render(<Select options={optionsWithDescription} onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.getByText('A JavaScript library')).toBeInTheDocument()
      expect(screen.getByText('Progressive framework')).toBeInTheDocument()
    })
  })

  // =========================================================================
  // Keyboard navigation
  // =========================================================================
  describe('keyboard navigation', () => {
    it('opens dropdown on Enter key', async () => {
      const user = userEvent.setup()
      render(<Select options={options} onChange={() => {}} />)
      screen.getByRole('combobox').focus()
      await user.keyboard('{Enter}')
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('opens dropdown on Space key', async () => {
      const user = userEvent.setup()
      render(<Select options={options} onChange={() => {}} />)
      screen.getByRole('combobox').focus()
      await user.keyboard(' ')
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('opens dropdown on ArrowDown key', async () => {
      const user = userEvent.setup()
      render(<Select options={options} onChange={() => {}} />)
      screen.getByRole('combobox').focus()
      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup()
      render(<Select options={options} onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('selects option with Enter key after navigating with ArrowDown', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Select options={options} onChange={onChange} />)
      await user.click(screen.getByRole('combobox'))
      // ArrowDown to select first enabled option (React at index 0)
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      expect(onChange).toHaveBeenCalledWith('react')
    })

    it('wraps around with ArrowDown at last item', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      // Use options with only 2 enabled: react, vue (angular is disabled)
      render(<Select options={options} onChange={onChange} />)
      await user.click(screen.getByRole('combobox'))
      // Go past last enabled item
      await user.keyboard('{ArrowDown}') // index 0 (react)
      await user.keyboard('{ArrowDown}') // index 1 (vue)
      await user.keyboard('{ArrowDown}') // wraps to index 0 (react)
      await user.keyboard('{Enter}')
      expect(onChange).toHaveBeenCalledWith('react')
    })

    it('wraps around with ArrowUp from first item', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<Select options={options} onChange={onChange} />)
      await user.click(screen.getByRole('combobox'))
      await user.keyboard('{ArrowDown}') // index 0 (react)
      await user.keyboard('{ArrowUp}') // wraps to last (vue)
      await user.keyboard('{Enter}')
      expect(onChange).toHaveBeenCalledWith('vue')
    })

    it('removes last selected tag with Backspace in multi mode', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <Select
          options={options}
          multiple
          value={['react', 'vue']}
          onChange={onChange}
          searchable
        />
      )
      await user.click(screen.getByRole('combobox'))
      await user.keyboard('{Backspace}')
      expect(onChange).toHaveBeenCalledWith(['react'])
    })
  })

  // =========================================================================
  // Accessibility attributes
  // =========================================================================
  describe('accessibility', () => {
    it('sets aria-haspopup=listbox', () => {
      render(<Select options={options} onChange={() => {}} />)
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-haspopup', 'listbox')
    })

    it('sets aria-controls to listbox id when open', async () => {
      const user = userEvent.setup()
      render(<Select options={options} onChange={() => {}} />)
      await user.click(screen.getByRole('combobox'))
      const listbox = screen.getByRole('listbox')
      const combobox = screen.getByRole('combobox')
      expect(combobox.getAttribute('aria-controls')).toBe(listbox.id)
    })

    it('does not set aria-controls when closed', () => {
      render(<Select options={options} onChange={() => {}} />)
      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-controls')
    })

    it('sets aria-labelledby when label provided', () => {
      render(<Select options={options} onChange={() => {}} label="Framework" />)
      const labelEl = screen.getByText('Framework')
      const combobox = screen.getByRole('combobox')
      expect(combobox.getAttribute('aria-labelledby')).toBe(labelEl.id)
    })

    it('does not set aria-labelledby when no label', () => {
      render(<Select options={options} onChange={() => {}} />)
      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-labelledby')
    })
  })
})
