import { Link } from 'react-router'
import { m } from 'framer-motion'
import { scrollReveal } from '../../utils/animations'

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const gameLinks = [
  { slug: 'valorant', name: 'Valorant' },
  { slug: 'league-of-legends', name: 'League of Legends' },
  { slug: 'fortnite', name: 'Fortnite' },
  { slug: 'cs2', name: 'CS2' },
  { slug: 'apex-legends', name: 'Apex Legends' },
  { slug: 'rocket-league', name: 'Rocket League' },
  { slug: 'minecraft', name: 'Minecraft' },
  { slug: 'overwatch-2', name: 'Overwatch 2' },
  { slug: 'call-of-duty', name: 'Call of Duty' },
  { slug: 'destiny-2', name: 'Destiny 2' },
  { slug: 'gta-online', name: 'GTA Online' },
  { slug: 'fifa', name: 'EA FC' },
]

export function SeoContentSection() {
  return (
    <section aria-label="Pourquoi choisir Squad Planner" className="px-4 md:px-6 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        <m.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
            Pourquoi les gamers choisissent Squad Planner
          </h2>
        </m.div>

        <m.div
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-6 text-md text-text-secondary leading-relaxed"
        >
          <m.p variants={staggerItemVariants}>
            <strong className="text-text-primary">
              Squad Planner est le calendrier gaming conçu pour les joueurs qui jouent en équipe.
            </strong>{' '}
            Pense à un Calendly ou un Doodle, mais pensé pour le gaming : au lieu de planifier des
            réunions de bureau, tu planifies tes sessions de jeu avec ta squad. Tu crées un
            créneau, tes coéquipiers confirment leur présence en un clic, et tu sais exactement qui
            sera là le soir venu. Plus besoin de relancer tout le monde sur Discord ou WhatsApp
            pour savoir si la session tient.
          </m.p>

          <m.p variants={staggerItemVariants}>
            Si tu joues régulièrement en équipe, tu connais le problème : organiser un 5-stack sur
            Valorant ou une équipe complète sur League of Legends tourne souvent au casse-tête. Les
            messages se perdent dans les channels Discord, personne ne répond au sondage, et au
            moment de lancer la partie, il manque toujours quelqu'un. Résultat : des sessions
            annulées, du temps perdu, et une frustration qui s'accumule. Le{' '}
            <strong className="text-text-primary">score de fiabilité</strong> de Squad Planner
            rend chaque joueur responsable : chaque confirmation de présence est tracée, chaque
            no-show est visible. Tes coéquipiers savent que leur engagement compte, et la pression
            sociale positive fait le reste.
          </m.p>

          <m.div variants={staggerItemVariants}>
            <h3 className="text-lg font-semibold text-text-primary pt-2 mb-3">
              Un outil complet pour organiser ta squad
            </h3>
            <p>
              Squad Planner réunit tout ce dont tu as besoin pour planifier tes sessions gaming au
              même endroit. Le <strong className="text-text-primary">calendrier partagé</strong>{' '}
              te permet de proposer des créneaux et de voir qui est disponible. Le système de{' '}
              <strong className="text-text-primary">RSVP en un clic</strong> (présent, absent,
              peut-être) simplifie la confirmation de présence. Quand suffisamment de joueurs ont
              confirmé, la session se confirme automatiquement grâce au seuil que tu définis.
              Tu retrouves aussi un{' '}
              <strong className="text-text-primary">chat intégré</strong> pour coordonner ta
              squad, un <strong className="text-text-primary">vocal HD</strong> pour tes parties, et
              un système de <strong className="text-text-primary">gamification</strong> avec XP,
              challenges et classements pour garder ta squad motivée semaine après semaine.
            </p>
          </m.div>

          <m.div variants={staggerItemVariants}>
            <h3 className="text-lg font-semibold text-text-primary pt-2 mb-3">
              Organise tes sessions sur tes jeux préférés
            </h3>
            <p className="mb-4">
              Que tu cherches à{' '}
              <Link to="/lfg/valorant" className="text-primary hover:underline">
                trouver des joueurs sur Valorant
              </Link>
              , à monter un roster ranked sur League of Legends, ou à organiser des sessions
              détente sur Minecraft avec tes amis, Squad Planner s'adapte à tous les jeux
              compétitifs et coopératifs. Consulte nos guides par jeu pour découvrir comment
              optimiser tes sessions :
            </p>
          </m.div>

          <m.div
            variants={staggerItemVariants}
            className="flex flex-wrap gap-2 py-1"
            role="list"
            aria-label="Jeux supportés"
          >
            {gameLinks.map((g) => (
              <Link
                key={g.slug}
                to={`/games/${g.slug}`}
                role="listitem"
                className="px-3 py-1.5 rounded-full border border-border-subtle hover:border-primary/30 text-sm text-text-tertiary hover:text-primary transition-colors"
              >
                {g.name}
              </Link>
            ))}
          </m.div>

          <m.p variants={staggerItemVariants}>
            Tu utilises déjà un autre outil pour organiser tes sessions ? Squad Planner va plus
            loin que les solutions génériques comme Google Calendar ou Doodle, qui ne sont pas
            conçues pour le gaming. Et contrairement à{' '}
            <Link to="/alternative/guilded" className="text-primary hover:underline">
              Guilded
            </Link>{' '}
            ou aux{' '}
            <Link to="/alternative/discord-events" className="text-primary hover:underline">
              évènements Discord
            </Link>
            , Squad Planner integre un vrai système de confirmation de présence avec score de
            fiabilité, des check-ins en session, et un coach IA qui analyse les habitudes de ta
            squad pour suggérer les meilleurs créneaux.
          </m.p>

          <m.p variants={staggerItemVariants}>
            L'essentiel est{' '}
            <strong className="text-text-primary">100% gratuit</strong> : 1 squad, 5 membres, 2
            sessions par semaine, confirmation de présence, chat et vocal. Pour les squads qui
            veulent aller plus loin, les{' '}
            <Link to="/premium" className="text-primary hover:underline">
              plans Premium
            </Link>{' '}
            ajoutent des squads illimitées, le coaching IA, les heatmaps de présence et l'audio
            HD. Découvre nos{' '}
            <Link to="/blog" className="text-primary hover:underline">
              conseils pour organiser ta squad
            </Link>{' '}
            et commence à planifier tes sessions gaming dès maintenant.
          </m.p>
        </m.div>
      </div>
    </section>
  )
}
