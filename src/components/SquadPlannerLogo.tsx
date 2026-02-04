interface LogoProps {
  size?: number
  className?: string
}

// Logo unifié avec lignes de connexion (4 membres connectés + hub central)
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
        stroke="#5e6dd2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />
      {/* Lignes diagonales vers le centre */}
      <path
        d="M8 8 L16 16 M24 8 L16 16 M8 24 L16 16 M24 24 L16 16"
        stroke="#8b93ff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* 4 membres de la squad aux coins */}
      <circle cx="8" cy="8" r="3.5" fill="#5e6dd2" />
      <circle cx="24" cy="8" r="3.5" fill="#8b93ff" />
      <circle cx="8" cy="24" r="3.5" fill="#8b93ff" />
      <circle cx="24" cy="24" r="3.5" fill="#4ade80" />
      {/* Hub central (coordination) */}
      <circle cx="16" cy="16" r="3.5" fill="#5e6dd2" />
    </svg>
  )
}

// Alias pour compatibilité
export const SquadPlannerIcon = SquadPlannerLogo
