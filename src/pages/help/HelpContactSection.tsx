import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Mail, Send, CheckCircle } from '../../components/icons'
import { Card, Select } from '../../components/ui'

export function HelpContactSection() {
  const [contactSubject, setContactSubject] = useState<string>('bug')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSent, setContactSent] = useState(false)

  return (
    <Card className="mt-8 p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary-10 flex items-center justify-center flex-shrink-0">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary mb-1">Contacter le support</h3>
          <p className="text-base text-text-secondary">
            Notre équipe est là pour t'aider. On te répond sous 24h.
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
            <p className="text-md font-semibold text-text-primary">Message envoyé !</p>
            <p className="text-base text-text-secondary text-center">
              Merci pour ton message. On te répond dès que possible.
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
                placeholder="Décris ton problème ou ta suggestion..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-border-default text-md text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary resize-none transition-colors"
              />
            </div>
            <button
              onClick={() => {
                if (!contactMessage.trim()) return
                const subject = encodeURIComponent(
                  `[${contactSubject.toUpperCase()}] Support Squad Planner`
                )
                const body = encodeURIComponent(contactMessage)
                window.location.href = `mailto:support@squadplanner.fr?subject=${subject}&body=${body}`
                setContactSent(true)
              }}
              disabled={!contactMessage.trim()}
              className="w-full h-11 rounded-xl bg-primary text-white text-md font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
