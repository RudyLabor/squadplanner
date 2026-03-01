/**
 * Catalogue de jeux pour les pages SEO /games/:game et /lfg/:game
 * Chaque jeu est identifié par un slug URL-friendly.
 */

export interface GameTestimonial {
  quote: string
  author: string
  rank: string
  role: string
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
    testimonial: { quote: "On est passés de Gold à Diamond en 2 mois grâce à une squad stable. Plus de randoms toxiques.", author: 'Alex_Valo', rank: 'Diamond 2', role: 'Joueur Valorant' },
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
    specificUseCase: 'Monte en ranked avec une squad fixe qui connaît ses rôles',
    specificFeatures: ['Organisation par rôle (Top, Jungle, Mid, ADC, Support)', 'Sessions Clash planifiées', 'Suivi de progression collective'],
    lfgSpecificCopy: 'Cherche des joueurs pour flex ranked ou Clash',
    testimonial: { quote: "Enfin une squad Clash stable. On a gagné notre premier tournoi ensemble après 3 mois de sessions régulières.", author: 'SarahLoL', rank: 'Platine 1', role: 'Joueuse League of Legends' },
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
    testimonial: { quote: "Avec Squad Planner on rate plus aucun event saisonnier. Tout le monde est prêt et on lance dès la première heure.", author: 'Lucas_FN', rank: 'Champion League', role: 'Joueur Fortnite' },
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
    testimonial: { quote: "On fait nos sessions 2v2 tous les mardis et jeudis soir. Plus besoin de chercher un mate au dernier moment.", author: 'Theo_RL', rank: 'Grand Champion', role: 'Joueur Rocket League' },
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
    testimonial: { quote: "Depuis qu'on utilise Squad Planner, on a toujours notre 5e prêt 15 min avant le match. Notre taux de victoire a explosé.", author: 'Max_CS', rank: 'Faceit Niveau 8', role: 'Joueur CS2' },
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
    testimonial: { quote: "Plus de duo forcé en ranked. On joue toujours à 3 maintenant, avec les mêmes Légendes complémentaires.", author: 'Emma_Apex', rank: 'Master', role: 'Joueuse Apex Legends' },
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
    testimonial: { quote: "Notre serveur survie a jamais été aussi actif. On joue tous les mercredis avec 8 personnes minimum.", author: 'Jules_MC', rank: 'Joueur régulier', role: 'Joueur Minecraft' },
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
    testimonial: { quote: "On a enfin un club Pro Clubs complet chaque soir. Fini les matchs à 5 contre 11.", author: 'Karim_FC', rank: 'Division 2', role: 'Joueur EA Sports FC' },
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
    testimonial: { quote: "Nos soirées Warzone du vendredi sont devenues sacrées. 6 semaines d'affilée sans une absence.", author: 'Antoine_CoD', rank: 'Iridescent', role: 'Joueur Call of Duty' },
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
    testimonial: { quote: "On compose notre team à l'avance avec les bons rôles, plus de surprise au dernier moment.", author: 'Marie_OW', rank: 'Master', role: 'Joueuse Overwatch 2' },
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
    testimonial: { quote: "Premier raid Day One réussi grâce à une squad fiable. 6 gardiens connectés pile à l'heure.", author: 'Nico_D2', rank: 'Power Level 2000+', role: 'Joueur Destiny 2' },
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
    testimonial: { quote: "Nos braquages du dimanche sont devenus un rituel. 4 joueurs, zéro annulation depuis 2 mois.", author: 'Leo_GTA', rank: 'Niveau 300+', role: 'Joueur GTA Online' },
  },
  {
    slug: 'palworld',
    name: 'Palworld',
    description:
      'Survie en monde ouvert avec capture de créatures (Pals). Craft, combat et base-building en coop, par Pocketpair.',
    seoDescription:
      'Organise tes sessions Palworld avec Squad Planner. Coordonne ta squad pour explorer, capturer des Pals et construire votre base ensemble.',
    genre: 'Survie / Coop',
    players: 'Jusqu\'à 32 joueurs',
    platforms: ['PC', 'Xbox'],
    icon: '🦎',
    estimatedPlayers: '25M+ joueurs',
    color: 'emerald',
    tags: ['survie', 'coop', 'créatures', 'base-building'],
    specificPainPoint: 'Ton serveur coop avance sans toi parce que personne ne se synchronise',
    specificUseCase: 'Coordonne tes sessions Palworld pour explorer et construire ensemble',
    specificFeatures: ['Sessions coop longues (2h+)', 'Coordination serveur multi-joueurs', 'Planification de raids boss'],
    lfgSpecificCopy: 'Cherche des joueurs pour survie coop ou raids de boss',
    testimonial: { quote: "On a monté une base incroyable en 3 semaines parce que tout le monde jouait aux mêmes heures. Plus de chaos.", author: 'Hugo_PW', rank: 'Niveau 50+', role: 'Joueur Palworld' },
  },
  {
    slug: 'helldivers-2',
    name: 'Helldivers 2',
    description:
      'Shooter coop TPS par Arrowhead. Plonge dans des missions tactiques à 4 joueurs pour défendre la Super Terre.',
    seoDescription:
      'Planifie tes sessions Helldivers 2 avec Squad Planner. Forme ta squad de 4 et accomplissez les missions les plus difficiles ensemble.',
    genre: 'TPS Coop',
    players: 'Squads de 4',
    platforms: ['PC', 'PlayStation'],
    icon: '🪖',
    estimatedPlayers: '12M+ joueurs',
    color: 'amber',
    tags: ['coop', 'tps', 'tactique', 'pve'],
    specificPainPoint: 'Les missions Helldive à 4 deviennent impossibles quand il manque un joueur',
    specificUseCase: 'Assure-toi que ta squad de 4 est complète avant chaque mission',
    specificFeatures: ['Squads de 4 optimisées', 'Sessions mission planifiées', 'Check-in avant déploiement'],
    lfgSpecificCopy: 'Cherche des Helldivers pour missions difficiles ou super samples',
    testimonial: { quote: "Les missions Helldive réussies sont passées de 40% à 90% depuis qu'on joue avec la même squad fiable.", author: 'Clara_HD', rank: 'Helldiver Veteran', role: 'Joueuse Helldivers 2' },
  },
  {
    slug: 'marvel-rivals',
    name: 'Marvel Rivals',
    description:
      'Hero shooter 6v6 par NetEase avec les héros Marvel. Chaque personnage a des pouvoirs uniques pour des combats spectaculaires.',
    seoDescription:
      'Organise tes sessions Marvel Rivals avec Squad Planner. Compose ta team de héros, planifie tes ranked et grimpe ensemble.',
    genre: 'Hero Shooter',
    players: '6v6',
    platforms: ['PC', 'PlayStation', 'Xbox'],
    icon: '🦸‍♂️',
    estimatedPlayers: '20M+ joueurs',
    color: 'red',
    tags: ['hero-shooter', 'fps', 'compétitif', 'marvel'],
    specificPainPoint: 'Composer une team de 6 avec les bons héros quand personne ne confirme son pick',
    specificUseCase: 'Compose ta team Marvel par rôle et grimpe en ranked avec ta squad fixe',
    specificFeatures: ['Composition par rôle (Vanguard, Duelist, Strategist)', 'Sessions ranked planifiées', 'Coordination picks de héros'],
    lfgSpecificCopy: 'Cherche des joueurs pour ranked ou quickplay Marvel Rivals',
    testimonial: { quote: "On a notre team de 6 avec des mains sur chaque rôle. Le ranked n'a jamais été aussi fun.", author: 'Tom_MR', rank: 'Grand Master', role: 'Joueur Marvel Rivals' },
  },
]

/** Map slug → GameInfo for fast lookups */
export const GAMES_MAP = new Map(GAMES.map((g) => [g.slug, g]))

/** Slug aliases for SEO redirects (e.g. /games/ea-sports-fc → /games/fifa) */
const SLUG_ALIASES: Record<string, string> = {
  'ea-sports-fc': 'fifa',
  'eafc': 'fifa',
  'fc25': 'fifa',
  'lol': 'league-of-legends',
  'cod': 'call-of-duty',
  'ow2': 'overwatch-2',
  'gta': 'gta-online',
  'counter-strike-2': 'cs2',
  'counter-strike': 'cs2',
}

/** Get all slugs for prerendering */
export function getAllGameSlugs(): string[] {
  return GAMES.map((g) => g.slug)
}

/** Find a game by slug (supports aliases like ea-sports-fc → fifa) */
export function getGameBySlug(slug: string): GameInfo | undefined {
  const resolved = SLUG_ALIASES[slug] || slug
  return GAMES_MAP.get(resolved)
}
