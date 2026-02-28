/**
 * PHASE 5.2 — PWA Install Banner
 *
 * Bottom banner prompting users to install the app.
 * Uses Framer Motion for smooth enter/exit animations.
 * French wording, consistent with the app's design system.
 */
import { memo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Download, X } from './icons'
import { usePWAInstallStore } from '../hooks/usePWAInstall'

export const PWAInstallBanner = memo(function PWAInstallBanner() {
  const showBanner = usePWAInstallStore((state) => state.showBanner)
  const promptInstall = usePWAInstallStore((state) => state.promptInstall)
  const dismissBanner = usePWAInstallStore((state) => state.dismissBanner)

  return (
    <AnimatePresence>
      {showBanner && (
        <m.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-[380px] z-[60] rounded-2xl bg-bg-surface border border-border-default shadow-elevated p-4"
          role="alert"
        >
          <div className="flex items-start gap-3">
            {/* App icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-md font-semibold text-text-primary">Installer Squad Planner</h3>
              <p className="text-base text-text-secondary mt-0.5">
                Accès rapide depuis ton écran d'accueil
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => promptInstall()}
                  className="px-4 py-2 rounded-lg bg-primary-bg text-white text-base font-semibold hover:bg-primary-bg-hover active:scale-[0.97] transition-all"
                >
                  Installer
                </button>
                <button
                  type="button"
                  onClick={dismissBanner}
                  className="px-3 py-2 rounded-lg text-text-secondary text-base hover:bg-border-subtle transition-colors"
                >
                  Plus tard
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={dismissBanner}
              className="p-2.5 -m-1 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-border-subtle transition-colors flex-shrink-0"
              aria-label="Fermer la bannière d'installation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
})
