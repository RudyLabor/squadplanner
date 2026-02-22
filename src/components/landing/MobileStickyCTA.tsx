import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { ArrowRight, X } from '../icons'
import { Link } from 'react-router'

export function MobileStickyCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (isDismissed) return
    const handleScroll = () => {
      const heroSection = document.getElementById('main-content')
      const pricingSection = document.getElementById('pricing')
      if (heroSection && pricingSection) {
        const heroRect = heroSection.getBoundingClientRect()
        const pricingRect = pricingSection.getBoundingClientRect()
        // Show only after hero is fully scrolled past, hide when pricing is visible
        setIsVisible(heroRect.bottom < 0 && pricingRect.top > window.innerHeight)
      } else if (heroSection) {
        const heroRect = heroSection.getBoundingClientRect()
        setIsVisible(heroRect.bottom < 0)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isDismissed])

  return (
    <AnimatePresence>
      {isVisible && !isDismissed && (
        <m.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] bg-bg-base/70 backdrop-blur-xl border-t border-border-subtle/50"
        >
          <div className="flex items-center gap-2">
            <Link
              to="/auth?mode=register&redirect=onboarding"
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-primary/90 text-white font-medium text-base shadow-md shadow-primary/15"
              data-track="mobile_sticky_cta_click"
            >
              Créer ma squad gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="shrink-0 w-10 h-10 rounded-lg bg-bg-elevated/80 border border-border-subtle/50 flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
