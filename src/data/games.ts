/**
 * Catalogue de jeux pour les pages SEO /games/:game et /lfg/:game
 * Chaque jeu est identifié par un slug URL-friendly.
 */

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
  },
  {
    slug: 'league-of-legends',
    name: 'League of Legends',
    shortName: 'LoL',
    description:
      'MOBA légendaire par Riot Games. 5 joueurs s\'affrontent sur la Faille de l\'Invocateur dans des parties stratégiques intenses.',
    seoDescription:
      'Organise tes sessions League of Legends avec Squad Planner. Planifie tes ranked, trouve des joueurs fiables et monte en rang.',
    genre: 'MOBA',
    players: '5v5',
    platforms: ['PC'],
    icon: '⚔️',
    estimatedPlayers: '150M+ joueurs actifs',
    color: 'blue',
    tags: ['moba', 'stratégie', 'compétitif', 'riot'],
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
  },
  {
    slug: 'cs2',
    name: 'Counter-Strike 2',
    shortName: 'CS2',
    description:
      'Le FPS compétitif par excellence, développé par Valve. Précision, stratégie et travail d\'équipe sont les clés de la victoire.',
    seoDescription:
      'Planifie tes sessions CS2 avec Squad Planner. Organise tes matchs compétitifs, trouve une squad fiable et progresse ensemble.',
    genre: 'FPS Compétitif',
    players: '5v5',
    platforms: ['PC'],
    icon: '💣',
    estimatedPlayers: '35M+ joueurs actifs',
    color: 'amber',
    tags: ['fps', 'compétitif', 'valve', 'tactique'],
  },
  {
    slug: 'apex-legends',
    name: 'Apex Legends',
    description:
      'Battle royale par squads de 3 avec des Légendes aux capacités uniques. Gameplay rapide et nerveux par Respawn Entertainment.',
    seoDescription:
      'Organise tes sessions Apex Legends avec Squad Planner. Trouve des coéquipiers, planifie tes ranked et domine l\'arène.',
    genre: 'Battle Royale / FPS',
    players: 'Squads de 3',
    platforms: ['PC', 'PlayStation', 'Xbox'],
    icon: '🔥',
    estimatedPlayers: '15M+ joueurs actifs',
    color: 'red',
    tags: ['battle-royale', 'fps', 'squad', 'hero-shooter'],
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
  },
  {
    slug: 'overwatch-2',
    name: 'Overwatch 2',
    shortName: 'OW2',
    description:
      'Hero shooter 5v5 par Blizzard. Chaque héros a un rôle unique : Tank, DPS ou Support. Travail d\'équipe essentiel.',
    seoDescription:
      'Organise tes sessions Overwatch 2 avec Squad Planner. Trouve des joueurs par rôle, planifie tes ranked et grimpe en SR.',
    genre: 'Hero Shooter',
    players: '5v5',
    platforms: ['PC', 'PlayStation', 'Xbox', 'Switch'],
    icon: '🦸',
    estimatedPlayers: '25M+ joueurs actifs',
    color: 'orange',
    tags: ['hero-shooter', 'fps', 'compétitif', 'blizzard'],
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
    players: 'Jusqu\'à 30 joueurs',
    platforms: ['PC', 'PlayStation', 'Xbox'],
    icon: '🏎️',
    estimatedPlayers: '30M+ joueurs',
    color: 'lime',
    tags: ['monde-ouvert', 'action', 'braquage', 'rockstar'],
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
