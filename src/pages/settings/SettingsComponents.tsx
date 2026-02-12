import { m } from 'framer-motion'
import { Moon, Sun, Monitor } from '../../components/icons'
import { SegmentedControl } from '../../components/ui'
import { useThemeStore, type ThemeMode } from '../../hooks/useTheme'

export function Toggle({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-success' : 'bg-border-hover'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <m.div
        className="absolute top-1 w-4 h-4 bg-bg-base rounded-full shadow-sm"
        animate={{ left: enabled ? 24 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
      <span className="sr-only">{enabled ? 'Activ\u00e9' : 'D\u00e9sactiv\u00e9'}</span>
    </button>
  )
}

export function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary-10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h2 className="text-md font-semibold text-text-primary">{title}</h2>
    </div>
  )
}

export function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border-default last:border-0">
      <div className="flex-1 mr-4">
        <p className="text-md text-text-primary">{label}</p>
        {description && <p className="text-sm text-text-quaternary mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function ThemeSelector({ onSaved }: { onSaved?: () => void }) {
  const { mode, setMode } = useThemeStore()
  const themeOptions: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'system', label: 'Auto', icon: Monitor },
  ]
  return (
    <SegmentedControl
      options={themeOptions}
      value={mode}
      onChange={(v: ThemeMode) => {
        setMode(v)
        onSaved?.()
      }}
      size="sm"
      layoutId="theme-selector"
    />
  )
}
