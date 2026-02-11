import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Cookie, Shield, X } from './icons'
import { Link } from 'react-router-dom'

const COOKIE_CONSENT_KEY = 'sq-cookie-consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Check if consent was already given
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Small delay for better UX (don't show immediately on page load)
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  const handleEssentialOnly = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'essential')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[60]"
        >
          <div className="bg-bg-surface border border-border-hover rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
            {/* Header */}
            <div className="p-5 pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-10 flex items-center justify-center shrink-0">
                    <Cookie className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-text-primary">Cookies & confidentialité</h3>
                    <p className="text-sm text-text-tertiary mt-0.5">Tes données, ton choix</p>
                  </div>
                </div>
                <button
                  onClick={handleEssentialOnly}
                  className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4 text-text-tertiary" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-base text-text-secondary leading-relaxed mb-4">
                Squad Planner utilise des cookies essentiels pour fonctionner et des cookies analytics
                pour améliorer ton expérience. Aucun cookie publicitaire.
              </p>

              {/* Details toggle */}
              <AnimatePresence>
                {showDetails && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="space-y-3 pb-2">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-card border border-border-subtle">
                        <div className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0" />
                        <div>
                          <p className="text-base font-medium text-text-primary">Essentiels</p>
                          <p className="text-sm text-text-tertiary">Authentification, thème, état de l'app. Toujours actifs.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-card border border-border-subtle">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div>
                          <p className="text-base font-medium text-text-primary">Analytics</p>
                          <p className="text-sm text-text-tertiary">Monitoring d'erreurs anonymisé via notre propre service.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-card border border-border-subtle">
                        <div className="w-2 h-2 rounded-full bg-text-tertiary mt-1.5 shrink-0" />
                        <div>
                          <p className="text-base font-medium text-text-primary">Publicitaires</p>
                          <p className="text-sm text-text-tertiary">Aucun. On ne vend pas tes données.</p>
                        </div>
                      </div>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleEssentialOnly}
                  className="flex-1 h-11 rounded-xl bg-border-subtle text-md text-text-secondary font-medium hover:bg-border-hover transition-colors"
                >
                  Essentiels uniquement
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 h-11 rounded-xl bg-primary text-md text-white font-semibold hover:bg-primary-hover transition-colors"
                >
                  Tout accepter
                </button>
              </div>

              {/* Footer links */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {showDetails ? 'Masquer les détails' : 'Voir les détails'}
                </button>
                <Link
                  to="/legal?tab=privacy"
                  className="flex items-center gap-1 text-sm text-primary hover:text-purple transition-colors"
                >
                  <Shield className="w-3 h-3" />
                  Politique de confidentialité
                </Link>
              </div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
