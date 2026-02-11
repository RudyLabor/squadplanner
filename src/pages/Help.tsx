"use client";

import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  HelpCircle,
  ChevronDown,
  Search,
  ArrowLeft,
} from '../components/icons'
import { useNavigate } from 'react-router'
import { Card } from '../components/ui'
import { MobilePageHeader } from '../components/layout/MobilePageHeader'
import { ScrollProgress } from '../components/ui/ScrollProgress'
import { useStatePersistence } from '../hooks/useStatePersistence'
import { useHashNavigation } from '../hooks/useHashNavigation'
import { HelpChatbot } from '../components/HelpChatbot'
import { FAQ_ITEMS, CATEGORIES } from './help/HelpFAQData'
import { FAQIllustration } from './help/HelpIllustrations'
import { HelpContactSection } from './help/HelpContactSection'

export function Help() {
  const navigate = useNavigate()
  useHashNavigation()
  const [searchQuery, setSearchQuery] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useStatePersistence<string | null>('help_category', null)

  const filteredItems = FAQ_ITEMS.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === null || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push({ ...item, globalIndex: FAQ_ITEMS.indexOf(item) })
    return acc
  }, {} as Record<string, (typeof FAQ_ITEMS[number] & { globalIndex: number })[]>)

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Aide">
      <MobilePageHeader title="Aide" />
      <ScrollProgress />
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        <header className="hidden lg:flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-border-subtle flex items-center justify-center hover:bg-border-hover hover:scale-[1.02] transition-interactive"
            aria-label="Retour">
            <ArrowLeft className="w-5 h-5 text-text-secondary" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Aide & FAQ</h1>
            <p className="text-md text-text-secondary">Trouve des réponses à tes questions</p>
          </div>
        </header>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input type="text" placeholder="Rechercher dans l'aide..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-border-subtle border border-border-hover text-md text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-base font-medium transition-interactive ${
              selectedCategory === null ? 'bg-primary text-white' : 'bg-border-subtle text-text-secondary hover:bg-border-hover hover:scale-[1.02]'
            }`}>Tout</button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-base font-medium transition-interactive ${
                selectedCategory === cat ? 'bg-primary text-white' : 'bg-border-subtle text-text-secondary hover:bg-border-hover hover:scale-[1.02]'
              }`}>{cat}</button>
          ))}
        </div>

        {Object.entries(groupedItems).length === 0 ? (
          <Card className="p-8 text-center">
            <HelpCircle className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-md text-text-primary mb-1">Aucun résultat</p>
            <p className="text-base text-text-tertiary">Essaie avec d'autres mots-clés</p>
          </Card>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} id={category.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')} className="mb-6 scroll-mt-6">
              <h2 className="text-md font-semibold text-text-secondary mb-3">{category}</h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <Card key={item.globalIndex} className="overflow-hidden">
                    <button onClick={() => setOpenIndex(openIndex === item.globalIndex ? null : item.globalIndex)}
                      className="w-full flex items-center justify-between p-4 text-left">
                      <span className="text-md font-medium text-text-primary pr-4">{item.question}</span>
                      <m.div animate={{ rotate: openIndex === item.globalIndex ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                      </m.div>
                    </button>
                    <AnimatePresence>
                      {openIndex === item.globalIndex && (
                        <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4">
                            <p className="text-md text-text-secondary leading-relaxed">{item.answer}</p>
                            {item.illustration && <FAQIllustration type={item.illustration} />}
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}

        <HelpContactSection />

        <p className="text-center text-sm text-text-tertiary mt-8">Squad Planner v1.0.0</p>
      </div>

      <HelpChatbot faqItems={FAQ_ITEMS} />
    </main>
  )
}

export default Help
