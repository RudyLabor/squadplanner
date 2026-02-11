import { m, AnimatePresence } from 'framer-motion'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  action: () => void
  category: 'navigation' | 'squads' | 'sessions' | 'actions'
  children?: CommandItem[]
  preview?: { type: 'squad' | 'session' | 'navigation' | 'action'; data?: Record<string, unknown> }
}

interface CommandPreviewPanelProps {
  command: CommandItem | undefined
}

export function CommandPreviewPanel({ command }: CommandPreviewPanelProps) {
  const preview = command?.preview
  if (!preview || !command) return null

  return (
    <div className="hidden lg:block w-64 border-l border-border-default p-4 max-h-[400px] overflow-y-auto">
      <AnimatePresence mode="wait">
        <m.div
          key={command.id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <command.icon className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-text-primary truncate">{command.label}</span>
          </div>
          {preview.data && typeof (preview.data as { game?: string }).game === 'string' && (
            <div className="text-xs text-text-tertiary mb-2">
              Jeu : <span className="text-text-secondary">{(preview.data as { game: string }).game}</span>
            </div>
          )}
          {command.description && (
            <p className="text-xs text-text-quaternary">{command.description}</p>
          )}
          {command.children && command.children.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-default">
              <div className="text-xs text-text-tertiary uppercase tracking-wider mb-2">Actions</div>
              {command.children.map(child => (
                <div key={child.id} className="text-xs text-text-tertiary flex items-center gap-1.5 mb-1">
                  <child.icon className="w-3 h-3" />
                  {child.label}
                </div>
              ))}
            </div>
          )}
        </m.div>
      </AnimatePresence>
    </div>
  )
}
