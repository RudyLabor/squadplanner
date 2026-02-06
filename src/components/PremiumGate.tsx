import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Lock, Zap, Crown } from 'lucide-react'
import { Button } from './ui'
import { PremiumUpgradeModal } from './PremiumUpgradeModal'
import { usePremiumStore, type PremiumFeature } from '../hooks/usePremium'

interface PremiumGateProps {
  children: ReactNode
  feature: PremiumFeature
  featureLabel?: string
  squadId?: string
  // Mode d'affichage quand non premium
  fallback?: 'blur' | 'lock' | 'badge' | 'hide' | 'custom'
  // Composant custom a afficher si non premium
  customFallback?: ReactNode
  // Afficher juste un badge sans bloquer
  showBadgeOnly?: boolean
  // Classe additionnelle pour le wrapper
  className?: string
}

// Labels pour chaque feature
const FEATURE_LABELS: Record<PremiumFeature, string> = {
  unlimited_squads: 'Squads illimités',
  unlimited_history: 'Historique illimité',
  advanced_stats: 'Stats avancées',
  ai_coach_advanced: 'IA Coach avancé',
  hd_audio: 'Audio HD',
  advanced_roles: 'Rôles avancés',
  calendar_export: 'Export calendrier'
}

export function PremiumGate({
  children,
  feature,
  featureLabel,
  squadId,
  fallback = 'lock',
  customFallback,
  showBadgeOnly = false,
  className = ''
}: PremiumGateProps) {
  const [showModal, setShowModal] = useState(false)
  const { canAccessFeature } = usePremiumStore()

  const hasAccess = canAccessFeature(feature, squadId)
  const label = featureLabel || FEATURE_LABELS[feature]

  // Si acces autorise, afficher le contenu
  if (hasAccess) {
    return <>{children}</>
  }

  // Mode badge only - afficher le contenu avec un badge premium
  if (showBadgeOnly) {
    return (
      <div className={`relative ${className}`}>
        {children}
        <PremiumBadge small />
      </div>
    )
  }

  // Mode hide - ne rien afficher
  if (fallback === 'hide') {
    return null
  }

  // Mode custom - afficher le fallback custom
  if (fallback === 'custom' && customFallback) {
    return <>{customFallback}</>
  }

  // Mode blur - contenu floute avec overlay
  if (fallback === 'blur') {
    return (
      <div className={`relative ${className}`}>
        <div className="blur-sm pointer-events-none select-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.3)] rounded-xl">
          <button
            onClick={() => setShowModal(true)}
            aria-label={`Débloquer ${label} - Premium requis`}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[rgba(0,0,0,0.6)] hover:bg-[rgba(0,0,0,0.8)] transition-colors"
          >
            <Lock className="w-6 h-6 text-[#fbbf24]" aria-hidden="true" />
            <span className="text-[13px] font-medium text-white">
              {label}
            </span>
            <span className="text-xs text-[#5e6063]">
              Premium requis
            </span>
          </button>
        </div>
        <PremiumUpgradeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          squadId={squadId}
          feature={label}
        />
      </div>
    )
  }

  // Mode lock - carte verrouillee
  return (
    <div className={className}>
      <motion.button
        onClick={() => setShowModal(true)}
        aria-label={`Débloquer ${label} - Passe Premium pour débloquer`}
        className="w-full p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(251,191,36,0.3)] hover:bg-[rgba(251,191,36,0.05)] transition-interactive text-left"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(251,191,36,0.15)] flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#fbbf24]" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium text-[#f7f8f8]">{label}</span>
              <PremiumBadge small />
            </div>
            <span className="text-[12px] text-[#5e6063]">
              Passe Premium pour débloquer
            </span>
          </div>
          <Zap className="w-5 h-5 text-[#fbbf24]" aria-hidden="true" />
        </div>
      </motion.button>
      <PremiumUpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        squadId={squadId}
        feature={label}
      />
    </div>
  )
}

// Badge Premium reutilisable
export function PremiumBadge({ small = false }: { small?: boolean }) {
  if (small) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#fbbf24]/70 text-[9px] font-bold text-[#050506]">
        <Crown className="w-2.5 h-2.5" />
        PRO
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#fbbf24]/70 text-xs font-bold text-[#050506]">
      <Crown className="w-3.5 h-3.5" />
      PREMIUM
    </span>
  )
}

// Composant pour afficher limite de squads atteinte
export function SquadLimitReached({
  currentCount,
  maxCount,
  onUpgrade
}: {
  currentCount: number
  maxCount: number
  onUpgrade: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-gradient-to-br from-[rgba(251,191,36,0.1)] to-[rgba(251,191,36,0.02)] border border-[rgba(251,191,36,0.2)]"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(251,191,36,0.2)] flex items-center justify-center flex-shrink-0">
          <Lock className="w-5 h-5 text-[#fbbf24]" />
        </div>
        <div className="flex-1">
          <h3 className="text-[14px] font-semibold text-[#f7f8f8] mb-1">
            Limite atteinte
          </h3>
          <p className="text-[13px] text-[#8b8d90] mb-3">
            Tu as {currentCount}/{maxCount} squads. Passe Premium pour en créer plus !
          </p>
          <Button size="sm" onClick={onUpgrade} className="bg-gradient-to-r from-[#fbbf24] to-[#fbbf24]/80">
            <Zap className="w-4 h-4" />
            Passer Premium
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// Hook pour ouvrir le modal premium de n'importe ou
// eslint-disable-next-line react-refresh/only-export-components
export function usePremiumModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [modalProps, setModalProps] = useState<{
    squadId?: string
    feature?: string
  }>({})

  const openModal = (props?: { squadId?: string; feature?: string }) => {
    setModalProps(props || {})
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  const Modal = () => (
    <PremiumUpgradeModal
      isOpen={isOpen}
      onClose={closeModal}
      squadId={modalProps.squadId}
      feature={modalProps.feature}
    />
  )

  return { openModal, closeModal, Modal, isOpen }
}

export default PremiumGate
