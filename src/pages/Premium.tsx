
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore, useSubscriptionStore, usePremiumStore, useAnalytics } from '../hooks'
import { showSuccess, showError } from '../lib/toast'
import { captureException } from '../lib/sentry'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { PremiumHero } from './premium/PremiumHero'
import { PremiumPricing } from './premium/PremiumPricing'
import { PremiumFeaturesTable } from './premium/PremiumFeaturesTable'
import { PremiumTestimonials } from './premium/PremiumTestimonials'
import { PremiumFAQ } from './premium/PremiumFAQ'
import type { SubscriptionTier } from '../types/database'

export function Premium() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { tier, hasPremium } = usePremiumStore()
  const { createCheckoutSession, createPortalSession, plans } = useSubscriptionStore()
  const analytics = useAnalytics()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track premium page view
  useEffect(() => {
    analytics.track('premium_viewed', {
      already_premium: hasPremium,
      current_tier: tier,
      source: 'direct_navigation',
    })
  }, [analytics, hasPremium, tier])

  const handleUpgrade = async (selectedTier: SubscriptionTier, interval: 'monthly' | 'yearly') => {
    if (!user) {
      navigate('/auth')
      return
    }

    // Find the matching plan
    const planId = `${selectedTier}_${interval}`
    const plan = plans.find((p) => p.id === planId)

    analytics.track('premium_checkout_started', {
      tier: selectedTier,
      interval,
      price: plan?.price ?? 0,
    })

    setIsLoading(true)
    setError(null)
    try {
      const priceId = plan?.stripePriceId
      if (!priceId) throw new Error('Plan non trouvé')
      const { url, error } = await createCheckoutSession(priceId, selectedTier)
      if (error) throw error
      if (url) window.location.href = url
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      captureException(error, { context: 'stripe_checkout', tier: selectedTier, interval, userId: user.id })
      const errorMessage = error.message
      if (errorMessage.includes('Edge Function') || errorMessage.includes('non-2xx'))
        setError('Une erreur est survenue. Réessaye dans quelques instants.')
      else if (errorMessage.includes('network') || errorMessage.includes('fetch'))
        setError('Problème de connexion. Vérifie ta connexion internet.')
      else setError('Une erreur est survenue. Réessaye dans quelques instants.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      const { url, error } = await createPortalSession()
      if (error) throw error
      if (url) window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartTrial = async () => {
    if (!user) {
      navigate('/auth')
      return
    }

    if (hasPremium) {
      showError('Tu as déjà un abonnement Premium actif.')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      // Check if user already used a trial (subscription_expires_at set)
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at')
        .eq('id', user.id)
        .single()

      if (profile?.subscription_expires_at) {
        showError('Tu as déjà utilisé ton essai gratuit.')
        setIsLoading(false)
        return
      }

      // Activate 7-day trial
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: 'premium',
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Refresh premium status
      await usePremiumStore.getState().fetchPremiumStatus()
      analytics.track('trial_started', { duration_days: 7 })
      showSuccess('Essai gratuit activé ! Profite de 7 jours Premium.')
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      captureException(error, { context: 'start_trial', userId: user.id })
      setError('Erreur lors de l\'activation de l\'essai gratuit.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Premium">
      <PremiumHero
        hasPremium={hasPremium}
        isLoading={isLoading}
        onManageSubscription={handleManageSubscription}
      />
      <div className="px-4 md:px-6 max-w-5xl mx-auto -mt-8">
        {!hasPremium && (
          <PremiumPricing
            isLoading={isLoading}
            error={error}
            onUpgrade={handleUpgrade}
            onStartTrial={handleStartTrial}
          />
        )}
        <PremiumFeaturesTable />
        <PremiumTestimonials />
        <PremiumFAQ />
      </div>
    </main>
  )
}

export default Premium
