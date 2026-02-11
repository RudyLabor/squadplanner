import { m, AnimatePresence } from 'framer-motion'
import { X } from '../icons'
interface ShortcutsHelpModalProps {
  isOpen: boolean
  onClose: () => void
  shortcutKey: string
}

export function ShortcutsHelpModal({ isOpen, onClose, shortcutKey }: ShortcutsHelpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101] mx-4"
          >
            <div className="bg-bg-surface border border-border-hover rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
                <h2 className="text-lg font-semibold text-text-primary">Raccourcis clavier</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-border-subtle transition-colors"
                >
                  <X className="w-4 h-4 text-text-tertiary" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-2">Navigation</h3>
                  <div className="space-y-2">
                    {[
                      { key: 'H', action: 'Accueil' },
                      { key: 'S', action: 'Squads' },
                      { key: 'M', action: 'Messages' },
                      { key: 'P', action: 'Party vocale' },
                      { key: 'N', action: 'Nouvelle session' },
                      { key: 'T', action: 'Changer le thème' },
                    ].map(({ key, action }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-base text-text-secondary">{action}</span>
                        <kbd className="px-2 py-1 rounded bg-border-subtle text-sm font-mono text-text-primary">{key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-2">Global</h3>
                  <div className="space-y-2">
                    {[
                      { key: `${shortcutKey} K`, action: 'Palette de commandes' },
                      { key: '?', action: 'Afficher cette aide' },
                      { key: 'Esc', action: 'Fermer les modals' },
                    ].map(({ key, action }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-base text-text-secondary">{action}</span>
                        <kbd className="px-2 py-1 rounded bg-border-subtle text-sm font-mono text-text-primary">{key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  )
}
