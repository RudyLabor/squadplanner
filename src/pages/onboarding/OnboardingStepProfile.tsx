import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Camera, Globe, Loader2 } from 'lucide-react'
import { Button, Card, Input } from '../../components/ui'

interface OnboardingStepProfileProps {
  slideVariants: Record<string, unknown>
  username: string
  timezone: string
  avatarUrl: string | null
  uploadingAvatar: boolean
  isLoading: boolean
  onUsernameChange: (value: string) => void
  onTimezoneChange: (value: string) => void
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSave: () => void
  onBack: () => void
}

export function OnboardingStepProfile({
  slideVariants, username, timezone, avatarUrl, uploadingAvatar, isLoading,
  onUsernameChange, onTimezoneChange, onAvatarUpload, onSave, onBack
}: OnboardingStepProfileProps) {
  return (
    <motion.div
      key="profile"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-text-primary mb-2">
          C'est toi ?
        </h2>
        <p className="text-text-secondary">
          Tes potes te reconna&icirc;tront
        </p>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          {/* Avatar upload */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div className="w-24 h-24 rounded-full bg-primary-10 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {username?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-surface-overlay flex items-center justify-center rounded-full">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-bg-base cursor-pointer hover:brightness-90 hover:scale-[1.02] transition-interactive">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={onAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            <p className="text-sm text-text-tertiary">
              Clique sur l'ic&ocirc;ne pour changer ta photo
            </p>
          </div>

          {/* Username */}
          <Input
            label="Pseudo"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="TonPseudo"
            required
          />

          {/* Timezone */}
          <div>
            <label className="block text-base font-medium text-text-secondary mb-2">
              <Globe className="w-4 h-4 inline mr-1.5" />
              Fuseau horaire
            </label>
            <select
              value={timezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              className="w-full h-11 px-4 rounded-lg bg-bg-surface border border-border-hover text-text-primary text-md focus:border-primary outline-none [&>option]:bg-bg-surface [&>option]:text-text-primary"
            >
              <option value="Europe/Paris">Europe/Paris (France)</option>
              <option value="Europe/London">Europe/London (UK)</option>
              <option value="Europe/Brussels">Europe/Brussels (Belgique)</option>
              <option value="Europe/Zurich">Europe/Zurich (Suisse)</option>
              <option value="America/Montreal">America/Montreal (Qu&eacute;bec)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (Japon)</option>
            </select>
            <p className="text-sm text-text-tertiary mt-1.5">
              D&eacute;tect&eacute; automatiquement : {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>
          </div>

          <Button
            onClick={onSave}
            disabled={isLoading || !username.trim()}
            className="w-full h-12"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Enregistrement...
              </>
            ) : (
              <>
                Continuer
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
