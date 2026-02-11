import type { IconProps } from './types'
import { d } from './types'

export const ArrowLeft = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
)

export const ArrowRight = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
)

export const ArrowUp = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </svg>
)

export const ArrowDown = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="m19 12-7 7-7-7" />
    <path d="M12 5v14" />
  </svg>
)

export const ArrowUpRight = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
)

export const ChevronDown = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const ChevronLeft = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)

export const ChevronRight = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export const Compass = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" />
    <circle cx="12" cy="12" r="10" />
  </svg>
)

export const CornerUpRight = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="m15 14 5-5-5-5" />
    <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
  </svg>
)

export const ExternalLink = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
)

export const Forward = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="m15 17 5-5-5-5" />
    <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
  </svg>
)

export const Home = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
)

export const LayoutGrid = (p: IconProps) => (
  <svg {...d} {...p}>
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
)

export const LogIn = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="m10 17 5-5-5-5" />
    <path d="M15 12H3" />
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
  </svg>
)

export const LogOut = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  </svg>
)

export const Menu = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="M4 5h16" />
    <path d="M4 12h16" />
    <path d="M4 19h16" />
  </svg>
)

export const Reply = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    <path d="m9 17-5-5 5-5" />
  </svg>
)

export const Search = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="m21 21-4.34-4.34" />
    <circle cx="11" cy="11" r="8" />
  </svg>
)

export const SearchX = (p: IconProps) => (
  <svg {...d} {...p}>
    <path d="m13.5 8.5-5 5" />
    <path d="m8.5 8.5 5 5" />
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

export const ZoomIn = (p: IconProps) => (
  <svg {...d} {...p}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" x2="16.65" y1="21" y2="16.65" />
    <line x1="11" x2="11" y1="8" y2="14" />
    <line x1="8" x2="14" y1="11" y2="11" />
  </svg>
)

export const ZoomOut = (p: IconProps) => (
  <svg {...d} {...p}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" x2="16.65" y1="21" y2="16.65" />
    <line x1="8" x2="14" y1="11" y2="11" />
  </svg>
)
