import { useState, type FormEvent } from 'react'
import { m } from 'framer-motion'
import { Mail, ArrowRight, CheckCircle2 } from '../icons'

export function NewsletterCTA() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email || status === 'loading') return
    setStatus('loading')
    // Simulate subscription (store in localStorage for now)
    setTimeout(() => {
      try {
        const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]')
        if (!subscribers.includes(email)) {
          subscribers.push(email)
          localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers))
        }
        setStatus('success')
        setEmail('')
      } catch {
        setStatus('error')
      }
    }, 800)
  }

  if (status === 'success') {
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-2xl bg-success/[0.06] border border-success/15 text-center"
      >
        <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-3" />
        <p className="text-base font-semibold text-text-primary mb-1">Bienvenue dans la squad !</p>
        <p className="text-sm text-text-tertiary">
          Tu recevras nos meilleures astuces anti-ghosting chaque semaine.
        </p>
      </m.div>
    )
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] border border-primary/15">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-5 h-5 text-primary" />
        <h3 className="text-base font-bold text-text-primary">
          Une astuce anti-ghosting par semaine
        </h3>
      </div>
      <p className="text-sm text-text-tertiary mb-4">
        Rejoins 500+ chefs de squad. Gratuit, sans spam, désinscription en 1 clic.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.com"
          required
          className="flex-1 h-10 px-4 rounded-xl bg-surface-card border border-border-subtle text-sm text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary transition-colors"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary-bg text-white text-sm font-semibold hover:bg-primary-bg-hover transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? 'Envoi...' : "S'abonner"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>
      {status === 'error' && (
        <p className="text-xs text-error mt-2">Une erreur est survenue. Réessaie.</p>
      )}
    </div>
  )
}
