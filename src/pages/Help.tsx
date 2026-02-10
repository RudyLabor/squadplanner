import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle, ChevronDown, Search, ArrowLeft, Mail, Send, CheckCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, Select } from '../components/ui'
import { MobilePageHeader } from '../components/layout/MobilePageHeader'
import { ScrollProgress } from '../components/ui/ScrollProgress'
import { useStatePersistence } from '../hooks/useStatePersistence'
import { useHashNavigation } from '../hooks/useHashNavigation'
import { HelpChatbot } from '../components/HelpChatbot'

interface FAQItem {
  question: string
  answer: string
  category: string
  illustration?: 'create-squad' | 'reliability-score' | 'plan-session' | 'join-voice'
}

const FAQ_ITEMS: FAQItem[] = [
  // Getting Started
  {
    category: 'Démarrage',
    question: "Comment créer ma première squad ?",
    answer: "Va dans l'onglet Squads et clique sur 'Créer une squad'. Donne-lui un nom, choisis ton jeu principal, et c'est parti ! Tu recevras un code d'invitation unique à partager avec tes potes. Tu peux aussi ajouter une description et une image pour personnaliser ta squad et la rendre reconnaissable.",
    illustration: 'create-squad'
  },
  {
    category: 'Démarrage',
    question: "Comment inviter des amis dans ma squad ?",
    answer: "Dans ta squad, tu trouveras un code d'invitation unique (ex: ABC123). Partage ce code à tes amis, ils pourront le coller dans 'Rejoindre une squad' pour te rejoindre. Le code ne change pas sauf si tu le régénères manuellement depuis les paramètres de la squad. Tu peux aussi copier le lien d'invitation directement pour le partager sur Discord ou WhatsApp."
  },
  {
    category: 'Démarrage',
    question: "C'est quoi le score de fiabilité ?",
    answer: "Ton score de fiabilité (0-100%) montre à quel point tu es régulier. Quand tu confirmes ta présence à une session et que tu te pointes vraiment, ton score augmente. Si tu ghost ta squad, il baisse. Un score élevé = ta squad peut compter sur toi ! Le coach IA utilise aussi ce score pour prédire la probabilité qu'une session se lance.",
    illustration: 'reliability-score'
  },

  // Sessions
  {
    category: 'Sessions',
    question: "Comment planifier une session ?",
    answer: "Dans une squad, clique sur 'Planifier une session'. Choisis la date, l'heure, et le nombre minimum de joueurs requis. Les membres de ta squad recevront une notification pour confirmer leur présence. Tu peux aussi ajouter des notes (par exemple le mode de jeu ou la map) pour que tout le monde soit au courant du programme.",
    illustration: 'plan-session'
  },
  {
    category: 'Sessions',
    question: "Quand une session est-elle confirmée ?",
    answer: "Une session passe en 'confirmée' automatiquement quand le nombre minimum de joueurs (que tu as défini) ont répondu 'Présent'. Par défaut c'est 3 joueurs, mais tu peux ajuster ce seuil à la création de la session. Tu verras une jauge de progression en temps réel qui indique combien de joueurs manquent encore."
  },
  {
    category: 'Sessions',
    question: "Je peux changer ma réponse après avoir RSVP ?",
    answer: "Oui ! Tu peux modifier ta réponse à tout moment avant le début de la session. Mais attention, changer à la dernière minute (moins de 30 minutes avant le début) peut affecter ton score de fiabilité. Pour modifier, retourne simplement sur la session et clique sur ton nouveau statut."
  },

  // Party Vocale
  {
    category: 'Party Vocale',
    question: "Comment rejoindre une party vocale ?",
    answer: "Va dans l'onglet Party ou clique sur 'Rejoindre' sur n'importe quelle squad. Assure-toi d'autoriser l'accès à ton micro quand le navigateur te le demande. Une fois connecté, tu peux te mute/unmute avec le bouton micro, et régler le volume de chaque participant individuellement.",
    illustration: 'join-voice'
  },
  {
    category: 'Party Vocale',
    question: "Ma voix ne passe pas, que faire ?",
    answer: "Voici les étapes à suivre dans l'ordre : 1) Vérifie que ton micro n'est pas muté dans l'app. 2) Va dans Paramètres > Audio et sélectionne le bon périphérique micro. 3) Vérifie les permissions de ton navigateur (clique sur l'icône cadenas dans la barre d'adresse). 4) Essaie un autre navigateur (Chrome est recommandé pour la meilleure compatibilité). Si le problème persiste, redémarre ton navigateur ou essaie en navigation privée."
  },
  {
    category: 'Party Vocale',
    question: "Combien de personnes peuvent rejoindre une party ?",
    answer: "En version gratuite, jusqu'à 8 personnes par party vocale. Avec Premium, tu peux avoir jusqu'à 15 personnes en audio HD. La qualité audio s'adapte automatiquement en fonction de ta connexion pour garantir une expérience fluide sans coupures."
  },

  // Premium
  {
    category: 'Premium',
    question: "Quels sont les avantages Premium ?",
    answer: "Squads illimitées, stats avancées avec prédictions IA, audio HD pour les parties vocales, historique illimité, rôles personnalisés, et badge Premium visible par ta squad. Tu bénéficies aussi d'un accès prioritaire aux nouvelles fonctionnalités et d'un export calendrier pour synchroniser tes sessions avec Google Calendar ou iCal."
  },
  {
    category: 'Premium',
    question: "Je peux annuler mon abonnement ?",
    answer: "Oui, à tout moment depuis ton Profil > Gérer l'abonnement. Tu garderas l'accès Premium jusqu'à la fin de ta période payée, sans frais supplémentaires. Le processus d'annulation prend moins de 30 secondes et tu peux te réabonner quand tu veux."
  },
  {
    category: 'Premium',
    question: "C'est pour moi ou pour toute ma squad ?",
    answer: "L'abonnement est personnel. Cependant, certains avantages s'appliquent à tes squads (comme les rôles avancés et les stats détaillées). Tes potes n'ont pas besoin d'être Premium pour profiter de l'audio HD quand tu es dans la party. On offre aussi une garantie satisfait ou remboursé de 30 jours."
  },

  // Compte
  {
    category: 'Compte',
    question: "Comment modifier mon profil ?",
    answer: "Va dans l'onglet Profil et clique sur 'Modifier le profil'. Tu peux changer ton pseudo, ta bio, ta photo de profil, et ton fuseau horaire. Tes modifications sont sauvegardées automatiquement et visibles par les membres de tes squads."
  },
  {
    category: 'Compte',
    question: "Comment supprimer mon compte ?",
    answer: "Va dans Paramètres > Données > Supprimer mon compte. Attention, cette action est irréversible et toutes tes données seront définitivement effacées (profil, messages, statistiques, squads). Avant de supprimer, tu peux exporter tes données au format JSON via le bouton 'Exporter mes données' juste au-dessus."
  },
]

const CATEGORIES = ['Démarrage', 'Sessions', 'Party Vocale', 'Premium', 'Compte']

/* ------------------------------------------------------------------ */
/*  Inline SVG mini-illustrations for specific FAQ answers            */
/* ------------------------------------------------------------------ */

function CreateSquadIllustration() {
  return (
    <svg viewBox="0 0 520 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[520px]" role="img" aria-label="Etapes pour creer une squad : cliquer plus, nommer, partager le code">
      {/* Step 1 - Click "+" */}
      <rect x="0" y="10" width="140" height="100" rx="16" fill="var(--color-primary-10)" stroke="var(--color-primary)" strokeWidth="1.5" />
      <circle cx="70" cy="48" r="20" fill="var(--color-primary-20)" />
      <line x1="70" y1="38" x2="70" y2="58" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="48" x2="80" y2="48" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
      <text x="70" y="90" textAnchor="middle" fill="var(--color-primary)" fontSize="11" fontWeight="600" fontFamily="system-ui">{'1. Clique "+"'}</text>

      {/* Arrow 1 */}
      <line x1="152" y1="55" x2="178" y2="55" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      <polygon points="178,50 188,55 178,60" fill="var(--color-primary)" />

      {/* Step 2 - Name your squad */}
      <rect x="190" y="10" width="140" height="100" rx="16" fill="var(--color-primary-10)" stroke="var(--color-primary)" strokeWidth="1.5" />
      <rect x="215" y="34" width="90" height="28" rx="8" fill="var(--color-primary-20)" />
      <text x="260" y="52" textAnchor="middle" fill="var(--color-primary)" fontSize="10" fontWeight="500" fontFamily="system-ui">Ma Squad</text>
      <text x="260" y="90" textAnchor="middle" fill="var(--color-primary)" fontSize="11" fontWeight="600" fontFamily="system-ui">2. Nomme-la</text>

      {/* Arrow 2 */}
      <line x1="342" y1="55" x2="368" y2="55" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      <polygon points="368,50 378,55 368,60" fill="var(--color-primary)" />

      {/* Step 3 - Share code */}
      <rect x="380" y="10" width="140" height="100" rx="16" fill="var(--color-success-10)" stroke="var(--color-success)" strokeWidth="1.5" />
      <rect x="410" y="30" width="80" height="26" rx="8" fill="var(--color-success-20)" />
      <text x="450" y="47" textAnchor="middle" fill="var(--color-success)" fontSize="11" fontWeight="700" fontFamily="monospace">ABC123</text>
      {/* Share icon */}
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
      {/* Red arc 0-59% */}
      <path d={arcPath(0, 0.59)} stroke="var(--color-error)" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* Yellow arc 60-79% */}
      <path d={arcPath(0.60, 0.79)} stroke="var(--color-warning)" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* Green arc 80-100% */}
      <path d={arcPath(0.80, 1)} stroke="var(--color-success)" strokeWidth="12" strokeLinecap="round" fill="none" />

      {/* Pointer line */}
      <line x1={ppInner.x} y1={ppInner.y} x2={pp.x} y2={pp.y} stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="var(--color-primary)" />

      {/* Score text */}
      <text x={cx} y={cy + 20} textAnchor="middle" fill="var(--color-success)" fontSize="16" fontWeight="700" fontFamily="system-ui">82%</text>

      {/* Labels */}
      <text x="30" y="110" textAnchor="middle" fill="var(--color-error)" fontSize="9" fontWeight="600" fontFamily="system-ui">0-59%</text>
      <text x={cx} y="18" textAnchor="middle" fill="var(--color-warning)" fontSize="9" fontWeight="600" fontFamily="system-ui">60-79%</text>
      <text x="230" y="110" textAnchor="middle" fill="var(--color-success)" fontSize="9" fontWeight="600" fontFamily="system-ui">80-100%</text>
    </svg>
  )
}

function PlanSessionIllustration() {
  return (
    <svg viewBox="0 0 280 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[300px]" role="img" aria-label="Planifier une session : calendrier, heure et nombre de joueurs">
      {/* Calendar card */}
      <rect x="10" y="10" width="130" height="130" rx="14" fill="var(--color-primary-10)" stroke="var(--color-primary)" strokeWidth="1.5" />
      {/* Calendar header */}
      <rect x="10" y="10" width="130" height="32" rx="14" fill="var(--color-primary)" />
      <text x="75" y="31" textAnchor="middle" fill="white" fontSize="12" fontWeight="600" fontFamily="system-ui">Fevrier 2026</text>
      {/* Calendar grid dots */}
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

      {/* Time slot */}
      <rect x="155" y="10" width="115" height="54" rx="12" fill="var(--color-warning-10)" stroke="var(--color-warning)" strokeWidth="1.5" />
      {/* Clock icon */}
      <circle cx="180" cy="37" r="12" stroke="var(--color-warning)" strokeWidth="1.5" fill="none" />
      <line x1="180" y1="30" x2="180" y2="37" stroke="var(--color-warning)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="180" y1="37" x2="186" y2="37" stroke="var(--color-warning)" strokeWidth="1.5" strokeLinecap="round" />
      <text x="210" y="34" fill="var(--color-warning)" fontSize="11" fontWeight="700" fontFamily="system-ui">21:00</text>
      <text x="210" y="46" fill="var(--color-warning)" fontSize="8" fontWeight="500" fontFamily="system-ui" opacity="0.8">Heure</text>

      {/* Player count */}
      <rect x="155" y="74" width="115" height="66" rx="12" fill="var(--color-success-10)" stroke="var(--color-success)" strokeWidth="1.5" />
      {/* Player icons */}
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
      {/* Step 1 - Click "Rejoindre" */}
      <rect x="0" y="8" width="140" height="94" rx="16" fill="var(--color-primary-10)" stroke="var(--color-primary)" strokeWidth="1.5" />
      <rect x="30" y="28" width="80" height="30" rx="10" fill="var(--color-primary)" />
      <text x="70" y="48" textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="system-ui">Rejoindre</text>
      <text x="70" y="82" textAnchor="middle" fill="var(--color-primary)" fontSize="10" fontWeight="600" fontFamily="system-ui">1. Clique ici</text>

      {/* Arrow 1 */}
      <line x1="150" y1="52" x2="176" y2="52" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      <polygon points="176,47 186,52 176,57" fill="var(--color-primary)" />

      {/* Step 2 - Allow mic */}
      <rect x="188" y="8" width="140" height="94" rx="16" fill="var(--color-warning-10)" stroke="var(--color-warning)" strokeWidth="1.5" />
      {/* Mic icon */}
      <rect x="250" y="22" width="16" height="24" rx="8" stroke="var(--color-warning)" strokeWidth="2" fill="var(--color-warning-20)" />
      <path d="M244 40 Q244 54 258 54 Q272 54 272 40" stroke="var(--color-warning)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="258" y1="54" x2="258" y2="60" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" />
      <text x="258" y="82" textAnchor="middle" fill="var(--color-warning)" fontSize="10" fontWeight="600" fontFamily="system-ui">2. Autorise le micro</text>

      {/* Arrow 2 */}
      <line x1="338" y1="52" x2="354" y2="52" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" />
      <polygon points="354,47 364,52 354,57" fill="var(--color-warning)" />

      {/* Step 3 - Connected! */}
      <rect x="366" y="8" width="112" height="94" rx="16" fill="var(--color-success-10)" stroke="var(--color-success)" strokeWidth="1.5" />
      {/* Checkmark circle */}
      <circle cx="422" cy="42" r="16" fill="var(--color-success-20)" stroke="var(--color-success)" strokeWidth="1.5" />
      <polyline points="414,42 419,47 430,36" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="422" y="78" textAnchor="middle" fill="var(--color-success)" fontSize="10" fontWeight="600" fontFamily="system-ui">3. Connecte !</text>
    </svg>
  )
}

/** Maps illustration key to its SVG component */
function FAQIllustration({ type }: { type: FAQItem['illustration'] }) {
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

export function Help() {
  const navigate = useNavigate()
  useHashNavigation()
  const [searchQuery, setSearchQuery] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useStatePersistence<string | null>('help_category', null)
  const [contactSubject, setContactSubject] = useState<string>('bug')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSent, setContactSent] = useState(false)

  // Filter FAQ items
  const filteredItems = FAQ_ITEMS.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === null || item.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Group by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push({ ...item, globalIndex: FAQ_ITEMS.indexOf(item) })
    return acc
  }, {} as Record<string, (FAQItem & { globalIndex: number })[]>)

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Aide">
      <MobilePageHeader title="Aide" />
      <ScrollProgress />
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        {/* Header - hidden on mobile where MobilePageHeader is shown */}
        <header className="hidden lg:flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-border-subtle flex items-center justify-center hover:bg-border-hover hover:scale-[1.02] transition-interactive"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Aide & FAQ</h1>
            <p className="text-md text-text-secondary">Trouve des réponses à tes questions</p>
          </div>
        </header>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Rechercher dans l'aide..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-border-subtle border border-border-hover text-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-base font-medium transition-interactive ${
              selectedCategory === null
                ? 'bg-primary text-white'
                : 'bg-border-subtle text-text-secondary hover:bg-border-hover hover:scale-[1.02]'
            }`}
          >
            Tout
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-base font-medium transition-interactive ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-border-subtle text-text-secondary hover:bg-border-hover hover:scale-[1.02]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        {Object.entries(groupedItems).length === 0 ? (
          <Card className="p-8 text-center">
            <HelpCircle className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-md text-text-primary mb-1">Aucun résultat</p>
            <p className="text-base text-text-tertiary">Essaie avec d'autres mots-clés</p>
          </Card>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} id={category.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')} className="mb-6 scroll-mt-6">
              <h2 className="text-base font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                {category}
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <Card key={item.globalIndex} className="overflow-hidden">
                    <button
                      onClick={() => setOpenIndex(openIndex === item.globalIndex ? null : item.globalIndex)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="text-md font-medium text-text-primary pr-4">
                        {item.question}
                      </span>
                      <motion.div
                        animate={{ rotate: openIndex === item.globalIndex ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openIndex === item.globalIndex && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4">
                            <p className="text-md text-text-secondary leading-relaxed">
                              {item.answer}
                            </p>
                            {item.illustration && (
                              <FAQIllustration type={item.illustration} />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Contact Support */}
        <Card className="mt-8 p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                Contacter le support
              </h3>
              <p className="text-base text-text-secondary">
                Notre équipe est là pour t'aider. On te répond sous 24h.
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {contactSent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-6"
              >
                <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-success" />
                </div>
                <p className="text-md font-semibold text-text-primary">Message envoyé !</p>
                <p className="text-base text-text-secondary text-center">
                  Merci pour ton message. On te répond dès que possible.
                </p>
                <button
                  onClick={() => { setContactSent(false); setContactMessage('') }}
                  className="mt-2 text-base font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Envoyer un autre message
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-base font-medium text-text-secondary mb-1.5">Sujet</label>
                  <Select
                    value={contactSubject}
                    onChange={(v) => setContactSubject(v as string)}
                    options={[
                      { value: 'bug', label: 'Bug' },
                      { value: 'suggestion', label: 'Suggestion' },
                      { value: 'question', label: 'Question' },
                      { value: 'autre', label: 'Autre' },
                    ]}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-text-secondary mb-1.5">Message</label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Décris ton problème ou ta suggestion..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-bg-elevated border border-border-default text-md text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary resize-none transition-colors"
                  />
                </div>
                <button
                  onClick={() => {
                    if (!contactMessage.trim()) return
                    const subject = encodeURIComponent(`[${contactSubject.toUpperCase()}] Support Squad Planner`)
                    const body = encodeURIComponent(contactMessage)
                    window.location.href = `mailto:support@squadplanner.fr?subject=${subject}&body=${body}`
                    setContactSent(true)
                  }}
                  disabled={!contactMessage.trim()}
                  className="w-full h-11 rounded-xl bg-primary text-white text-md font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Envoyer le message
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Version */}
        <p className="text-center text-sm text-text-tertiary mt-8">
          Squad Planner v1.0.0
        </p>
      </div>

      {/* AI Chatbot */}
      <HelpChatbot faqItems={FAQ_ITEMS} />
    </main>
  )
}

export default Help
