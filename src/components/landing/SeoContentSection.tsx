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
              Squad Planner est le calendrier gaming concu pour les joueurs qui jouent en equipe.
            </strong>{' '}
            Pense a un Calendly ou un Doodle, mais pense pour le gaming : au lieu de planifier des
            reunions de bureau, tu planifies tes sessions de jeu avec ta squad. Tu crees un
            creneau, tes coequipiers confirment leur presence en un clic, et tu sais exactement qui
            sera la le soir venu. Plus besoin de relancer tout le monde sur Discord ou WhatsApp
            pour savoir si la session tient.
          </m.p>

          <m.p variants={staggerItemVariants}>
            Si tu joues regulierement en equipe, tu connais le probleme : organiser un 5-stack sur
            Valorant ou une equipe complete sur League of Legends tourne souvent au casse-tete. Les
            messages se perdent dans les channels Discord, personne ne repond au sondage, et au
            moment de lancer la partie, il manque toujours quelqu'un. Resultat : des sessions
            annulees, du temps perdu, et une frustration qui s'accumule. Le{' '}
            <strong className="text-text-primary">score de fiabilite</strong> de Squad Planner
            rend chaque joueur responsable : chaque confirmation de presence est tracee, chaque
            no-show est visible. Tes coequipiers savent que leur engagement compte, et la pression
            sociale positive fait le reste.
          </m.p>

          <m.div variants={staggerItemVariants}>
            <h3 className="text-lg font-semibold text-text-primary pt-2 mb-3">
              Un outil complet pour organiser ta squad
            </h3>
            <p>
              Squad Planner reunit tout ce dont tu as besoin pour planifier tes sessions gaming au
              meme endroit. Le <strong className="text-text-primary">calendrier partage</strong>{' '}
              te permet de proposer des creneaux et de voir qui est disponible. Le systeme de{' '}
              <strong className="text-text-primary">RSVP en un clic</strong> (present, absent,
              peut-etre) simplifie la confirmation de presence. Quand suffisamment de joueurs ont
              confirme, la session se confirme automatiquement grace au seuil que tu definis.
              Tu retrouves aussi un{' '}
              <strong className="text-text-primary">chat integre</strong> pour coordonner ta
              squad, un <strong className="text-text-primary">vocal HD</strong> pour tes parties, et
              un systeme de <strong className="text-text-primary">gamification</strong> avec XP,
              challenges et classements pour garder ta squad motivee semaine apres semaine.
            </p>
          </m.div>

          <m.div variants={staggerItemVariants}>
            <h3 className="text-lg font-semibold text-text-primary pt-2 mb-3">
              Organise tes sessions sur tes jeux preferes
            </h3>
            <p className="mb-4">
              Que tu cherches a{' '}
              <Link to="/lfg/valorant" className="text-primary hover:underline">
                trouver des joueurs sur Valorant
              </Link>
              , a monter un roster ranked sur League of Legends, ou a organiser des sessions
              detente sur Minecraft avec tes amis, Squad Planner s'adapte a tous les jeux
              competitifs et cooperatifs. Consulte nos guides par jeu pour decouvrir comment
              optimiser tes sessions :
            </p>
          </m.div>

          <m.div
            variants={staggerItemVariants}
            className="flex flex-wrap gap-2 py-1"
            role="list"
            aria-label="Jeux supportes"
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
            Tu utilises deja un autre outil pour organiser tes sessions ? Squad Planner va plus
            loin que les solutions generiques comme Google Calendar ou Doodle, qui ne sont pas
            concues pour le gaming. Et contrairement a{' '}
            <Link to="/alternative/guilded" className="text-primary hover:underline">
              Guilded
            </Link>{' '}
            ou aux{' '}
            <Link to="/alternative/discord-events" className="text-primary hover:underline">
              evenements Discord
            </Link>
            , Squad Planner integre un vrai systeme de confirmation de presence avec score de
            fiabilite, des check-ins en session, et un coach IA qui analyse les habitudes de ta
            squad pour suggerer les meilleurs creneaux.
          </m.p>

          <m.p variants={staggerItemVariants}>
            L'essentiel est{' '}
            <strong className="text-text-primary">100% gratuit</strong> : 1 squad, 5 membres, 2
            sessions par semaine, confirmation de presence, chat et vocal. Pour les squads qui
            veulent aller plus loin, les{' '}
            <Link to="/premium" className="text-primary hover:underline">
              plans Premium
            </Link>{' '}
            ajoutent des squads illimitees, le coaching IA, les statistiques avancees et l'audio
            HD. Decouvre nos{' '}
            <Link to="/blog" className="text-primary hover:underline">
              conseils pour organiser ta squad
            </Link>{' '}
            et commence a planifier tes sessions gaming des maintenant.
          </m.p>
        </m.div>
      </div>
    </section>
  )
}
