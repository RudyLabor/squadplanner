"use client";

import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore, useSubscriptionStore, usePremiumStore } from '../hooks'
import { showSuccess } from '../lib/toast'
import { captureException } from '../lib/sentry'
import { PremiumHero } from './premium/PremiumHero'
import { PremiumPricing } from './premium/PremiumPricing'
import { PremiumFeaturesTable } from './premium/PremiumFeaturesTable'
import { PremiumTestimonials } from './premium/PremiumTestimonials'
import { PremiumFAQ } from './premium/PremiumFAQ'

export function Premium() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { hasPremium } = usePremiumStore()
  const { createCheckoutSession, createPortalSession, plans } = useSubscriptionStore()

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    if (!user) { navigate('/auth'); return }
    setIsLoading(true); setError(null)
    try {
      const priceId = selectedPlan === 'monthly'
        ? plans.find(p => p.id === 'premium_monthly')?.stripePriceId
        : plans.find(p => p.id === 'premium_yearly')?.stripePriceId
      if (!priceId) throw new Error('Plan non trouvé')
      const { url, error } = await createCheckoutSession(undefined as unknown as string, priceId)
      if (error) throw error
      if (url) window.location.href = url
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      captureException(error, { context: 'stripe_checkout', selectedPlan, userId: user.id })
      const errorMessage = error.message
      if (errorMessage.includes('Edge Function') || errorMessage.includes('non-2xx')) setError('Une erreur est survenue. Réessaye dans quelques instants.')
      else if (errorMessage.includes('network') || errorMessage.includes('fetch')) setError('Problème de connexion. Vérifie ta connexion internet.')
      else setError('Une erreur est survenue. Réessaye dans quelques instants.')
    } finally { setIsLoading(false) }
  }

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      const { url, error } = await createPortalSession()
      if (error) throw error
      if (url) window.location.href = url
    } catch (err) { setError(err instanceof Error ? err.message : 'Erreur') }
    finally { setIsLoading(false) }
  }

  const handleStartTrial = () => {
    if (!user) { navigate('/auth'); return }
    showSuccess('Essai gratuit activé ! Profite de 7 jours Premium.')
  }

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Premium">
      <PremiumHero hasPremium={hasPremium} isLoading={isLoading} onManageSubscription={handleManageSubscription} />
      <div className="px-4 md:px-6 max-w-4xl mx-auto -mt-8">
        {!hasPremium && (
          <PremiumPricing selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} isLoading={isLoading} error={error} onUpgrade={handleUpgrade} onStartTrial={handleStartTrial} />
        )}
        <PremiumFeaturesTable />
        <PremiumTestimonials />
        <PremiumFAQ />
      </div>
    </main>
  )
}

export default Premium
