import type { SVGProps } from 'react'

export type NavIconProps = SVGProps<SVGSVGElement> & {
  className?: string
}

/**
 * Gaming-oriented custom SVG icons for main navigation
 * Features: thicker strokes (2.5px), slightly rounded, distinctive style
 */

// NavHome - Joystick/Controller shape (gaming feel)
export const NavHome = ({ className, ...props }: NavIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
    {...props}
  >
    {/* D-pad style home icon */}
    <circle cx="8" cy="10" r="2.5" />
    <path d="M8 5v3" />
    <path d="M8 15v3" />
    <path d="M5 10h3" />
    <path d="M11 10h3" />
    {/* Main button */}
    <circle cx="16" cy="14" r="3" />
  </svg>
)

// NavSquads - Shield with people (squad protection/unity)
export const NavSquads = ({ className, ...props }: NavIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
    {...props}
  >
    {/* Shield background */}
    <path d="M12 2L4 6v5c0 5 8 9 8 9s8-4 8-9V6l-8-4z" />
    {/* People silhouettes inside shield */}
    <circle cx="9" cy="11" r="1.5" />
    <circle cx="15" cy="11" r="1.5" />
    <path d="M9 13c-1 0-1.5 0.5-1.5 1.5M15 13c1 0 1.5 0.5 1.5 1.5" />
    <circle cx="12" cy="8" r="1.5" />
  </svg>
)

// NavSessions - Calendar with play button (schedule + gaming)
export const NavSessions = ({ className, ...props }: NavIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
    {...props}
  >
    {/* Calendar grid */}
    <rect x="3" y="4" width="16" height="16" rx="2" />
    <path d="M7 4V2M17 4V2M3 10h16" />
    {/* Play button overlay */}
    <path d="M13 14l-3-2v4l3-2z" fill="currentColor" />
    <circle cx="12" cy="14" r="2.5" fill="none" />
  </svg>
)

// NavParty - Headset with sound waves (communication/gaming)
export const NavParty = ({ className, ...props }: NavIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
    {...props}
  >
    {/* Headset band */}
    <path d="M6 8c0-2.5 1-4 6-4s6 1.5 6 4" />
    {/* Left ear cup */}
    <circle cx="6" cy="12" r="2.5" />
    {/* Right ear cup */}
    <circle cx="18" cy="12" r="2.5" />
    {/* Microphone boom */}
    <path d="M18 12v3c0 1.5-1 2-2 2" />
    {/* Sound waves */}
    <path d="M21 10.5c0 .5-.5 1-1 1" />
    <path d="M22 8c0 1.5-1 3-2 3" />
  </svg>
)

// NavMessages - Chat bubble with animated dots (messaging)
export const NavMessages = ({ className, ...props }: NavIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
    {...props}
  >
    {/* Chat bubble main */}
    <path d="M3 20.5l1-3.5a2 2 0 0 0-1-2.2C2.5 13.5 2 11.5 2 9c0-5 2-7 10-7s10 2 10 7-2 7-10 7c-1.5 0-3-.3-4.2-1l-4.1 1.5z" />
    {/* Typing dots */}
    <circle cx="8" cy="10" r="1" fill="currentColor" />
    <circle cx="12" cy="10" r="1" fill="currentColor" />
    <circle cx="16" cy="10" r="1" fill="currentColor" />
  </svg>
)
