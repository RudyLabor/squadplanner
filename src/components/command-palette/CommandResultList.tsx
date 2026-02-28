import { HelpCircle, ArrowRight } from '../icons'
interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  action: () => void
  category: 'navigation' | 'squads' | 'sessions' | 'actions' | 'players'
  children?: CommandItem[]
  preview?: {
    type: 'squad' | 'session' | 'navigation' | 'action' | 'player'
    data?: Record<string, unknown>
  }
}

interface CommandResultListProps {
  filteredCommands: CommandItem[]
  groupedCommands: Record<string, CommandItem[]>
  categoryLabels: Record<string, string>
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  onSelect: (cmd: CommandItem) => void
  query: string
}

export function CommandResultList({
  filteredCommands,
  groupedCommands,
  categoryLabels,
  selectedIndex,
  setSelectedIndex,
  onSelect,
  query,
}: CommandResultListProps) {
  return (
    <div className="max-h-[400px] overflow-y-auto py-2 flex-1 min-w-0">
      {filteredCommands.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <HelpCircle className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-md text-text-secondary">Aucun résultat pour "{query}"</p>
        </div>
      ) : (
        Object.entries(groupedCommands).map(([category, commands]) => (
          <div key={category} className="mb-2">
            <div className="px-4 py-1.5">
              <span className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">
                {categoryLabels[category]}
              </span>
            </div>
            {commands.map((cmd) => {
              const globalIndex = filteredCommands.findIndex((c) => c.id === cmd.id)
              const isSelected = globalIndex === selectedIndex

              return (
                <button
                  key={cmd.id}
                  onClick={() => onSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    isSelected ? 'bg-primary-15' : 'hover:bg-surface-card'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-primary-bg' : 'bg-border-subtle'
                    }`}
                  >
                    <cmd.icon
                      className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-text-secondary'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-md truncate ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}
                    >
                      {cmd.label}
                    </p>
                    {cmd.description && (
                      <p className="text-sm text-text-tertiary truncate">{cmd.description}</p>
                    )}
                  </div>
                  {cmd.children && cmd.children.length > 0 && (
                    <ArrowRight className="w-3.5 h-3.5 text-text-tertiary" />
                  )}
                  {isSelected && !cmd.children && <ArrowRight className="w-4 h-4 text-primary" />}
                </button>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
