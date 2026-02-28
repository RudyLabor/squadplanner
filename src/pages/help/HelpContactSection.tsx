import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Mail, Send, CheckCircle, Crown, Zap } from '../../components/icons'
import { Card, Select } from '../../components/ui'
import { usePremium } from '../../hooks/usePremium'
import type { SubscriptionTier } from '../../types/database'

/** Maps subscription tier to support priority level */
function getSupportPriority(tier: SubscriptionTier): {
  priority: 'normal' | 'high' | 'urgent' | 'critical'
  label: string
  responseTime: string
  badgeClass: string
  icon: typeof Crown | typeof Zap
} {
  switch (tier) {
    case 'club':
      return {
        priority: 'critical',
        label: 'Support Club',
        responseTime: 'Ton ticket sera traite en priorite absolue (reponse sous 4h)',
        badgeClass: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white',
        icon: Crown,
      }
    case 'squad_leader':
      return {
        priority: 'urgent',
        label: 'Support Prioritaire',
        responseTime: 'Ton ticket sera traite en priorite (reponse sous 12h)',
        badgeClass: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white',
        icon: Crown,
      }
    case 'premium':
      return {
        priority: 'high',
        label: 'Support Prioritaire',
        responseTime: 'Ton ticket sera traite en priorite (reponse sous 24h)',
        badgeClass: 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white',
        icon: Zap,
      }
    default:
      return {
        priority: 'normal',
        label: '',
        responseTime: 'Reponse sous 48h',
        badgeClass: '',
        icon: Zap,
      }
  }
}

export function HelpContactSection() {
  const [contactSubject, setContactSubject] = useState<string>('bug')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSent, setContactSent] = useState(false)
  const { tier, hasPremium } = usePremium()
  const supportInfo = getSupportPriority(tier)

  return (
    <Card className="mt-8 p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary-10 flex items-center justify-center flex-shrink-0">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-lg font-semibold text-text-primary">Contacter le support</h3>
            {hasPremium && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${supportInfo.badgeClass}`}
              >
                <supportInfo.icon className="w-3 h-3" />
                {supportInfo.label}
              </span>
            )}
          </div>
          <p className="text-base text-text-secondary">
            {supportInfo.responseTime}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {contactSent ? (
          <m.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-6"
          >
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-success" />
            </div>
            <p className="text-md font-semibold text-text-primary">Message envoy\u00e9\u00a0!</p>
            <p className="text-base text-text-secondary text-center">
              {hasPremium
                ? 'Merci\u00a0! Ton ticket prioritaire a ete envoye. On te repond au plus vite.'
                : 'Merci pour ton retour\u00a0! On te repond sous 48h.'}
            </p>
            <button
              onClick={() => {
                setContactSent(false)
                setContactMessage('')
              }}
              className="mt-2 text-base font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Envoyer un autre message
            </button>
          </m.div>
        ) : (
          <m.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-base font-medium text-text-secondary mb-1.5">
                Sujet
              </label>
              <Select
                value={contactSubject}
                onChange={(v) => setContactSubject(v as string)}
                options={[
                  { value: 'bug', label: 'Bug' },
                  { value: 'suggestion', label: 'Suggestion' },
                  { value: 'question', label: 'Question' },
                  { value: 'autre', label: 'Autre' },
                ]}
                size="sm"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-text-secondary mb-1.5">
                Message
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="D\u00e9cris ton probl\u00e8me ou ta suggestion..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-border-default text-md text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary resize-none transition-colors"
              />
            </div>
            <button
              onClick={() => {
                if (!contactMessage.trim()) return
                const priorityTag = supportInfo.priority !== 'normal' ? `[${supportInfo.priority.toUpperCase()}]` : ''
                const tierTag = `[${tier.toUpperCase()}]`
                const subject = encodeURIComponent(
                  `${priorityTag}${tierTag}[${contactSubject.toUpperCase()}] Support Squad Planner`
                )
                const body = encodeURIComponent(
                  `${contactMessage}\n\n---\nTier: ${tier}\nPriorite: ${supportInfo.priority}`
                )
                window.location.href = `mailto:support@squadplanner.fr?subject=${subject}&body=${body}`
                setContactSent(true)
              }}
              disabled={!contactMessage.trim()}
              className="w-full h-11 rounded-xl bg-primary-bg text-white text-md font-semibold hover:bg-primary-bg-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Envoyer le message
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
