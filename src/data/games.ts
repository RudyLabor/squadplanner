/**
 * Catalogue de jeux pour les pages SEO /games/:game et /lfg/:game
 * Chaque jeu est identifié par un slug URL-friendly.
 */

export interface GameTestimonial {
  quote: string
  author: string
  rank: string
}

export interface GameInfo {
  slug: string
  name: string
  shortName?: string
  description: string
  seoDescription: string
  genre: string
  players: string
  platforms: string[]
  icon: string // emoji fallback
  estimatedPlayers: string // e.g. "15M+ joueurs actifs"
  color: string // tailwind color for accents
  tags: string[]
  // R11/R12 — Game-specific marketing content
  specificPainPoint: string
  specificUseCase: string
  specificFeatures: string[]
  lfgSpecificCopy: string
  // R13 — Game-specific testimonial
  testimonial: GameTestimonial
}

export const GAMES: GameInfo[] = [
  {
    slug: 'valorant',
    name: 'Valorant',
    description:
      'FPS tactique 5v5 par Riot Games. Chaque agent possède des capacités uniques pour dominer le champ de bataille.',
    seoDescription:
      'Planifie tes sessions Valorant avec Squad Planner. Trouve des coéquipiers, organise tes ranked et grimpe en ELO avec une squad fiable.',
    genre: 'FPS Tactique',
    players: '5v5',
    platforms: ['PC'],
    icon: '🎯',
    estimatedPlayers: '28M+ joueurs actifs',
    color: 'red',
    tags: ['fps', 'tactique', 'compétitif', 'riot'],
    specificPainPoint: 'Perdre son rank parce que le 5e ghost au dernier moment',
    specificUseCase: 'Organise tes ranked 5-stack et ne joue plus jamais avec un random',
    specificFeatures: ['Matchmaking par rank (Iron à Radiant)', 'Sessions ranked récurrentes', 'Score de fiabilité anti-ghost'],
    lfgSpecificCopy: 'Cherche des coéquipiers ranked pour monter ensemble',
    testimonial: { quote: "On est passés de Gold à Diamond en 2 mois grâce à une squad stable. Plus de randoms toxiques.", author: 'Alex', rank: 'Diamond 2' },
  },
  {
    slug: 'league-of-legends',
    name: 'League of Legends',
    shortName: 'LoL',
    description:
      "MOBA légendaire par Riot Games. 5 joueurs s'affrontent sur la Faille de l'Invocateur dans des parties stratégiques intenses.",
    seoDescription:
      'Organise tes sessions League of Legends avec Squad Planner. Planifie tes ranked, trouve des joueurs fiables et monte en rang.',
    genre: 'MOBA',
    players: '5v5',
    platforms: ['PC'],
    icon: '⚔️',
    estimatedPlayers: '150M+ joueurs actifs',
    color: 'blue',
    tags: ['moba', 'stratégie', 'compétitif', 'riot'],
    specificPainPoint: 'Impossible de trouver 4 joueurs fiables pour du flex ranked',
    specificUseCase: 'Monte en ranked avec une squad fixe qui connait ses rôles',
    specificFeatures: ['Organisation par rôle (Top, Jungle, Mid, ADC, Support)', 'Sessions Clash planifiées', 'Suivi de progression collective'],
    lfgSpecificCopy: 'Cherche des joueurs pour flex ranked ou Clash',
    testimonial: { quote: "Enfin une squad Clash stable. On a gagné notre premier tournoi ensemble.", author: 'Sarah', rank: 'Platine 1' },
  },
  {
    slug: 'fortnite',
    name: 'Fortnite',
    description:
      'Battle royale iconique par Epic Games. Construis, combats et survis seul ou en squad dans un monde en constante évolution.',
    seoDescription:
      'Planifie tes sessions Fortnite avec Squad Planner. Organise tes parties en squad, duo ou solo et ne rate plus aucun event.',
    genre: 'Battle Royale',
    players: '1-4 joueurs',
    platforms: ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'],
    icon: '🏗️',
    estimatedPlayers: '80M+ joueurs actifs',
    color: 'purple',
    tags: ['battle-royale', 'construction', 'cross-platform'],
    specificPainPoint: 'Tes potes sont sur 5 plateformes différentes et personne ne sait quand jouer',
    specificUseCase: 'Coordonne tes sessions cross-platform pour ne rater aucun event',
    specificFeatures: ['Planification cross-platform', 'Alertes events et mises à jour', 'Sessions duo, trio ou squad'],
    lfgSpecificCopy: 'Cherche des joueurs pour ranked, créatif ou events saisonniers',
    testimonial: { quote: "Avec Squad Planner on rate plus aucun event saisonnier. Tout le monde est prêt.", author: 'Lucas', rank: 'Champion League' },
  },
  {
    slug: 'rocket-league',
    name: 'Rocket League',
    description:
      'Du football avec des voitures turbo ! Jeu compétitif rapide et addictif, parfait pour des sessions courtes entre amis.',
    seoDescription:
      'Organise tes sessions Rocket League avec Squad Planner. Trouve des coéquipiers, planifie tes tournois et grimpe les rangs.',
    genre: 'Sport / Arcade',
    players: '1v1 à 4v4',
    platforms: ['PC', 'PlayStation', 'Xbox', 'Switch'],
    icon: '🚗',
    estimatedPlayers: '90M+ joueurs',
    color: 'cyan',
    tags: ['sport', 'arcade', 'compétitif', 'cross-platform'],
    specificPainPoint: 'Sessions courtes mais impossible de trouver un 3e pour du ranked',
    specificUseCase: 'Lance des sessions rapides en 2v2 ou 3v3 après le boulot',
    specificFeatures: ['Sessions courtes (15-30 min)', 'Tournois entre amis', 'Matchmaking par rank'],
    lfgSpecificCopy: 'Cherche des coéquipiers 2v2 ou 3v3 pour monter en ranked',
    testimonial: { quote: "On fait nos sessions 2v2 tous les mardis soir. Plus besoin de chercher un mate.", author: 'Théo', rank: 'Grand Champion' },
  },
  {
    slug: 'cs2',
    name: 'Counter-Strike 2',
    shortName: 'CS2',
    description:
      "Le FPS compétitif par excellence, développé par Valve. Précision, stratégie et travail d'équipe sont les clés de la victoire.",
    seoDescription:
      'Planifie tes sessions CS2 avec Squad Planner. Organise tes matchs compétitifs, trouve une squad fiable et progresse ensemble.',
    genre: 'FPS Compétitif',
    players: '5v5',
    platforms: ['PC'],
    icon: '💣',
    estimatedPlayers: '35M+ joueurs actifs',
    color: 'amber',
    tags: ['fps', 'compétitif', 'valve', 'tactique'],
    specificPainPoint: 'Perdre un match compétitif parce que ton 5e ne se connecte jamais',
    specificUseCase: 'Assure-toi que ta 5-stack est complète avant de lancer la ranked',
    specificFeatures: ['Confirmation obligatoire avant le match', 'Sessions Premier planifiées', 'Score de fiabilité visible'],
    lfgSpecificCopy: 'Cherche des joueurs pour du compétitif ou Premier',
    testimonial: { quote: "Depuis qu'on utilise Squad Planner, on a toujours notre 5e. Notre taux de victoire a explosé.", author: 'Maxime', rank: 'Faceit Niveau 8' },
  },
  {
    slug: 'apex-legends',
    name: 'Apex Legends',
    description:
      'Battle royale par squads de 3 avec des Légendes aux capacités uniques. Gameplay rapide et nerveux par Respawn Entertainment.',
    seoDescription:
      "Organise tes sessions Apex Legends avec Squad Planner. Trouve des coéquipiers, planifie tes ranked et domine l'arène.",
    genre: 'Battle Royale / FPS',
    players: 'Squads de 3',
    platforms: ['PC', 'PlayStation', 'Xbox'],
    icon: '🔥',
    estimatedPlayers: '15M+ joueurs actifs',
    color: 'red',
    tags: ['battle-royale', 'fps', 'squad', 'hero-shooter'],
    specificPainPoint: 'Ton trio tombe à duo au dernier moment et tu te fais écraser',
    specificUseCase: 'Garde ton trio ranked soudé avec des sessions régulières',
    specificFeatures: ['Squads de 3 optimisées', 'Rappels avant chaque session', 'Suivi de performance squad'],
    lfgSpecificCopy: 'Cherche un 3e fiable pour du ranked ou des arenas',
    testimonial: { quote: "Plus de duo forcé en ranked. On joue toujours à 3 maintenant.", author: 'Emma', rank: 'Master' },
  },
  {
    slug: 'minecraft',
    name: 'Minecraft',
    description:
      'Le jeu de survie et de construction le plus vendu au monde. Explore, construis et survis dans un monde infini de blocs.',
    seoDescription:
      'Planifie tes sessions Minecraft avec Squad Planner. Organise tes soirées survie, créatif ou mini-jeux avec ta squad.',
    genre: 'Survie / Sandbox',
    players: 'Multijoueur',
    platforms: ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'],
    icon: '⛏️',
    estimatedPlayers: '170M+ joueurs actifs',
    color: 'emerald',
    tags: ['survie', 'sandbox', 'créatif', 'cross-platform'],
    specificPainPoint: 'Ton serveur survie meurt parce que personne ne se connecte en même temps',
    specificUseCase: 'Coordonne tes sessions build ou survie pour que tout le monde soit là',
    specificFeatures: ['Sessions longues (2h+)', 'Planification de projets build', 'Coordination serveur multi-joueurs'],
    lfgSpecificCopy: 'Cherche des joueurs pour survie, créatif ou mini-jeux',
    testimonial: { quote: "Notre serveur survie a jamais été aussi actif. On joue tous les mercredis.", author: 'Jules', rank: 'Joueur régulier' },
  },
  {
    slug: 'fifa',
    name: 'EA Sports FC',
    shortName: 'FC',
    description:
      'La simulation de football la plus populaire au monde. Joue en ligne, crée ton club ou affronte tes amis.',
    seoDescription:
      'Organise tes sessions EA Sports FC avec Squad Planner. Planifie tes tournois entre amis et tes sessions Pro Clubs.',
    genre: 'Sport',
    players: '1v1 à 11v11',
    platforms: ['PC', 'PlayStation', 'Xbox', 'Switch'],
    icon: '⚽',
    estimatedPlayers: '50M+ joueurs',
    color: 'green',
    tags: ['sport', 'football', 'compétitif', 'ea'],
    specificPainPoint: 'Ton club Pro Clubs tombe à 5 joueurs parce que personne ne confirme',
    specificUseCase: 'Organise tes sessions Pro Clubs et tournois entre amis',
    specificFeatures: ['Planification de matchs Pro Clubs', 'Tournois entre amis', 'Rappels le jour du match'],
    lfgSpecificCopy: 'Cherche des joueurs pour Pro Clubs ou tournois FUT',
    testimonial: { quote: "On a enfin un club Pro Clubs complet chaque soir. Fini les matchs à 5.", author: 'Karim', rank: 'Division 2' },
  },
  {
    slug: 'call-of-duty',
    name: 'Call of Duty',
    shortName: 'CoD',
    description:
      'La franchise FPS la plus emblématique. Multijoueur intense, Warzone en battle royale et mode Zombies coopératif.',
    seoDescription:
      'Planifie tes sessions Call of Duty avec Squad Planner. Organise tes soirées Warzone, Zombies ou multi avec ta squad.',
    genre: 'FPS',
    players: 'Multijoueur',
    platforms: ['PC', 'PlayStation', 'Xbox'],
    icon: '🎖️',
    estimatedPlayers: '100M+ joueurs',
    color: 'orange',
    tags: ['fps', 'battle-royale', 'zombies', 'activision'],
    specificPainPoint: 'Ta squad Warzone se connecte jamais en même temps',
    specificUseCase: 'Planifie tes soirées Warzone, Zombies ou multi avec ta squad fixe',
    specificFeatures: ['Sessions Warzone squad', 'Soirées Zombies planifiées', 'Multi modes (ranked, casual, customs)'],
    lfgSpecificCopy: 'Cherche des joueurs pour Warzone, ranked ou Zombies',
    testimonial: { quote: "Nos soirées Warzone du vendredi sont devenues sacrées. Tout le monde est là.", author: 'Antoine', rank: 'Iridescent' },
  },
  {
    slug: 'overwatch-2',
    name: 'Overwatch 2',
    shortName: 'OW2',
    description:
      "Hero shooter 5v5 par Blizzard. Chaque héros a un rôle unique : Tank, DPS ou Support. Travail d'équipe essentiel.",
    seoDescription:
      'Organise tes sessions Overwatch 2 avec Squad Planner. Trouve des joueurs par rôle, planifie tes ranked et grimpe en SR.',
    genre: 'Hero Shooter',
    players: '5v5',
    platforms: ['PC', 'PlayStation', 'Xbox', 'Switch'],
    icon: '🦸',
    estimatedPlayers: '25M+ joueurs actifs',
    color: 'orange',
    tags: ['hero-shooter', 'fps', 'compétitif', 'blizzard'],
    specificPainPoint: 'Impossible de composer une team équilibrée quand personne ne confirme son rôle',
    specificUseCase: 'Compose ta team par rôle (Tank, DPS, Support) et grimpe en ranked',
    specificFeatures: ['Composition par rôle', 'Sessions ranked planifiées', 'Suivi de SR collectif'],
    lfgSpecificCopy: 'Cherche Tank/DPS/Support pour du ranked ou quickplay',
    testimonial: { quote: "On compose notre team à l'avance, plus de surprise au dernier moment.", author: 'Marie', rank: 'Master' },
  },
  {
    slug: 'destiny-2',
    name: 'Destiny 2',
    description:
      'Looter-shooter MMO par Bungie. Raids, strikes, PvP et événements saisonniers dans un univers sci-fi épique.',
    seoDescription:
      'Planifie tes sessions Destiny 2 avec Squad Planner. Organise tes raids, strikes et sessions PvP avec une squad fiable.',
    genre: 'Looter-Shooter / MMO',
    players: '3-6 joueurs',
    platforms: ['PC', 'PlayStation', 'Xbox'],
    icon: '🌌',
    estimatedPlayers: '10M+ joueurs',
    color: 'indigo',
    tags: ['looter-shooter', 'mmo', 'raid', 'bungie'],
    specificPainPoint: 'Trouver 5 joueurs fiables pour un raid de 3 heures un samedi soir',
    specificUseCase: 'Planifie tes raids et strikes avec une équipe qui se présente vraiment',
    specificFeatures: ['Sessions longues (raids 3h+)', 'Check-in obligatoire', 'Planification de raids hebdomadaires'],
    lfgSpecificCopy: 'Cherche des gardiens pour raids, donjons ou Trials',
    testimonial: { quote: "Premier raid Day One réussi grâce à une squad fiable. Tout le monde était prêt.", author: 'Nico', rank: 'Power Level 2000+' },
  },
  {
    slug: 'gta-online',
    name: 'GTA Online',
    shortName: 'GTA',
    description:
      'Le monde ouvert multijoueur de Rockstar Games. Braquages, courses, business et délires entre amis dans Los Santos.',
    seoDescription:
      'Organise tes sessions GTA Online avec Squad Planner. Planifie tes braquages, courses et soirées entre amis.',
    genre: 'Action / Monde ouvert',
    players: "Jusqu'à 30 joueurs",
    platforms: ['PC', 'PlayStation', 'Xbox'],
    icon: '🏎️',
    estimatedPlayers: '30M+ joueurs',
    color: 'lime',
    tags: ['monde-ouvert', 'action', 'braquage', 'rockstar'],
    specificPainPoint: 'Ton braquage tombe à l\'eau parce qu\'il manque toujours quelqu\'un',
    specificUseCase: 'Organise tes braquages, courses et soirées délire avec ta squad',
    specificFeatures: ['Planification de braquages', 'Sessions soirées thématiques', 'Coordination multi-activités'],
    lfgSpecificCopy: 'Cherche des joueurs pour braquages, courses ou délires',
    testimonial: { quote: "Nos braquages du dimanche sont devenus un rituel. Zéro annulation.", author: 'Léo', rank: 'Niveau 300+' },
  },
]

/** Map slug → GameInfo for fast lookups */
export const GAMES_MAP = new Map(GAMES.map((g) => [g.slug, g]))

/** Get all slugs for prerendering */
export function getAllGameSlugs(): string[] {
  return GAMES.map((g) => g.slug)
}

/** Find a game by slug */
export function getGameBySlug(slug: string): GameInfo | undefined {
  return GAMES_MAP.get(slug)
}
