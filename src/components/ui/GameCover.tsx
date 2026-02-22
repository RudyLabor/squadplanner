/**
 * Composant GameCover - Affiche l'image de couverture d'un jeu
 * Utilise des images statiques pour les jeux populaires avec un fallback gradient
 */

import { useState } from 'react'
import {
  getGameImageUrl,
  getGameGradient,
  getGameInitial,
  hasGameImage,
} from '../../utils/gameImages'

interface GameCoverProps {
  /** Nom du jeu */
  gameName: string
  /** Taille du composant */
  size?: 'sm' | 'md' | 'lg'
  /** Classes CSS additionnelles */
  className?: string
}

const SIZE_CLASSES = {
  sm: 'w-16 h-16 text-lg',
  md: 'w-24 h-24 text-2xl',
  lg: 'w-32 h-32 text-3xl',
}

/**
 * Composant d'image de couverture de jeu avec fallback gradient
 */
export function GameCover({ gameName, size = 'md', className = '' }: GameCoverProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const imageUrl = getGameImageUrl(gameName)
  const hasImage = hasGameImage(gameName) && !imageError
  const gradient = getGameGradient(gameName)
  const initial = getGameInitial(gameName)

  const sizeClass = SIZE_CLASSES[size]

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${sizeClass} ${className}`}
      style={{
        background: hasImage ? undefined : gradient,
      }}
    >
      {/* Image de couverture si disponible */}
      {hasImage && imageUrl && (
        <>
          {/* Placeholder flou pendant le chargement */}
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse" style={{ background: gradient }} />
          )}

          {/* Image principale */}
          <img
            src={imageUrl}
            alt={`${gameName} cover`}
            loading="lazy"
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true)
              setImageLoaded(false)
            }}
          />
        </>
      )}

      {/* Fallback avec initiale si pas d'image */}
      {!hasImage && (
        <div className="flex h-full w-full items-center justify-center font-bold text-white">
          {initial}
        </div>
      )}

      {/* Overlay avec le nom du jeu au hover */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 transition-opacity duration-200 hover:opacity-100">
        <span className="px-2 text-center text-xs font-medium text-white">{gameName}</span>
      </div>
    </div>
  )
}

/**
 * Variante compacte pour les listes
 */
export function GameCoverCompact({
  gameName,
  className = '',
}: {
  gameName: string
  className?: string
}) {
  return <GameCover gameName={gameName} size="sm" className={className} />
}

/**
 * Variante large pour les headers
 */
export function GameCoverLarge({
  gameName,
  className = '',
}: {
  gameName: string
  className?: string
}) {
  return <GameCover gameName={gameName} size="lg" className={className} />
}

export default GameCover
