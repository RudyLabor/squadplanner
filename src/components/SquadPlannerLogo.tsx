interface LogoProps {
  size?: number
  className?: string
}

// Logo unifié avec lignes de connexion (4 membres connectés + hub central)
// Traits fins et élégants
export function SquadPlannerLogo({ size = 24, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Lignes de connexion (carré) */}
      <path
        d="M8 8 L24 8 L24 24 L8 24 Z"
        stroke="var(--color-logo-primary)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />
      {/* Lignes diagonales vers le centre */}
      <path
        d="M8 8 L16 16 M24 8 L16 16 M8 24 L16 16 M24 24 L16 16"
        stroke="var(--color-logo-accent)"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* 4 membres de la squad aux coins */}
      <circle cx="8" cy="8" r="2.5" fill="var(--color-logo-primary)" />
      <circle cx="24" cy="8" r="2.5" fill="var(--color-logo-accent)" />
      <circle cx="8" cy="24" r="2.5" fill="var(--color-logo-accent)" />
      <circle cx="24" cy="24" r="2.5" fill="var(--color-logo-green)" />
      {/* Hub central (coordination) */}
      <circle cx="16" cy="16" r="2.5" fill="var(--color-logo-green)" />
    </svg>
  )
}

// Alias pour compatibilité
export const SquadPlannerIcon = SquadPlannerLogo
