import { useState } from 'react'
import { m } from 'framer-motion'
import { PublicPageShell } from '../components/PublicPageShell'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import {
  Crown,
  Users,
  Mail,
  Send,
  Check,
  Building2,
  Shield,
  Zap,
} from '../components/icons'
import { showSuccess, showError } from '../lib/toast'

const ease = [0.16, 1, 0.3, 1] as const

interface ContactFormData {
  name: string
  email: string
  organization: string
  teamSize: string
  message: string
}

export function Contact() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    organization: '',
    teamSize: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const subject = `[Club] Demande de ${formData.organization || formData.name}`
      const body = `
Nom: ${formData.name}
Email: ${formData.email}
Organisation: ${formData.organization}
Taille de l'équipe: ${formData.teamSize}

Message:
${formData.message}
      `.trim()

      window.location.href = `mailto:contact@squadplanner.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      setIsSubmitted(true)
      showSuccess('Client mail ouvert. Envoie ton message !')
    } catch {
      showError("Erreur lors de l'ouverture du client mail")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PublicPageShell>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-purple/8 to-bg-base pt-8 pb-20">
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-bg-base pointer-events-none" />

        <div className="relative px-4 md:px-6 max-w-4xl mx-auto text-center">
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            className="mb-4"
          >
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple mb-6"
              style={{ boxShadow: 'var(--shadow-glow-primary-sm)' }}
            >
              <Building2 className="w-10 h-10 text-white" />
            </div>
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease }}
            className="text-lg md:text-xl font-bold text-text-primary mb-4"
          >
            Besoin d'une offre{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple">
              sur mesure
            </span>{' '}
            ?
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease }}
            className="text-md md:text-lg text-text-secondary max-w-2xl mx-auto"
          >
            Le tier Club est fait pour les structures esport et les organisations gaming.
            On adapte Squad Planner à tes besoins.
          </m.p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 md:px-6 -mt-14 pb-8 relative z-10">
        {/* Avantages Club */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
        >
          {[
            { icon: Users, label: "Jusqu'à 100 membres", color: 'text-primary' },
            { icon: Crown, label: 'Branding personnalisé', color: 'text-warning' },
            { icon: Zap, label: 'API webhooks', color: 'text-success' },
            { icon: Shield, label: 'Support prioritaire 4h', color: 'text-info' },
          ].map((item, i) => (
            <Card key={i} variant="elevated" className="p-4 text-center">
              <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
              <p className="text-sm font-medium text-text-primary">{item.label}</p>
            </Card>
          ))}
        </m.div>

        {/* Formulaire */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease }}
        >
          <Card variant="elevated" className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">Demande de devis Club</h2>
                <p className="text-sm text-text-tertiary">On te répond sous 24h</p>
              </div>
            </div>

            {isSubmitted ? (
              <m.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  Message envoyé !
                </h3>
                <p className="text-text-secondary max-w-md mx-auto">
                  On te recontacte sous 24h avec un devis adapté à ta structure.
                </p>
              </m.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1.5">
                      Nom / Pseudo
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Ton nom"
                      className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary placeholder-text-quaternary focus:outline-none focus:border-primary transition-interactive"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="ton@email.com"
                      className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary placeholder-text-quaternary focus:outline-none focus:border-primary transition-interactive"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="organization" className="block text-sm font-medium text-text-primary mb-1.5">
                      Organisation / Equipe
                    </label>
                    <input
                      type="text"
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      placeholder="Nom de ton club ou structure"
                      className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary placeholder-text-quaternary focus:outline-none focus:border-primary transition-interactive"
                    />
                  </div>
                  <div>
                    <label htmlFor="teamSize" className="block text-sm font-medium text-text-primary mb-1.5">
                      Taille de l'équipe
                    </label>
                    <select
                      id="teamSize"
                      name="teamSize"
                      value={formData.teamSize}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary focus:outline-none focus:border-primary transition-interactive"
                    >
                      <option value="">Sélectionne</option>
                      <option value="10-25">10-25 membres</option>
                      <option value="25-50">25-50 membres</option>
                      <option value="50-100">50-100 membres</option>
                      <option value="100+">100+ membres</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-1.5">
                    Ton besoin
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    placeholder="Décris ta structure, tes besoins et ce que tu attends de Squad Planner..."
                    className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary placeholder-text-quaternary focus:outline-none focus:border-primary transition-interactive resize-none"
                  />
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Envoyer ma demande
                </Button>

                <p className="text-xs text-text-tertiary text-center">
                  Facturation entreprise disponible. Devis sous 24h.
                </p>
              </form>
            )}
          </Card>
        </m.div>

        {/* Pricing hint */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-text-tertiary mb-2">
            Le tier Club commence à <span className="font-semibold text-text-secondary">39,99 €/mois</span> avec tarif dégressif selon la taille.
          </p>
          <p className="text-xs text-text-quaternary">
            Facturation annuelle disponible avec 2 mois offerts.
          </p>
        </m.div>
      </div>
    </PublicPageShell>
  )
}

export default Contact
