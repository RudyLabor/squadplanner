/**
 * Phase 4.1.4 — Location Share
 * "Je suis la" button + location message display
 */
import { useState, memo } from 'react'
import { MapPin, ExternalLink, Loader2 } from './icons'
interface LocationShareButtonProps {
  onShare: (lat: number, lng: number) => void
  disabled?: boolean
}

export const LocationShareButton = memo(function LocationShareButton({ onShare, disabled }: LocationShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleShare = async () => {
    if (!('geolocation' in navigator)) {
      alert('La géolocalisation n\'est pas supportée par ton navigateur.')
      return
    }

    setIsLoading(true)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      onShare(position.coords.latitude, position.coords.longitude)
    } catch (err) {
      const error = err as GeolocationPositionError
      if (error.code === error.PERMISSION_DENIED) {
        alert('Autorise l\'accès à ta position dans les paramètres du navigateur.')
      } else {
        alert('Impossible de récupérer ta position. Réessaie.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={disabled || isLoading}
      className="p-2.5 rounded-xl text-text-quaternary hover:text-primary-hover hover:bg-primary-10 transition-colors disabled:opacity-50"
      aria-label="Partager ma position"
      title="Je suis la"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <MapPin className="w-5 h-5" />
      )}
    </button>
  )
})

/**
 * Parse a location message and return coordinates
 */
export function isLocationMessage(content: string): boolean {
  return content.startsWith('[location:')
}

export function parseLocationMessage(content: string): { lat: number; lng: number } | null {
  const match = content.match(/\[location:([-\d.]+),([-\d.]+)\]/)
  if (!match) return null
  return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
}

/**
 * Display component for location messages
 */
interface LocationMessageProps {
  lat: number
  lng: number
  isOwn?: boolean
}

export const LocationMessage = memo(function LocationMessage({ lat, lng, isOwn = false }: LocationMessageProps) {
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`

  return (
    <div className={`rounded-xl overflow-hidden max-w-[280px] ${
      isOwn ? 'bg-border-hover' : 'bg-primary-10'
    }`}>
      {/* Static map placeholder (Google Maps API key needed for real image) */}
      <div className={`w-full h-[120px] flex items-center justify-center ${
        isOwn ? 'bg-border-subtle' : 'bg-primary-5'
      }`}>
        <div className="text-center">
          <MapPin className={`w-8 h-8 mx-auto mb-1 ${isOwn ? 'text-text-tertiary' : 'text-primary-hover'}`} />
          <p className={`text-sm ${isOwn ? 'text-text-quaternary' : 'text-text-quaternary'}`}>
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Open in Maps link */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ouvrir la position dans Google Maps"
        className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${
          isOwn
            ? 'text-text-secondary hover:text-text-primary hover:bg-border-subtle'
            : 'text-primary-hover hover:text-primary-hover hover:bg-primary-5'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <MapPin className="w-4 h-4" />
        <span className="text-base font-medium flex-1">Je suis la</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
      </a>
    </div>
  )
})
