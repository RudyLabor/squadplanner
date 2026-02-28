import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Shield, CheckCircle } from './icons'
import { Dialog, DialogBody, DialogFooter, Button } from './ui'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { useAuthStore } from '../hooks/useAuth'
import { usePremium } from '../hooks/usePremium'
import { showSuccess, showError } from '../lib/toast'

interface RefundRequestModalProps {
  open: boolean
  onClose: () => void
}

export function RefundRequestModal({ open, onClose }: RefundRequestModalProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { user, profile } = useAuthStore()
  const { tier } = usePremium()

  const handleSubmit = async () => {
    if (!user) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase.functions.invoke('error-report', {
        body: {
          errors: [
            {
              message: `Demande de remboursement — ${profile?.username || user.email}`,
              url: window.location.href,
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              userId: user.id,
              username: profile?.username || '',
              level: 'info',
              subscriptionTier: tier,
              type: 'refund_request',
              extra: {
                reason: reason.trim() || 'Aucune raison fournie',
                subscription_tier: tier,
                email: user.email,
              },
              tags: {
                report_type: 'refund_request',
                subscription_tier: tier,
              },
            },
          ],
        },
      })

      if (error) throw error

      setIsSuccess(true)
      showSuccess('Demande de remboursement envoyée')
    } catch {
      showError("Erreur lors de l'envoi de la demande. Réessaie ou contacte le support.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setIsSuccess(false)
    setIsSubmitting(false)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Garantie satisfait ou rembourse"
      description="30 jours pour changer d'avis"
      size="sm"
    >
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <m.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <DialogBody>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <div className="text-center">
                  <p className="text-md font-semibold text-text-primary mb-2">
                    Demande envoyée
                  </p>
                  <p className="text-base text-text-secondary">
                    Ta demande a été envoyée ! Tu recevras un email de confirmation sous 24h.
                  </p>
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="secondary" onClick={handleClose}>
                Fermer
              </Button>
            </DialogFooter>
          </m.div>
        ) : (
          <m.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DialogBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary">
                    Tu peux demander un remboursement dans les 30 premiers jours de ton abonnement.
                    Aucune question posee.
                  </p>
                </div>

                <div>
                  <label className="block text-base font-medium text-text-secondary mb-1.5">
                    Dis-nous pourquoi tu n'es pas satisfait (optionnel)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ton retour nous aide a nous ameliorer..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-border-default text-md text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary resize-none transition-colors"
                  />
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText="Envoi..."
                leftIcon={isSubmitting ? undefined : <Shield className="w-4 h-4" />}
              >
                Demander un remboursement
              </Button>
            </DialogFooter>
          </m.div>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
