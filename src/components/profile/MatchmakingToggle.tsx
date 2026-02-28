import { useState, useEffect, useCallback } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Users, Gamepad2, MapPin, ChevronDown } from '../icons'
import { Toggle, Select, Badge } from '../ui'
import type { SelectOption } from '../ui'
import { showSuccess, showError } from '../../lib/toast'

interface MatchmakingToggleProps {
  profile: {
    looking_for_squad?: boolean
    preferred_games?: string[]
    region?: string | null
    playstyle?: string | null
  } | null
  updateProfile: (data: Record<string, unknown>) => Promise<{ error?: unknown }>
  /** Auto-open when navigating with ?activate=matchmaking */
  autoActivate?: boolean
}

const GAME_OPTIONS: SelectOption[] = [
  { value: 'Valorant', label: 'Valorant' },
  { value: 'League of Legends', label: 'League of Legends' },
  { value: 'Fortnite', label: 'Fortnite' },
  { value: 'Rocket League', label: 'Rocket League' },
  { value: 'CS2', label: 'CS2' },
  { value: 'Apex Legends', label: 'Apex Legends' },
  { value: 'Minecraft', label: 'Minecraft' },
  { value: 'FIFA', label: 'FIFA' },
  { value: 'Call of Duty', label: 'Call of Duty' },
  { value: 'Overwatch 2', label: 'Overwatch 2' },
  { value: 'Destiny 2', label: 'Destiny 2' },
  { value: 'GTA Online', label: 'GTA Online' },
]

const REGION_OPTIONS: SelectOption[] = [
  { value: 'eu-west', label: 'Europe Ouest' },
  { value: 'eu-east', label: 'Europe Est' },
  { value: 'na', label: 'Amérique du Nord' },
  { value: 'asia', label: 'Asie' },
  { value: 'oce', label: 'Océanie' },
]

const PLAYSTYLE_OPTIONS: SelectOption[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'competitive', label: 'Compétitif' },
  { value: 'both', label: 'Les deux' },
]

export function MatchmakingToggle({
  profile,
  updateProfile,
  autoActivate,
}: MatchmakingToggleProps) {
  const [isEnabled, setIsEnabled] = useState(profile?.looking_for_squad ?? false)
  const [selectedGames, setSelectedGames] = useState<string[]>(profile?.preferred_games ?? [])
  const [region, setRegion] = useState<string>(profile?.region ?? '')
  const [playstyle, setPlaystyle] = useState<string>(profile?.playstyle ?? '')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Sync from profile when it updates
  useEffect(() => {
    if (profile) {
      setIsEnabled(profile.looking_for_squad ?? false)
      setSelectedGames(profile.preferred_games ?? [])
      setRegion(profile.region ?? '')
      setPlaystyle(profile.playstyle ?? '')
    }
  }, [profile])

  // Auto-activate when coming from Discover > Joueurs
  useEffect(() => {
    if (autoActivate && !isEnabled) {
      setExpanded(true)
      // Small delay so the user sees the section expand first
      const timer = setTimeout(() => {
        handleToggle(true)
      }, 300)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoActivate])

  const handleToggle = useCallback(
    async (newValue: boolean) => {
      setIsEnabled(newValue)
      setSaving(true)
      try {
        const result = await updateProfile({ looking_for_squad: newValue })
        if (result.error) throw result.error
        if (newValue) {
          setExpanded(true)
          showSuccess('Recherche de squad activée !')
        } else {
          showSuccess('Recherche de squad désactivée')
        }
      } catch {
        setIsEnabled(!newValue)
        showError('Erreur lors de la mise à jour')
      } finally {
        setSaving(false)
      }
    },
    [updateProfile]
  )

  const handleGameToggle = useCallback(
    async (game: string) => {
      const newGames = selectedGames.includes(game)
        ? selectedGames.filter((g) => g !== game)
        : [...selectedGames, game]
      setSelectedGames(newGames)

      try {
        const result = await updateProfile({ preferred_games: newGames })
        if (result.error) throw result.error
      } catch {
        setSelectedGames(selectedGames)
        showError('Erreur lors de la mise à jour')
      }
    },
    [selectedGames, updateProfile]
  )

  const handleRegionChange = useCallback(
    async (value: string | string[]) => {
      const newRegion = typeof value === 'string' ? value : value[0] || ''
      setRegion(newRegion)
      try {
        const result = await updateProfile({ region: newRegion || null })
        if (result.error) throw result.error
      } catch {
        setRegion(region)
        showError('Erreur lors de la mise à jour')
      }
    },
    [region, updateProfile]
  )

  const handlePlaystyleChange = useCallback(
    async (value: string | string[]) => {
      const newPlaystyle = typeof value === 'string' ? value : value[0] || ''
      setPlaystyle(newPlaystyle)
      try {
        const result = await updateProfile({ playstyle: newPlaystyle || null })
        if (result.error) throw result.error
      } catch {
        setPlaystyle(playstyle)
        showError('Erreur lors de la mise à jour')
      }
    },
    [playstyle, updateProfile]
  )

  return (
    <section
      className="mb-5 rounded-2xl border border-border-subtle bg-surface-card overflow-hidden"
      aria-label="Recherche de squad"
    >
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-surface-card-hover transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">Recherche de squad</h3>
            {isEnabled && (
              <Badge variant="success" size="sm">
                Actif
              </Badge>
            )}
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            {isEnabled
              ? 'Tu es visible par les autres joueurs'
              : 'Active pour être trouvé par d’autres joueurs'}
          </p>
        </div>
        <m.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-text-tertiary" />
        </m.div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border-subtle pt-4">
              {/* Toggle principal */}
              <Toggle
                checked={isEnabled}
                onChange={handleToggle}
                label="Visible dans le matchmaking"
                description="Les joueurs pourront te trouver dans l'onglet Découvrir > Joueurs"
                disabled={saving}
              />

              {/* Options (visible seulement quand activé) */}
              <AnimatePresence>
                {isEnabled && (
                  <m.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Jeux préférés */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                        <Gamepad2 className="w-4 h-4 text-text-tertiary" />
                        Jeux préférés
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {GAME_OPTIONS.map((game) => {
                          const isSelected = selectedGames.includes(game.value)
                          return (
                            <button
                              key={game.value}
                              type="button"
                              onClick={() => handleGameToggle(game.value)}
                              className={`
                                px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                ${
                                  isSelected
                                    ? 'bg-primary/15 text-primary border border-primary/30'
                                    : 'bg-overlay-subtle text-text-secondary border border-transparent hover:bg-overlay-faint'
                                }
                              `}
                              aria-pressed={isSelected}
                            >
                              {game.label}
                            </button>
                          )
                        })}
                      </div>
                      {selectedGames.length === 0 && (
                        <p className="text-xs text-text-quaternary mt-1">
                          Sélectionne au moins un jeu pour de meilleurs résultats
                        </p>
                      )}
                    </div>

                    {/* Région */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                        <MapPin className="w-4 h-4 text-text-tertiary" />
                        Région
                      </label>
                      <Select
                        options={REGION_OPTIONS}
                        value={region || undefined}
                        onChange={handleRegionChange}
                        placeholder="Sélectionne ta région"
                        clearable
                        size="sm"
                      />
                    </div>

                    {/* Playstyle */}
                    <div>
                      <label className="text-sm font-medium text-text-primary mb-2 block">
                        Style de jeu
                      </label>
                      <Select
                        options={PLAYSTYLE_OPTIONS}
                        value={playstyle || undefined}
                        onChange={handlePlaystyleChange}
                        placeholder="Casual, compétitif..."
                        clearable
                        size="sm"
                      />
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  )
}
