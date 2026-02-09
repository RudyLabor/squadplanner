import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle, ChevronDown, Search, ArrowLeft, ExternalLink, Mail
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const FAQ_ITEMS: FAQItem[] = [
  // Getting Started
  {
    category: 'Démarrage',
    question: "Comment créer ma première squad ?",
    answer: "Va dans l'onglet Squads et clique sur 'Créer une squad'. Donne-lui un nom, choisis ton jeu principal, et c'est parti ! Tu recevras un code d'invitation à partager avec tes potes."
  },
  {
    category: 'Démarrage',
    question: "Comment inviter des amis dans ma squad ?",
    answer: "Dans ta squad, tu trouveras un code d'invitation unique (ex: ABC123). Partage ce code à tes amis, ils pourront le coller dans 'Rejoindre une squad' pour te rejoindre."
  },
  {
    category: 'Démarrage',
    question: "C'est quoi le score de fiabilité ?",
    answer: "Ton score de fiabilité (0-100%) montre à quel point tu es régulier. Quand tu confirmes ta présence à une session et que tu te pointes vraiment, ton score augmente. Si tu ghost ta squad, il baisse. Un score élevé = ta squad peut compter sur toi !"
  },

  // Sessions
  {
    category: 'Sessions',
    question: "Comment planifier une session ?",
    answer: "Dans une squad, clique sur 'Planifier une session'. Choisis la date, l'heure, et le nombre minimum de joueurs requis. Les membres de ta squad recevront une notification pour confirmer leur présence."
  },
  {
    category: 'Sessions',
    question: "Quand une session est-elle confirmée ?",
    answer: "Une session passe en 'confirmée' automatiquement quand le nombre minimum de joueurs (que tu as défini) ont répondu 'Présent'. Par défaut c'est 3 joueurs."
  },
  {
    category: 'Sessions',
    question: "Je peux changer ma réponse après avoir RSVP ?",
    answer: "Oui ! Tu peux modifier ta réponse à tout moment avant le début de la session. Mais attention, changer à la dernière minute peut affecter ton score de fiabilité."
  },

  // Party Vocale
  {
    category: 'Party Vocale',
    question: "Comment rejoindre une party vocale ?",
    answer: "Va dans l'onglet Party ou clique sur 'Rejoindre' sur n'importe quelle squad. Assure-toi d'autoriser l'accès à ton micro quand le navigateur te le demande."
  },
  {
    category: 'Party Vocale',
    question: "Ma voix ne passe pas, que faire ?",
    answer: "1) Vérifie que ton micro n'est pas muté. 2) Va dans Paramètres > Audio et sélectionne le bon micro. 3) Vérifie les permissions de ton navigateur. 4) Essaie un autre navigateur (Chrome recommandé)."
  },
  {
    category: 'Party Vocale',
    question: "Combien de personnes peuvent rejoindre une party ?",
    answer: "En version gratuite, jusqu'à 8 personnes par party. Avec Premium, tu peux avoir jusqu'à 15 personnes en HD audio."
  },

  // Premium
  {
    category: 'Premium',
    question: "Quels sont les avantages Premium ?",
    answer: "Squads illimitées, stats avancées avec prédictions IA, audio HD pour les parties vocales, historique illimité, rôles personnalisés, et badge Premium visible par ta squad."
  },
  {
    category: 'Premium',
    question: "Je peux annuler mon abonnement ?",
    answer: "Oui, à tout moment depuis ton Profil > Gérer l'abonnement. Tu garderas l'accès Premium jusqu'à la fin de ta période payée."
  },
  {
    category: 'Premium',
    question: "C'est pour moi ou pour toute ma squad ?",
    answer: "L'abonnement est personnel. Cependant, certains avantages s'appliquent à tes squads (comme les rôles avancés). Tes potes n'ont pas besoin d'être Premium pour profiter de l'audio HD quand tu es dans la party."
  },

  // Compte
  {
    category: 'Compte',
    question: "Comment modifier mon profil ?",
    answer: "Va dans l'onglet Profil et clique sur 'Modifier le profil'. Tu peux changer ton pseudo, ta bio, et ta photo de profil."
  },
  {
    category: 'Compte',
    question: "Comment supprimer mon compte ?",
    answer: "Va dans Paramètres > Données > Supprimer mon compte. Attention, cette action est irréversible et toutes tes données seront effacées."
  },
]

const CATEGORIES = ['Démarrage', 'Sessions', 'Party Vocale', 'Premium', 'Compte']

export function Help() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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
    <div className="min-h-0 bg-bg-base pb-6">
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-border-subtle flex items-center justify-center hover:bg-border-hover hover:scale-[1.02] transition-interactive"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Aide & FAQ</h1>
            <p className="text-[14px] text-text-secondary">Trouve des réponses à tes questions</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Rechercher dans l'aide..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-border-subtle border border-border-hover text-[14px] text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-interactive ${
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
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-interactive ${
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
            <p className="text-[15px] text-text-primary mb-1">Aucun résultat</p>
            <p className="text-[13px] text-text-tertiary">Essaie avec d'autres mots-clés</p>
          </Card>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h2 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                {category}
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <Card key={item.globalIndex} className="overflow-hidden">
                    <button
                      onClick={() => setOpenIndex(openIndex === item.globalIndex ? null : item.globalIndex)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="text-[14px] font-medium text-text-primary pr-4">
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
                            <p className="text-[14px] text-text-secondary leading-relaxed">
                              {item.answer}
                            </p>
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
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-[16px] font-semibold text-text-primary mb-1">
                Besoin d'aide supplémentaire ?
              </h3>
              <p className="text-[13px] text-text-secondary mb-3">
                Notre équipe est là pour t'aider. Contacte-nous et on te répond sous 24h.
              </p>
              <a
                href="mailto:support@squadplanner.fr"
                className="inline-flex items-center gap-2 text-[14px] font-medium text-primary hover:text-purple transition-colors"
              >
                Contacter le support
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </Card>

        {/* Version */}
        <p className="text-center text-[12px] text-text-tertiary mt-8">
          Squad Planner v1.0.0
        </p>
      </div>
    </div>
  )
}

export default Help
