import { memo } from 'react'
import { m } from 'framer-motion'
import { Bell, Moon, Volume2, Vibrate, Loader2 } from './icons'
import {
  useNotificationPreferences,
  NOTIFICATION_CATEGORIES,
} from '../hooks/useNotificationPreferences'

export const NotificationSettings = memo(function NotificationSettings() {
  const {
    preferences,
    isLoading,
    updatePreference,
    updateQuietHours,
    toggleSound,
    toggleVibration,
    toggleCategory,
  } = useNotificationPreferences()

  if (isLoading || !preferences) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Global settings */}
      <div className="space-y-3">
        <h3 className="text-md font-semibold text-text-primary flex items-center gap-2">
          <Bell className="w-4 h-4" /> Général
        </h3>

        <ToggleRow
          label="Sons de notification"
          icon={<Volume2 className="w-4 h-4" />}
          checked={preferences.sound_enabled}
          onChange={toggleSound}
        />

        <ToggleRow
          label="Vibration"
          icon={<Vibrate className="w-4 h-4" />}
          checked={preferences.vibration_enabled}
          onChange={toggleVibration}
        />

        {/* Quiet hours */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2.5">
            <Moon className="w-4 h-4 text-text-tertiary" />
            <div>
              <p className="text-sm text-text-primary">Heures silencieuses</p>
              <p className="text-xs text-text-quaternary">
                Pas de notifications pendant cette période
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={preferences.quiet_hours_start || ''}
              onChange={(e) =>
                updateQuietHours(e.target.value || null, preferences.quiet_hours_end)
              }
              className="px-2 py-1 bg-bg-surface border border-border-default rounded-lg text-sm text-text-primary"
            />
            <span className="text-text-quaternary text-sm">-</span>
            <input
              type="time"
              value={preferences.quiet_hours_end || ''}
              onChange={(e) =>
                updateQuietHours(preferences.quiet_hours_start, e.target.value || null)
              }
              className="px-2 py-1 bg-bg-surface border border-border-default rounded-lg text-sm text-text-primary"
            />
          </div>
        </div>
      </div>

      {/* Notification categories */}
      {NOTIFICATION_CATEGORIES.map((category, catIndex) => (
        <m.div
          key={category.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: catIndex * 0.05 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-md font-semibold text-text-primary flex items-center gap-2">
              <span>{category.icon}</span> {category.label}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleCategory(category.key, true)}
                className="text-xs text-primary hover:text-primary-hover transition-colors"
              >
                Tout activer
              </button>
              <span className="text-text-quaternary">|</span>
              <button
                onClick={() => toggleCategory(category.key, false)}
                className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Tout désactiver
              </button>
            </div>
          </div>

          <div className="space-y-1 pl-1">
            {category.settings.map((setting) => (
              <ToggleRow
                key={setting.key}
                label={setting.label}
                checked={
                  ((preferences as unknown as Record<string, unknown>)[setting.key] as boolean) ??
                  true
                }
                onChange={(checked) => updatePreference(setting.key, checked)}
              />
            ))}
          </div>
        </m.div>
      ))}
    </div>
  )
})

// Toggle row component
function ToggleRow({
  label,
  icon,
  checked,
  onChange,
}: {
  label: string
  icon?: React.ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between py-2 group"
    >
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-text-tertiary">{icon}</span>}
        <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
          {label}
        </span>
      </div>
      <div
        className={`relative w-10 h-5.5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-border-default'}`}
      >
        <div
          className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </div>
    </button>
  )
}
