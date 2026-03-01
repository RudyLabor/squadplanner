import { useState, useCallback } from 'react'
import { m } from 'framer-motion'
import { Users, Copy, Share2, Check, ArrowRight } from '../../components/icons'
import { Button } from '../../components/ui'
import { showSuccess } from '../../lib/toast'

interface OnboardingStepInviteProps {
  slideVariants: any
  squadCode: string | null
  squadName: string | null
  isNavigating: boolean
  onComplete: () => void
  onSkip: () => void
}

export function OnboardingStepInvite({
  slideVariants,
  squadCode,
  squadName,
  isNavigating,
  onComplete,
  onSkip,
}: OnboardingStepInviteProps) {
  const [copied, setCopied] = useState(false)
  const inviteLink = squadCode ? `https://squadplanner.fr/join/${squadCode}` : null
  const shareMessage = `Rejoins ma squad${squadName ? ` "${squadName}"` : ''} sur Squad Planner ! ${inviteLink || 'https://squadplanner.fr'}`

  const handleCopy = useCallback(async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      showSuccess('Lien copié !')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const el = document.createElement('textarea')
      el.value = inviteLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      showSuccess('Lien copié !')
      setTimeout(() => setCopied(false), 2000)
    }
  }, [inviteLink])

  const handleShare = useCallback(
    async (method: 'native' | 'whatsapp' | 'sms') => {
      if (method === 'native' && navigator.share) {
        try {
          await navigator.share({
            title: 'Rejoins ma squad sur Squad Planner',
            text: shareMessage,
            url: inviteLink || 'https://squadplanner.fr',
          })
        } catch {
          // User cancelled
        }
        return
      }
      if (method === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank')
        return
      }
      if (method === 'sms') {
        window.open(`sms:?body=${encodeURIComponent(shareMessage)}`, '_blank')
        return
      }
    },
    [shareMessage, inviteLink]
  )

  return (
    <m.div
      key="invite"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="text-center"
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Users className="w-8 h-8 text-primary" />
      </div>

      <h1 className="text-xl font-bold text-text-primary mb-2">Invite tes potes</h1>
      <p className="text-text-secondary mb-6">
        {squadName
          ? `Partage le lien de "${squadName}" à tes coéquipiers pour jouer ensemble.`
          : 'Partage Squad Planner avec tes potes gamers !'}
      </p>

      {/* Invite link */}
      {inviteLink && (
        <div className="mb-6">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-card border border-border-subtle">
            <span className="flex-1 text-sm text-text-secondary truncate text-left">
              {inviteLink}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              aria-label="Copier le lien"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Share buttons */}
      <div className="space-y-2 mb-6">
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={() => handleShare('native')}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary-bg text-white font-medium hover:bg-primary-bg-hover transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Partager
          </button>
        )}

        <button
          type="button"
          onClick={() => handleShare('whatsapp')}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-success/10 text-success font-medium hover:bg-success/20 transition-colors border border-success/20"
        >
          💬 WhatsApp
        </button>

        <button
          type="button"
          onClick={() => handleShare('sms')}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-surface-card text-text-secondary font-medium hover:bg-surface-card-hover transition-colors border border-border-subtle"
        >
          📱 SMS
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button onClick={onComplete} disabled={isNavigating} className="w-full">
          Continuer
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
        <button
          type="button"
          onClick={onSkip}
          disabled={isNavigating}
          className="text-sm text-text-tertiary hover:text-text-secondary transition-colors py-2"
        >
          Passer cette étape
        </button>
      </div>
    </m.div>
  )
}
