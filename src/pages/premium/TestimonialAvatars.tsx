export function TestimonialAvatar({ type }: { type: 'alex' | 'marie' | 'lucas' }) {
  if (type === 'alex') {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Avatar AlexGaming" className="flex-shrink-0">
        <defs>
          <linearGradient id="alexBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#a855f7" /></linearGradient>
          <linearGradient id="alexSkin" x1="16" y1="12" x2="32" y2="38" gradientUnits="userSpaceOnUse"><stop stopColor="#F5D0B0" /><stop offset="1" stopColor="#E8B896" /></linearGradient>
        </defs>
        <circle cx="24" cy="24" r="24" fill="url(#alexBg)" />
        <rect x="19" y="30" width="10" height="6" rx="2" fill="url(#alexSkin)" />
        <path d="M10 48 C10 39 16 35 24 35 C32 35 38 39 38 48" fill="#4F46E5" />
        <path d="M18 35 L24 38 L30 35" stroke="#6366f1" strokeWidth="1" fill="none" opacity="0.6" />
        <ellipse cx="24" cy="22" rx="10" ry="11" fill="url(#alexSkin)" />
        <path d="M14 19 C14 12 18 8 24 8 C30 8 34 12 34 19 C34 16 31 11 24 11 C17 11 14 16 14 19Z" fill="#3B2510" />
        <path d="M14 19 C14 17 15 14 18 13 C16 16 15 18 15 20Z" fill="#3B2510" />
        <path d="M26 9 C29 9 33 11 34 16 C33 13 30 10 26 10Z" fill="#4A3420" />
        <ellipse cx="20" cy="22" rx="1.8" ry="2" fill="#2D1B0E" /><ellipse cx="28" cy="22" rx="1.8" ry="2" fill="#2D1B0E" />
        <circle cx="20.6" cy="21.4" r="0.6" fill="white" opacity="0.8" /><circle cx="28.6" cy="21.4" r="0.6" fill="white" opacity="0.8" />
        <path d="M17.5 19.5 L22 18.5" stroke="#3B2510" strokeWidth="1.2" strokeLinecap="round" /><path d="M26 18.5 L30.5 19.5" stroke="#3B2510" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M24 23 L23.2 26 L24.8 26" stroke="#D4A87A" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        <path d="M21 28.5 C22.5 30 25.5 30 27 28.5" stroke="#C4917A" strokeWidth="1" strokeLinecap="round" fill="none" />
        <path d="M12 32 C12 28 14 27 16 28" stroke="#555" strokeWidth="2.5" strokeLinecap="round" fill="none" /><path d="M36 32 C36 28 34 27 32 28" stroke="#555" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M16 28 C16 34 17 35 19 35" stroke="#555" strokeWidth="2" strokeLinecap="round" fill="none" /><path d="M32 28 C32 34 31 35 29 35" stroke="#555" strokeWidth="2" strokeLinecap="round" fill="none" />
        <rect x="10" y="30" width="5" height="4" rx="2" fill="#444" /><rect x="33" y="30" width="5" height="4" rx="2" fill="#444" />
      </svg>
    )
  }
  if (type === 'marie') {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Avatar MarieGG" className="flex-shrink-0">
        <defs>
          <linearGradient id="marieBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#EC4899" /><stop offset="1" stopColor="#a855f7" /></linearGradient>
          <linearGradient id="marieSkin" x1="16" y1="12" x2="32" y2="38" gradientUnits="userSpaceOnUse"><stop stopColor="#FDE1C8" /><stop offset="1" stopColor="#F0C9A8" /></linearGradient>
          <linearGradient id="marieHair" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#2A1506" /><stop offset="1" stopColor="#4A2810" /></linearGradient>
        </defs>
        <circle cx="24" cy="24" r="24" fill="url(#marieBg)" />
        <path d="M12 18 C12 10 17 6 24 6 C31 6 36 10 36 18 L37 36 C37 38 35 38 34 36 L34 22 L14 22 L14 36 C14 38 12 38 11 36Z" fill="url(#marieHair)" />
        <path d="M11 22 L11 40 C11 42 13 41 14 38 L14 22Z" fill="url(#marieHair)" /><path d="M37 22 L37 40 C37 42 35 41 34 38 L34 22Z" fill="url(#marieHair)" />
        <rect x="20" y="30" width="8" height="6" rx="2" fill="url(#marieSkin)" />
        <path d="M10 48 C10 39 16 35 24 35 C32 35 38 39 38 48" fill="#7C3AED" />
        <path d="M20 35 L24 37 L28 35" stroke="#9333EA" strokeWidth="0.8" fill="none" opacity="0.5" />
        <ellipse cx="24" cy="22" rx="10" ry="11" fill="url(#marieSkin)" />
        <path d="M14 18 C14 11 18 7 24 7 C30 7 34 11 34 18 C34 15 31 11 24 11 C17 11 14 15 14 18Z" fill="url(#marieHair)" />
        <path d="M14 18 C14 15 13 13 15 12 C14 15 14 17 15 19Z" fill="url(#marieHair)" /><path d="M34 18 C34 15 35 13 33 12 C34 15 34 17 33 19Z" fill="url(#marieHair)" />
        <path d="M14 20 C12 22 11 28 12 34" stroke="#3A1A08" strokeWidth="3" strokeLinecap="round" fill="none" /><path d="M34 20 C36 22 37 28 36 34" stroke="#3A1A08" strokeWidth="3" strokeLinecap="round" fill="none" />
        <ellipse cx="20" cy="22" rx="2" ry="2.2" fill="#2D1B0E" /><ellipse cx="28" cy="22" rx="2" ry="2.2" fill="#2D1B0E" />
        <circle cx="20.7" cy="21.3" r="0.7" fill="white" opacity="0.85" /><circle cx="28.7" cy="21.3" r="0.7" fill="white" opacity="0.85" />
        <path d="M17.5 20.5 C18 19.8 19 19.5 20 19.8" stroke="#2D1B0E" strokeWidth="0.7" strokeLinecap="round" fill="none" /><path d="M26 19.8 C27 19.5 28 19.8 28.5 20.5" stroke="#2D1B0E" strokeWidth="0.7" strokeLinecap="round" fill="none" />
        <path d="M17.5 19 C18.5 18 21 18 22 18.5" stroke="#3A1A08" strokeWidth="0.9" strokeLinecap="round" fill="none" /><path d="M26 18.5 C27 18 29.5 18 30.5 19" stroke="#3A1A08" strokeWidth="0.9" strokeLinecap="round" fill="none" />
        <path d="M24 23.5 L23.5 26 L24.5 26" stroke="#DEB08A" strokeWidth="0.7" strokeLinecap="round" fill="none" />
        <path d="M21 28 C22 29.5 26 29.5 27 28" stroke="#D09A7E" strokeWidth="1" strokeLinecap="round" fill="none" />
        <circle cx="13" cy="24" r="1.8" fill="#E5E7EB" /><circle cx="13" cy="24" r="1" fill="#9CA3AF" /><path d="M14.5 24 L16 23" stroke="#D1D5DB" strokeWidth="0.8" strokeLinecap="round" />
        <circle cx="35" cy="24" r="1.8" fill="#E5E7EB" /><circle cx="35" cy="24" r="1" fill="#9CA3AF" /><path d="M33.5 24 L32 23" stroke="#D1D5DB" strokeWidth="0.8" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Avatar LucasApex" className="flex-shrink-0">
      <defs>
        <linearGradient id="lucasBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#F59E0B" /><stop offset="1" stopColor="#EF4444" /></linearGradient>
        <linearGradient id="lucasSkin" x1="16" y1="12" x2="32" y2="38" gradientUnits="userSpaceOnUse"><stop stopColor="#E8C49C" /><stop offset="1" stopColor="#D4A878" /></linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#lucasBg)" />
      <rect x="19" y="30" width="10" height="6" rx="2" fill="url(#lucasSkin)" />
      <path d="M10 48 C10 39 16 35 24 35 C32 35 38 39 38 48" fill="#374151" />
      <path d="M22 36 L22 40" stroke="#9CA3AF" strokeWidth="0.7" strokeLinecap="round" /><path d="M26 36 L26 40" stroke="#9CA3AF" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M18 36 C20 38 28 38 30 36" stroke="#4B5563" strokeWidth="1.5" fill="none" />
      <ellipse cx="24" cy="23" rx="10" ry="11" fill="url(#lucasSkin)" />
      <path d="M13 19 C13 11 17 7 24 7 C31 7 35 11 35 19 L35 17 C35 17 34 14 24 14 C14 14 13 17 13 17Z" fill="#1F2937" />
      <rect x="12" y="16" width="24" height="4" rx="2" fill="#374151" /><path d="M12 18 L36 18" stroke="#4B5563" strokeWidth="0.8" />
      <path d="M14 17 C16 16.5 20 16 24 16 C28 16 32 16.5 34 17" stroke="#4B5563" strokeWidth="0.6" fill="none" />
      <path d="M14 19 C14 19 15 20 16 19.5" stroke="#6B4226" strokeWidth="1.5" strokeLinecap="round" fill="none" /><path d="M34 19 C34 19 33 20 32 19.5" stroke="#6B4226" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <ellipse cx="20" cy="23" rx="1.8" ry="2" fill="#2D1B0E" /><ellipse cx="28" cy="23" rx="1.8" ry="2" fill="#2D1B0E" />
      <circle cx="20.6" cy="22.4" r="0.6" fill="white" opacity="0.8" /><circle cx="28.6" cy="22.4" r="0.6" fill="white" opacity="0.8" />
      <path d="M17.5 20.5 L22 20" stroke="#5C3A1E" strokeWidth="1.1" strokeLinecap="round" /><path d="M26 20 L30.5 20.5" stroke="#5C3A1E" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M24 24 L23 27 L25 27" stroke="#C4976A" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M20.5 29 C22 30.5 26 30.5 27.5 29" stroke="#B8876A" strokeWidth="1" strokeLinecap="round" fill="none" />
      {[18, 19.5, 21, 27, 28.5, 30].map((cx, i) => <circle key={i} cx={cx} cy={29 + (i % 3) * 1} r="0.35" fill="#8B6040" opacity="0.4" />)}
      {[22.5, 25.5, 24, 19, 29].map((cx, i) => <circle key={`s${i}`} cx={cx} cy={31 + (i > 2 ? 0 : 0.5)} r="0.3" fill="#8B6040" opacity="0.3" />)}
    </svg>
  )
}
