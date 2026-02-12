'use client'

import { useRef, useEffect, useState } from 'react'
import { m, useInView } from 'framer-motion'
import { Crown, Check, Loader2, Gift } from '../../components/icons'
import Confetti from '../../components/LazyConfetti'
import { Button } from '../../components/ui'
import { MobilePageHeader } from '../../components/layout/MobilePageHeader'

interface PremiumHeroProps {
  hasPremium: boolean
  isLoading: boolean
  onManageSubscription: () => void
}

export function PremiumHero({ hasPremium, isLoading, onManageSubscription }: PremiumHeroProps) {
  const heroRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isHeroInView) {
      setTimeout(() => {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }, 500)
    }
  }, [isHeroInView])

  return (
    <>
      <MobilePageHeader title="Premium" />
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={80}
          gravity={0.2}
          colors={[
            'var(--color-primary)',
            'var(--color-warning)',
            'var(--color-success)',
            'var(--color-purple)',
            'var(--color-text-primary)',
          ]}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}
      <div
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-purple/10 to-bg-elevated dark:from-surface-dark dark:via-bg-surface dark:to-bg-base pt-8 pb-16"
      >
        <div className="absolute inset-0 overflow-hidden">
          <m.div
            className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-primary/10 to-warning/05 blur-3xl"
            animate={{ x: [0, 80, 0], y: [0, 40, 0] }}
            transition={{ duration: 3, repeat: 2, ease: 'easeInOut' }}
          />
          <m.div
            className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-purple/10 to-success/05 blur-3xl"
            animate={{ x: [0, -80, 0], y: [0, -40, 0] }}
            transition={{ duration: 3, repeat: 2, ease: 'easeInOut', delay: 0.5 }}
          />
        </div>
        <div className="relative px-4 md:px-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-warning/10 to-warning/025 border border-warning/15">
                <Gift className="w-4 h-4 text-warning" />
                <span className="text-base font-medium text-warning">
                  2 mois offerts sur l'annuel
                </span>
              </div>
            </div>
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-warning to-warning/60 mb-6 shadow-glow-warning">
                <Crown className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-text-primary mb-4">
              Passe au niveau
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-warning to-warning/70">
                {' '}
                sup&eacute;rieur
              </span>
            </h1>
            <p className="text-md md:text-lg text-text-secondary max-w-xl mx-auto mb-8">
              D&eacute;bloque tout le potentiel de Squad Planner. Stats avanc&eacute;es, IA coach
              personnalis&eacute;, audio HD et bien plus.
            </p>
            {hasPremium && (
              <div className="mb-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-success/05 border border-success/15">
                  <Check className="w-5 h-5 text-success" />
                  <span className="text-md font-medium text-success">
                    Tu es d&eacute;j&agrave; Premium !
                  </span>
                </div>
                <div className="mt-4">
                  <Button variant="secondary" onClick={onManageSubscription} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'G&eacute;rer mon abonnement'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
