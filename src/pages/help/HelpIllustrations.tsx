import { motion } from 'framer-motion'
import type { FAQItem } from './HelpFAQData'

function CreateSquadIllustration() {
  return (
    <svg viewBox="0 0 520 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[520px]" role="img" aria-label="Étapes pour créer une squad : cliquer plus, nommer, partager le code">
      <rect x="0" y="10" width="140" height="100" rx="16" fill="var(--color-primary-10)" stroke="var(--color-primary)" strokeWidth="1.5" />
      <circle cx="70" cy="48" r="20" fill="var(--color-primary-20)" />
      <line x1="70" y1="38" x2="70" y2="58" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="48" x2="80" y2="48" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
      <text x="70" y="90" textAnchor="middle" fill="var(--color-primary)" fontSize="11" fontWeight="600" fontFamily="system-ui">{'1. Clique "+"'}</text>
      <line x1="152" y1="55" x2="178" y2="55" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      <polygon points="178,50 188,55 178,60" fill="var(--color-primary)" />
      <rect x="190" y="10" width="140" height="100" rx="16" fill="var(--color-primary-10)" stroke="var(--color-primary)" strokeWidth="1.5" />
      <rect x="215" y="34" width="90" height="28" rx="8" fill="var(--color-primary-20)" />
      <text x="260" y="52" textAnchor="middle" fill="var(--color-primary)" fontSize="10" fontWeight="500" fontFamily="system-ui">Ma Squad</text>
      <text x="260" y="90" textAnchor="middle" fill="var(--color-primary)" fontSize="11" fontWeight="600" fontFamily="system-ui">2. Nomme-la</text>
      <line x1="342" y1="55" x2="368" y2="55" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      <polygon points="368,50 378,55 368,60" fill="var(--color-primary)" />
      <rect x="380" y="10" width="140" height="100" rx="16" fill="var(--color-success-10)" stroke="var(--color-success)" strokeWidth="1.5" />
      <rect x="410" y="30" width="80" height="26" rx="8" fill="var(--color-success-20)" />
      <text x="450" y="47" textAnchor="middle" fill="var(--color-success)" fontSize="11" fontWeight="700" fontFamily="monospace">ABC123</text>
      <circle cx="450" cy="68" r="10" fill="var(--color-success-20)" />
      <path d="M447 68 L453 65 M453 65 L453 71 M453 65 L449 63" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" />
      <text x="450" y="100" textAnchor="middle" fill="var(--color-success)" fontSize="11" fontWeight="600" fontFamily="system-ui">3. Partage le code</text>
    </svg>
  )
}

function ReliabilityScoreIllustration() {
  const cx = 130, cy = 90, r = 65
  const startAngle = Math.PI
  const arcPt = (frac: number) => {
    const a = startAngle - frac * Math.PI
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }
  }
  const arcPath = (from: number, to: number) => {
    const s = arcPt(from), e = arcPt(to)
    const largeArc = (to - from) > 0.5 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`
  }
  const pointerFrac = 0.82
  const pp = arcPt(pointerFrac)
  const ppInner = {
    x: cx + (r - 22) * Math.cos(startAngle - pointerFrac * Math.PI),
    y: cy - (r - 22) * Math.sin(startAngle - pointerFrac * Math.PI)
  }

  return (
    <svg viewBox="0 0 260 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[280px]" role="img" aria-label="Jauge de score de fiabilité : rouge 0-59, jaune 60-79, vert 80-100">
      <path d={arcPath(0, 0.59)} stroke="var(--color-error)" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d={arcPath(0.60, 0.79)} stroke="var(--color-warning)" strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d={arcPath(0.80, 1)} stroke="var(--color-success)" strokeWidth="12" strokeLinecap="round" fill="none" />
      <line x1={ppInner.x} y1={ppInner.y} x2={pp.x} y2={pp.y} stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="var(--color-primary)" />
      <text x={cx} y={cy + 20} textAnchor="middle" fill="var(--color-success)" fontSize="16" fontWeight="700" fontFamily="system-ui">82%</text>
      <text x="30" y="110" textAnchor="middle" fill="var(--color-error)" fontSize="9" fontWeight="600" fontFamily="system-ui">0-59%</text>
      <text x={cx} y="18" textAnchor="middle" fill="var(--color-warning)" fontSize="9" fontWeight="600" fontFamily="system-ui">60-79%</text>
      <text x="230" y="110" textAnchor="middle" fill="var(--color-success)" fontSize="9" fontWeight="600" fontFamily="system-ui">80-100%</text>
    </svg>
  )
}

function PlanSessionIllustration() {
  return (
    <svg viewBox="0 0 280 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[300px]" role="img" aria-label="Planifier une session : calendrier, heure et nombre de joueurs">
      <rect x="10" y="10" width="130" height="130" rx="14" fill="var(--color-primary-10)" stroke="var(--color-primary)" strokeWidth="1.5" />
      <rect x="10" y="10" width="130" height="32" rx="14" fill="var(--color-primary)" />
      <text x="75" y="31" textAnchor="middle" fill="white" fontSize="12" fontWeight="600" fontFamily="system-ui">Fevrier 2026</text>
      {[0, 1, 2, 3, 4].map(row =>
        [0, 1, 2, 3, 4, 5, 6].map(col => {
          const isSelected = row === 2 && col === 3
          const dotCx = 25 + col * 16
          const dotCy = 56 + row * 16
          return (
            <g key={`${row}-${col}`}>
              {isSelected && <circle cx={dotCx} cy={dotCy} r="7" fill="var(--color-primary)" />}
              <circle cx={dotCx} cy={dotCy} r={isSelected ? 2.5 : 2} fill={isSelected ? 'white' : 'var(--color-primary)'} opacity={isSelected ? 1 : 0.4} />
            </g>
          )
        })
      )}
      <rect x="155" y="10" width="115" height="54" rx="12" fill="var(--color-warning-10)" stroke="var(--color-warning)" strokeWidth="1.5" />
      <circle cx="180" cy="37" r="12" stroke="var(--color-warning)" strokeWidth="1.5" fill="none" />
      <line x1="180" y1="30" x2="180" y2="37" stroke="var(--color-warning)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="180" y1="37" x2="186" y2="37" stroke="var(--color-warning)" strokeWidth="1.5" strokeLinecap="round" />
      <text x="210" y="34" fill="var(--color-warning)" fontSize="11" fontWeight="700" fontFamily="system-ui">21:00</text>
      <text x="210" y="46" fill="var(--color-warning)" fontSize="8" fontWeight="500" fontFamily="system-ui" opacity="0.8">Heure</text>
      <rect x="155" y="74" width="115" height="66" rx="12" fill="var(--color-success-10)" stroke="var(--color-success)" strokeWidth="1.5" />
      {[0, 1, 2, 3, 4].map(i => (
        <g key={i}>
          <circle cx={177 + i * 18} cy={100} r="8" fill={i < 3 ? 'var(--color-success-20)' : 'var(--color-success-10)'} stroke="var(--color-success)" strokeWidth="1" strokeDasharray={i < 3 ? 'none' : '2 2'} />
          <circle cx={177 + i * 18} cy={97} r="3" fill={i < 3 ? 'var(--color-success)' : 'none'} stroke={i < 3 ? 'none' : 'var(--color-success)'} strokeWidth="0.8" strokeDasharray={i < 3 ? 'none' : '2 2'} />
        </g>
      ))}
      <text x="212" y="126" textAnchor="middle" fill="var(--color-success)" fontSize="10" fontWeight="600" fontFamily="system-ui">3 / 5 joueurs</text>
    </svg>
  )
}

function JoinVoiceIllustration() {
  return (
    <svg viewBox="0 0 480 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[480px]" role="img" aria-label="Rejoindre une party vocale : cliquer Rejoindre, autoriser le micro, connecté">
      <rect x="0" y="8" width="140" height="94" rx="16" fill="var(--color-primary-10)" stroke="var(--color-primary)" strokeWidth="1.5" />
      <rect x="30" y="28" width="80" height="30" rx="10" fill="var(--color-primary)" />
      <text x="70" y="48" textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="system-ui">Rejoindre</text>
      <text x="70" y="82" textAnchor="middle" fill="var(--color-primary)" fontSize="10" fontWeight="600" fontFamily="system-ui">1. Clique ici</text>
      <line x1="150" y1="52" x2="176" y2="52" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      <polygon points="176,47 186,52 176,57" fill="var(--color-primary)" />
      <rect x="188" y="8" width="140" height="94" rx="16" fill="var(--color-warning-10)" stroke="var(--color-warning)" strokeWidth="1.5" />
      <rect x="250" y="22" width="16" height="24" rx="8" stroke="var(--color-warning)" strokeWidth="2" fill="var(--color-warning-20)" />
      <path d="M244 40 Q244 54 258 54 Q272 54 272 40" stroke="var(--color-warning)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="258" y1="54" x2="258" y2="60" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" />
      <text x="258" y="82" textAnchor="middle" fill="var(--color-warning)" fontSize="10" fontWeight="600" fontFamily="system-ui">2. Autorise le micro</text>
      <line x1="338" y1="52" x2="354" y2="52" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" />
      <polygon points="354,47 364,52 354,57" fill="var(--color-warning)" />
      <rect x="366" y="8" width="112" height="94" rx="16" fill="var(--color-success-10)" stroke="var(--color-success)" strokeWidth="1.5" />
      <circle cx="422" cy="42" r="16" fill="var(--color-success-20)" stroke="var(--color-success)" strokeWidth="1.5" />
      <polyline points="414,42 419,47 430,36" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="422" y="78" textAnchor="middle" fill="var(--color-success)" fontSize="10" fontWeight="600" fontFamily="system-ui">3. Connecté !</text>
    </svg>
  )
}

export function FAQIllustration({ type }: { type: FAQItem['illustration'] }) {
  if (!type) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="mt-4 p-4 rounded-xl bg-surface-card border border-border-default flex justify-center"
    >
      {type === 'create-squad' && <CreateSquadIllustration />}
      {type === 'reliability-score' && <ReliabilityScoreIllustration />}
      {type === 'plan-session' && <PlanSessionIllustration />}
      {type === 'join-voice' && <JoinVoiceIllustration />}
    </motion.div>
  )
}
