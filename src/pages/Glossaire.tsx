import { Link } from 'react-router'
import { m } from 'framer-motion'
import { useState } from 'react'
import { ArrowRight, Search } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'

interface GlossaryTerm {
  term: string
  definition: string
  link?: { label: string; to: string }
}

const glossaryTerms: GlossaryTerm[] = [
  { term: 'AFK', definition: 'Away From Keyboard. Joueur temporairement absent de son poste.' },
  { term: 'Carry', definition: "Joueur qui porte l'équipe sur ses épaules grâce à ses performances individuelles." },
  { term: 'Check-in', definition: "Confirmation de présence réelle à une session de jeu. Prouve que tu es là, pas juste inscrit.", link: { label: 'Sessions', to: '/sessions' } },
  { term: 'Clutch', definition: "Gagner un round ou une situation en infériorité numérique. Le moment de gloire ultime." },
  { term: 'DPS', definition: 'Damage Per Second. Mesure de dégâts ou rôle dédié aux dégâts dans une équipe.' },
  { term: 'Entry fragger', definition: "Premier joueur à entrer sur un site ou à engager le combat. Rôle à haut risque, haut reward." },
  { term: 'Ghost / Ghosting', definition: "Ne pas se présenter à une session sans prévenir. Le cauchemar de tout organisateur de squad.", link: { label: 'Score de fiabilité', to: '/home' } },
  { term: 'GG', definition: 'Good Game. Expression de fair-play en fin de partie.' },
  { term: 'IGL', definition: "In-Game Leader. Le shotcaller de l'équipe qui prend les décisions tactiques en temps réel." },
  { term: 'LFG', definition: "Looking For Group. Quand tu cherches des joueurs pour former une équipe.", link: { label: 'Découverte', to: '/discover' } },
  { term: 'Main', definition: "Personnage ou rôle principal d'un joueur. Celui sur lequel tu es le plus à l'aise." },
  { term: 'Meta', definition: "Most Effective Tactics Available. Les stratégies et compositions les plus efficaces du moment." },
  { term: 'Nerf', definition: "Réduction de la puissance d'un personnage, arme ou capacité par les développeurs du jeu." },
  { term: 'Ping', definition: "Latence réseau entre ton PC et le serveur de jeu. Plus c'est bas, mieux c'est." },
  { term: 'RSVP', definition: "Confirmation de présence à une session planifiée. Présent, absent ou peut-être.", link: { label: 'Planifier une session', to: '/sessions' } },
  { term: 'Scrim', definition: "Scrimmage. Match d'entraînement organisé entre deux équipes pour progresser." },
  { term: 'Squad', definition: 'Groupe de joueurs qui jouent régulièrement ensemble. Ta team, ton crew.', link: { label: 'Créer un squad', to: '/squads' } },
  { term: 'Streak', definition: "Série de jours consécutifs avec activité. Plus ton streak est long, plus tu gagnes d'XP.", link: { label: 'Gamification', to: '/profile' } },
  { term: 'Tilt', definition: "État émotionnel négatif qui affecte tes performances. Quand la frustration prend le dessus." },
  { term: 'Tryhard', definition: 'Joueur qui donne absolument tout pour gagner, même en partie casual.' },
  { term: 'XP', definition: "Points d'expérience gagnés en participant aux sessions, en complétant des challenges et en maintenant ton streak.", link: { label: 'Challenges', to: '/profile' } },
]

export default function Glossaire() {
  const [search, setSearch] = useState('')

  const filtered = glossaryTerms.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase()),
  )

  const letters = [...new Set(filtered.map((t) => t.term[0].toUpperCase()))].sort()

  return (
    <PublicPageShell>
      {/* Hero */}
      <section className="relative overflow-hidden noise-overlay">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 0%, var(--color-primary-10) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />
        <div className="relative px-4 md:px-6 py-16 md:py-24 max-w-5xl mx-auto text-center">
          <m.h1
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight"
          >
            Glossaire <span className="text-gradient-animated">Gaming</span>
          </m.h1>
          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Tous les termes du vocabulaire gaming et esport expliqués simplement. De AFK à XP, plus aucun mot ne te sera inconnu.
          </m.p>

          {/* Search */}
          <m.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-md mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                placeholder="Rechercher un terme..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-card border border-border-subtle text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Terms */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {filtered.length === 0 ? (
            <m.div
              variants={scrollRevealLight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center py-16"
            >
              <p className="text-text-tertiary text-lg">
                Aucun terme ne correspond à ta recherche.
              </p>
            </m.div>
          ) : (
            letters.map((letter) => {
              const termsForLetter = filtered.filter(
                (t) => t.term[0].toUpperCase() === letter,
              )
              return (
                <div key={letter} className="mb-10">
                  <m.h2
                    variants={scrollRevealLight}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="text-2xl font-bold text-primary mb-4 border-b border-border-subtle pb-2"
                  >
                    {letter}
                  </m.h2>
                  <div className="space-y-4">
                    {termsForLetter.map((term) => (
                      <m.div
                        key={term.term}
                        variants={scrollRevealLight}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="p-5 rounded-xl bg-surface-card border border-border-subtle hover:border-border-hover transition-colors"
                      >
                        <h3 className="text-lg font-bold text-text-primary mb-1">
                          {term.term}
                        </h3>
                        <p className="text-text-secondary leading-relaxed">
                          {term.definition}
                        </p>
                        {term.link && (
                          <Link
                            to={term.link.to}
                            className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                          >
                            {term.link.label}
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </m.div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      <div className="section-divider" />

      {/* CTA */}
      <section className="px-4 md:px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">
              Prêt à passer de la théorie à la pratique ?
            </h2>
            <p className="text-text-tertiary mb-8 text-lg">
              Crée ton squad et planifie ta première session en 30 secondes.
            </p>
            <m.div whileHover={{ scale: 1.02, y: -2 }} {...springTap} className="inline-flex">
              <Link
                to="/auth?mode=register&redirect=onboarding"
                className="flex items-center gap-2 h-14 px-8 rounded-xl bg-primary-bg text-white text-lg font-semibold shadow-lg shadow-primary/10 cta-pulse-glow"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
          </m.div>
        </div>
      </section>
    </PublicPageShell>
  )
}
