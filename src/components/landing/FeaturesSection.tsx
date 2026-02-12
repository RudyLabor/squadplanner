'use client'

import { useState } from 'react'
import { m } from 'framer-motion'
import { Headphones, Calendar, Target, Check } from '../icons'
import { HeadphonesIllustration } from './illustrations/HeadphonesIllustration'
import { CalendarIllustration } from './illustrations/CalendarIllustration'
import { ShieldIllustration } from './illustrations/ShieldIllustration'

const pillars = [
  {
    id: 'voice',
    icon: Headphones,
    illustration: HeadphonesIllustration,
    title: 'Party vocale 24/7',
    description:
      'Ta squad a son salon vocal toujours ouvert. Rejoins en 1 clic, reste aussi longtemps que tu veux.',
    color: 'var(--color-success)',
    gradient: 'from-success/[0.08] to-success/[0.01]',
    details: [
      '1 squad = 1 party vocale dédiée',
      'Rejoindre en 1 clic',
      'Qualité HD, latence ultra-faible',
    ],
    detailText:
      'Ta squad a son salon vocal 24/7. Pas besoin de planifier. Rejoins quand tu veux, reste aussi longtemps que tu veux.',
  },
  {
    id: 'planning',
    icon: Calendar,
    illustration: CalendarIllustration,
    title: 'Planning avec décision',
    description:
      'Propose un créneau. Chacun répond OUI ou NON. Pas de « peut-être ». On sait qui vient.',
    color: 'var(--color-gold)',
    gradient: 'from-warning/[0.08] to-warning/[0.01]',
    details: [
      'RSVP OUI ou NON — pas de « peut-être »',
      'Confirmation auto quand assez de joueurs',
      'Rappels avant chaque session',
    ],
    detailText:
      'Propose un créneau. Chaque pote répond OUI ou NON. Pas de « peut-être ». La session se confirme quand vous êtes assez. Plus de ghosting.',
  },
  {
    id: 'reliability',
    icon: Target,
    illustration: ShieldIllustration,
    title: 'Fiabilité mesurée',
    description:
      'Check-in à chaque session. Ton score montre si tu tiens parole. Tes potes comptent sur toi.',
    color: 'var(--color-error)',
    gradient: 'from-error/[0.08] to-error/[0.01]',
    details: ['Check-in obligatoire', 'Historique visible', 'Score par joueur'],
    detailText:
      'Chaque membre a un score basé sur sa présence réelle. Tu dis que tu viens ? On vérifie. Les no-shows chroniques, ça se voit.',
  },
]

function VoiceMockup() {
  return (
    <div className="relative max-w-[240px] mx-auto md:mx-0">
      <div className="bg-bg-surface rounded-[1.5rem] p-3 border border-success/15">
        <div className="bg-bg-base rounded-[1.2rem] overflow-hidden p-4">
          <div className="flex items-center gap-2 mb-3">
            <m.div
              className="w-2 h-2 rounded-full bg-success"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
              transition={{ duration: 2, repeat: 3, ease: 'easeInOut' }}
            />
            <span className="text-xs font-semibold text-text-primary">Party vocale</span>
            <span className="text-xs text-success ml-auto">En ligne</span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-3">
            {[
              { name: 'Max', color: 'var(--color-success)', speaking: true },
              { name: 'Luna', color: 'var(--color-primary)', speaking: false },
              { name: 'Kira', color: 'var(--color-gold)', speaking: false },
              { name: 'Jay', color: 'var(--color-purple)', speaking: false },
            ].map((p) => (
              <div key={p.name} className="flex flex-col items-center">
                <div className="relative">
                  {p.speaking && (
                    <m.div
                      className="absolute inset-0 w-10 h-10 rounded-full bg-success"
                      animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
                      transition={{ duration: 1.5, repeat: 3, ease: 'easeOut' }}
                    />
                  )}
                  <div
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white ${p.speaking ? 'ring-2 ring-success/50' : ''}`}
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name[0]}
                  </div>
                </div>
                <span
                  className={`text-xs mt-1 ${p.speaking ? 'text-success font-medium' : 'text-text-tertiary'}`}
                >
                  {p.name}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-0.5">
            {[0, 1, 2, 3, 4, 5, 6].map((j) => (
              <m.div
                key={j}
                className="w-0.5 rounded-full bg-success"
                animate={{ height: [4, 12, 4] }}
                transition={{ duration: 0.5, repeat: 4, delay: j * 0.08, ease: 'easeInOut' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0)

  return (
    <section
      id="features"
      aria-label="Fonctionnalités principales"
      className="px-4 md:px-6 py-10 md:py-14"
    >
      <div className="max-w-5xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
            Les 3 piliers de Squad Planner
          </h2>
          <p className="text-text-tertiary text-lg">
            Chacun résout un problème précis. Ensemble, ils font la différence.
          </p>
        </m.div>

        {/* Pillar tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {pillars.map((pillar, i) => {
            const PillarIcon = pillar.icon
            return (
              <button
                type="button"
                key={pillar.id}
                onClick={() => setActiveFeature(i)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all text-sm font-medium ${
                  activeFeature === i
                    ? 'shadow-lg'
                    : 'bg-surface-card border border-border-subtle text-text-tertiary hover:text-text-primary hover:border-border-hover'
                }`}
                style={
                  activeFeature === i
                    ? {
                        backgroundColor: `${pillar.color}20`,
                        color: pillar.color,
                        borderColor: `${pillar.color}40`,
                        border: `1px solid ${pillar.color}40`,
                        boxShadow: `0 0 20px ${pillar.color}15`,
                      }
                    : undefined
                }
              >
                <PillarIcon className="w-4 h-4" />
                {pillar.title}
              </button>
            )
          })}
        </div>

        {/* Active pillar detail card */}
        {pillars.map((pillar, i) => {
          if (i !== activeFeature) return null
          const PillarIcon = pillar.icon
          return (
            <m.div
              key={pillar.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`p-8 md:p-10 rounded-3xl bg-gradient-to-br ${pillar.gradient} border`}
              style={{ borderColor: `${pillar.color}25` }}
            >
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${pillar.color}12` }}
                  >
                    <div className="hidden md:block">
                      <pillar.illustration size={40} />
                    </div>
                    <PillarIcon className="w-8 h-8 md:hidden" style={{ color: pillar.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">{pillar.title}</h3>
                  <p className="text-text-tertiary mb-4">{pillar.detailText}</p>
                  <ul className="space-y-2">
                    {pillar.details.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-md text-text-secondary"
                      >
                        <Check
                          className="w-4 h-4"
                          style={{ color: pillar.color }}
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                {pillar.id === 'voice' && <VoiceMockup />}
              </div>
            </m.div>
          )
        })}

        <m.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-md text-text-quaternary mt-10"
        >
          Plus qu'un simple Discord — Squad Planner crée des{' '}
          <span className="text-text-primary font-semibold text-gradient-animated">
            habitudes de jeu régulières
          </span>{' '}
          pour ta communauté
        </m.p>
      </div>
    </section>
  )
}
