"use client";

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { ArrowRight } from '../icons'
import { Link } from 'react-router'

export function MobileStickyCTA() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const pricingSection = document.getElementById('pricing')
      if (pricingSection) {
        const rect = pricingSection.getBoundingClientRect()
        // Show after scrolling 500px, hide when pricing is visible
        setIsVisible(window.scrollY > 500 && rect.top > window.innerHeight)
      } else {
        setIsVisible(window.scrollY > 500)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-bg-base/95 backdrop-blur-xl border-t border-border-subtle"
        >
          <Link
            to="/auth?mode=register&redirect=onboarding"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-primary text-white font-semibold text-md shadow-lg shadow-primary/20"
            data-track="mobile_sticky_cta_click"
          >
            Créer ma squad gratuitement
            <ArrowRight className="w-4 h-4" />
          </Link>
        </m.div>
      )}
    </AnimatePresence>
  )
}
