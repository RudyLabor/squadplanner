import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff } from 'lucide-react'
import { useNetworkQualityStore, QUALITY_INFO, type NetworkQualityLevel } from '../hooks/useNetworkQuality'
import { Tooltip } from './ui/Tooltip'

interface NetworkQualityIndicatorProps {
  /**
   * Taille de l'indicateur
   * - 'sm': 16px de hauteur, compact
   * - 'md': 24px de hauteur, standard
   * - 'lg': 32px de hauteur, grand
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Afficher le label texte de la qualité
   */
  showLabel?: boolean

  /**
   * Afficher une tooltip au survol
   */
  showTooltip?: boolean

  /**
   * Forcer un niveau de qualité (pour preview/tests)
   */
  forceQuality?: NetworkQualityLevel

  /**
   * Classes CSS additionnelles
   */
  className?: string
}

// Dimensions selon la taille
const SIZES = {
  sm: {
    containerHeight: 16,
    barWidth: 3,
    barGap: 2,
    barHeights: [4, 7, 10, 14],
    iconSize: 12,
    textSize: 'text-xs',
  },
  md: {
    containerHeight: 24,
    barWidth: 4,
    barGap: 2,
    barHeights: [6, 10, 14, 20],
    iconSize: 16,
    textSize: 'text-xs',
  },
  lg: {
    containerHeight: 32,
    barWidth: 5,
    barGap: 3,
    barHeights: [8, 14, 20, 28],
    iconSize: 20,
    textSize: 'text-[13px]',
  },
}

/**
 * Indicateur visuel de la qualité de connexion réseau
 * Affiche des barres de signal comme sur un téléphone
 */
export function NetworkQualityIndicator({
  size = 'md',
  showLabel = false,
  showTooltip = true,
  forceQuality,
  className = '',
}: NetworkQualityIndicatorProps) {
  const { localQuality } = useNetworkQualityStore()
  const quality = forceQuality ?? localQuality
  const info = QUALITY_INFO[quality]
  const sizeConfig = SIZES[size]

  // Si qualité inconnue, afficher une icône Wifi avec un point d'interrogation
  if (quality === 'unknown') {
    const unknownContent = (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Wifi
          style={{ width: sizeConfig.iconSize, height: sizeConfig.iconSize }}
          className="text-text-tertiary animate-pulse"
        />
        {showLabel && (
          <span className={`${sizeConfig.textSize} text-text-tertiary`}>
            {info.label}
          </span>
        )}
      </div>
    )

    if (showTooltip) {
      return (
        <Tooltip content={info.description} position="bottom" delay={300}>
          {unknownContent}
        </Tooltip>
      )
    }
    return unknownContent
  }

  const activeBars = info.bars

  const indicatorContent = (
    <motion.div
      className={`flex items-center gap-2 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Barres de signal */}
      <div
        className="flex items-end"
        style={{
          gap: sizeConfig.barGap,
          height: sizeConfig.containerHeight,
        }}
      >
        {sizeConfig.barHeights.map((height, index) => {
          const isActive = index < activeBars

          return (
            <motion.div
              key={index}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              style={{
                width: sizeConfig.barWidth,
                height: height,
                backgroundColor: isActive ? info.color : 'var(--color-inactive-bar)',
                borderRadius: sizeConfig.barWidth / 2,
                originY: 1, // Scale from bottom
              }}
            />
          )
        })}
      </div>

      {/* Label texte */}
      {showLabel && (
        <span
          className={`${sizeConfig.textSize} font-medium`}
          style={{ color: info.color }}
        >
          {info.label}
        </span>
      )}
    </motion.div>
  )

  if (showTooltip) {
    return (
      <Tooltip content={info.description} position="bottom" delay={300}>
        {indicatorContent}
      </Tooltip>
    )
  }

  return indicatorContent
}

/**
 * Version compacte avec badge
 * Utile pour afficher dans un header ou une barre d'état
 */
export function NetworkQualityBadge({
  className = '',
}: {
  className?: string
}) {
  const { localQuality } = useNetworkQualityStore()
  const info = QUALITY_INFO[localQuality]

  return (
    <motion.div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${className}`}
      style={{
        backgroundColor: `${info.color}15`,
        borderWidth: 1,
        borderColor: `${info.color}30`,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <NetworkQualityIndicator size="sm" showLabel={false} showTooltip={false} />
      <span
        className="text-[12px] font-medium"
        style={{ color: info.color }}
      >
        {info.label}
      </span>
    </motion.div>
  )
}

/**
 * Toast de notification de changement de qualité
 */
interface QualityChangeToastProps {
  isVisible: boolean
  newQuality: NetworkQualityLevel
  onClose: () => void
}

export function QualityChangeToast({
  isVisible,
  newQuality,
  onClose,
}: QualityChangeToastProps) {
  const info = QUALITY_INFO[newQuality]
  const isImproving = newQuality === 'excellent' || newQuality === 'good'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          onAnimationComplete={() => {
            // Auto-close after 3 seconds
            setTimeout(onClose, 3000)
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
            style={{
              backgroundColor: `${info.color}15`,
              borderWidth: 1,
              borderColor: `${info.color}40`,
            }}
          >
            {/* Icone */}
            {newQuality === 'poor' ? (
              <WifiOff style={{ color: info.color }} className="w-5 h-5" />
            ) : (
              <NetworkQualityIndicator
                size="sm"
                forceQuality={newQuality}
                showTooltip={false}
              />
            )}

            {/* Message */}
            <div className="flex flex-col">
              <span className="text-[14px] font-medium text-text-primary">
                {isImproving ? 'Connexion amelioree' : 'Connexion degradee'}
              </span>
              <span className="text-[12px]" style={{ color: info.color }}>
                {info.description}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default NetworkQualityIndicator
