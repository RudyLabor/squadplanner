/**
 * Utilitaire pour récupérer les images de couverture des jeux
 * Utilise un mapping statique vers des images publiques pour éviter les appels API
 */

// Cache en mémoire pour éviter les recherches répétées
const imageCache = new Map<string, string>();

// Mapping statique des jeux populaires vers leurs images de couverture
// URLs provenant de sources publiques (Wikipedia, Steam, sites officiels)
const GAME_IMAGES: Record<string, string> = {
  // Battle Royale / Shooters
  fortnite:
    'https://image.api.playstation.com/vulcan/ap/rnd/202306/0203/48f0583ba6e02c1e555d1cafcb21d4ff62d1ef2fbf5f7c8f.png',
  valorant:
    'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt5bdbe655c396cea7/5eb7cdc0ee88d36e47d7818b/V_AGENTS_587x900_Jett.png',
  'apex legends':
    'https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-featured-image-16x9.jpg.adapt.crop191x100.1200w.jpg',
  'counter-strike':
    'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg',
  'cs:go':
    'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg',
  'cs2':
    'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg',
  overwatch:
    'https://images.blz-contentstack.com/v3/assets/blt2477dcaf4ebd440c/blt6ffc0c5e37b07bcd/62f28cd87058e60932fc4aff/OW_MenuArt_Tracer_4K_PNG.png',
  'overwatch 2':
    'https://images.blz-contentstack.com/v3/assets/blt2477dcaf4ebd440c/blt6ffc0c5e37b07bcd/62f28cd87058e60932fc4aff/OW_MenuArt_Tracer_4K_PNG.png',
  'call of duty':
    'https://www.callofduty.com/content/dam/atvi/callofduty/cod-touchui/kronos/common/social-share/social-share-image.jpg',
  warzone:
    'https://www.callofduty.com/content/dam/atvi/callofduty/cod-touchui/kronos/common/social-share/social-share-image.jpg',

  // MOBA / Strategy
  'league of legends':
    'https://images.contentstack.io/v3/assets/blt187521ff0727be24/bltad3c18c0b5ef7574/60ee0e87e7d6fc0f2ef6f82e/lol-logo-rendered-hi-res.png',
  'dota 2':
    'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/570/header.jpg',

  // Sports
  fifa: 'https://media.contentapi.ea.com/content/dam/ea/fifa/fifa-23/common/featured-tiles/fifa-23-featured-tile-16x9.jpg.adapt.crop191x100.1200w.jpg',
  'fc 24':
    'https://media.contentapi.ea.com/content/dam/ea/fifa/fc-24/common/featured-tiles/fc-24-featured-tile-16x9.jpg.adapt.crop191x100.1200w.jpg',
  'nba 2k':
    'https://cdn2.steamgriddb.com/grid/8e9c6f1f14d0f4c8a1e1c9e5c9a0c1a1.png',
  'rocket league':
    'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/252950/header.jpg',

  // Sandbox / Survival
  minecraft:
    'https://www.minecraft.net/content/dam/games/minecraft/key-art/Homepage_Discover-1.jpg',
  'grand theft auto':
    'https://media-rockstargames-com.akamaized.net/tina-uploads/posts/ak73k52o384359/aabd436ada0c049b97a0c5812c6192bb4f42d90c.jpg',
  gta: 'https://media-rockstargames-com.akamaized.net/tina-uploads/posts/ak73k52o384359/aabd436ada0c049b97a0c5812c6192bb4f42d90c.jpg',
  'gta v':
    'https://media-rockstargames-com.akamaized.net/tina-uploads/posts/ak73k52o384359/aabd436ada0c049b97a0c5812c6192bb4f42d90c.jpg',
  rust: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/252490/header.jpg',

  // Autres jeux populaires
  destiny:
    'https://www.bungie.net/7/ca/destiny/bgs/new_light/hero_desktop.jpg',
  'destiny 2':
    'https://www.bungie.net/7/ca/destiny/bgs/new_light/hero_desktop.jpg',
  forza:
    'https://compass-ssl.xbox.com/assets/56/39/56398597-4913-4663-9faf-5a62c48df7d5.jpg',
  halo: 'https://www.halowaypoint.com/images/halo-infinite/logos/halo-infinite-logo.png',
  pubg: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/578080/header.jpg',
  'rainbow six':
    'https://staticctf.ubisoft.com/J3yJr34U2pZ2Ieem48Dwy9uqj5PNUQTn/2nF9rD1kMgqPLB2h3WVQdg/ec0cfbc3bf1f70f5b8be5ffd32f61daa/r6s-featured-tile-16x9.jpg',
  'world of warcraft':
    'https://bnetcmsus-a.akamaihd.net/cms/template_resource/FWLOR72GM5S01509666988943.jpg',
  wow: 'https://bnetcmsus-a.akamaihd.net/cms/template_resource/FWLOR72GM5S01509666988943.jpg',
};

// Couleurs de gradient pour les fallbacks basées sur la première lettre
const GRADIENT_COLORS: Record<string, [string, string]> = {
  a: ['#667eea', '#764ba2'],
  b: ['#f093fb', '#f5576c'],
  c: ['#4facfe', '#00f2fe'],
  d: ['#43e97b', '#38f9d7'],
  e: ['#fa709a', '#fee140'],
  f: ['#30cfd0', '#330867'],
  g: ['#a8edea', '#fed6e3'],
  h: ['#ff9a9e', '#fecfef'],
  i: ['#ffecd2', '#fcb69f'],
  j: ['#ff6e7f', '#bfe9ff'],
  k: ['#e0c3fc', '#8ec5fc'],
  l: ['#f093fb', '#f5576c'],
  m: ['#fdfcfb', '#e2d1c3'],
  n: ['#89f7fe', '#66a6ff'],
  o: ['#fddb92', '#d1fdff'],
  p: ['#9890e3', '#b1f4cf'],
  q: ['#ebc0fd', '#d9ded8'],
  r: ['#96fbc4', '#f9f586'],
  s: ['#2af598', '#009efd'],
  t: ['#ee9ca7', '#ffdde1'],
  u: ['#c471f5', '#fa71cd'],
  v: ['#fa709a', '#fee140'],
  w: ['#30cfd0', '#330867'],
  x: ['#a8edea', '#fed6e3'],
  y: ['#fbc2eb', '#a6c1ee'],
  z: ['#fdcbf1', '#e6dee9'],
};

/**
 * Normalise le nom d'un jeu pour la recherche
 */
function normalizeGameName(gameName: string): string {
  return gameName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Génère une couleur de gradient basée sur la première lettre du jeu
 */
function getGradientForGame(gameName: string): [string, string] {
  const firstLetter = gameName.charAt(0).toLowerCase();
  return GRADIENT_COLORS[firstLetter] || ['#667eea', '#764ba2'];
}

/**
 * Récupère l'URL de l'image de couverture d'un jeu
 * @param gameName - Nom du jeu
 * @returns URL de l'image ou une chaîne vide pour utiliser le fallback gradient
 */
export function getGameImageUrl(gameName: string): string {
  if (!gameName) return '';

  // Vérifier le cache
  if (imageCache.has(gameName)) {
    return imageCache.get(gameName)!;
  }

  const normalized = normalizeGameName(gameName);

  // Rechercher dans le mapping statique
  for (const [key, url] of Object.entries(GAME_IMAGES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      imageCache.set(gameName, url);
      return url;
    }
  }

  // Pas d'image trouvée, retourner une chaîne vide pour utiliser le fallback
  imageCache.set(gameName, '');
  return '';
}

/**
 * Récupère le gradient de fallback pour un jeu
 * @param gameName - Nom du jeu
 * @returns CSS gradient string
 */
export function getGameGradient(gameName: string): string {
  const [color1, color2] = getGradientForGame(gameName);
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
}

/**
 * Récupère la première lettre d'un jeu (pour affichage dans le fallback)
 * @param gameName - Nom du jeu
 * @returns Première lettre en majuscule
 */
export function getGameInitial(gameName: string): string {
  return gameName.charAt(0).toUpperCase();
}

/**
 * Vérifie si un jeu a une image de couverture disponible
 * @param gameName - Nom du jeu
 * @returns true si une image est disponible
 */
export function hasGameImage(gameName: string): boolean {
  return getGameImageUrl(gameName) !== '';
}
