export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string // HTML content
  date: string // ISO date
  author: string
  tags: string[]
  readTime: number // minutes
  coverEmoji: string // emoji as cover placeholder
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'guilded-alternatives-2026',
    title: 'Guilded a fermé : les 5 meilleures alternatives en 2026',
    excerpt:
      'Guilded a arrêté ses services en 2024. Découvre les meilleures alternatives pour organiser ta communauté gaming.',
    date: '2026-02-15',
    author: 'Squad Planner Team',
    tags: ['alternatives', 'communauté', 'plateforme'],
    readTime: 8,
    coverEmoji: '🎮',
    content: `<article>
      <h2>Guilded a fermé : les 5 meilleures alternatives en 2026</h2>

      <p>La plateforme Guilded, pendant longtemps considérée comme une excellente alternative à Discord pour les communautés gaming, a cessé ses activités en 2024. Cette fermeture a laissé de nombreuses équipes et guildes en quête d'une solution comparable pour organiser leurs événements, gérer leurs membres et maintenir une communication efficace.</p>

      <p>Si toi aussi tu cherches la meilleure plateforme pour remplacer Guilded, cet article te présentera les 5 meilleures alternatives disponibles en 2026, avec leurs avantages et inconvénients respectifs.</p>

      <h3>1. Squad Planner - La solution tout-en-un (⭐ Notre choix)</h3>

      <p>Squad Planner est née directement de la demande des communautés gaming qui cherchaient une alternative à Guilded. Contrairement à Discord, qui se concentre sur la communication, Squad Planner offre une suite complète d'outils d'organisation spécifiquement conçue pour les gamers.</p>

      <p><strong>Avantages :</strong></p>
      <ul>
        <li>Système de fiabilité et de scoring pour les joueurs</li>
        <li>Planification d'événements intégrée avec confirmation de présence avancée</li>
        <li>Gestion des sessions et des squads en temps réel</li>
        <li>Interface épurée et intuitive</li>
        <li>Absence de publicités</li>
        <li>Calendrier intégré pour visualiser tous tes événements</li>
        <li>Support français natif</li>
      </ul>

      <p><strong>Inconvénients :</strong></p>
      <ul>
        <li>Moins mature que Discord (mais en évolution rapide)</li>
        <li>Communauté plus réduite (mais croissante)</li>
        <li>Communauté encore en pleine croissance</li>
      </ul>

      <h3>2. Discord - Le géant incontournable</h3>

      <p>Discord reste la plateforme de communication numéro un pour les gamers. Si Guilded te plaisait principalement pour ses fonctionnalités de communication vocale et textuelle, Discord est ton meilleur choix.</p>

      <p><strong>Avantages :</strong></p>
      <ul>
        <li>Qualité vocale exceptionnelle</li>
        <li>Écosystème de bots gigantesque</li>
        <li>Stabilité et fiabilité reconnues</li>
        <li>Intégrations avec la plupart des jeux</li>
        <li>Très grande communauté mondiale</li>
      </ul>

      <p><strong>Inconvénients :</strong></p>
      <ul>
        <li>Manque de fonctionnalités d'organisation d'événements natives</li>
        <li>Interface parfois complexe pour les débutants</li>
        <li>Publicités ciblées dans le client</li>
        <li>Moins adapté à la gestion d'équipes compétitives</li>
      </ul>

      <h3>3. TeamSpeak - La référence pour la voix</h3>

      <p>TeamSpeak 5 a été complètement repensé pour rivaliser avec les solutions modernes. Si la qualité audio est ta priorité absolue, TeamSpeak mérite d'être considéré.</p>

      <p><strong>Avantages :</strong></p>
      <ul>
        <li>Qualité audio ultra-faible latence</li>
        <li>Système de permissions très granulaire</li>
        <li>Solution auto-hébergée possible (serveurs privés)</li>
        <li>Léger en ressources</li>
      </ul>

      <p><strong>Inconvénients :</strong></p>
      <ul>
        <li>Pas de chat texte aussi développé que Discord</li>
        <li>Apprentissage plus complexe pour l'administration</li>
        <li>Communauté moins active que Discord</li>
        <li>Pas d'outils intégrés pour l'organisation d'événements</li>
      </ul>

      <h3>4. Slack - Pour les équipes professionnelles</h3>

      <p>Bien que moins orienté gaming que Guilded, Slack a gagné en adoption au sein des équipes compétitives qui apprécient sa structure et son professionnalisme.</p>

      <p><strong>Avantages :</strong></p>
      <ul>
        <li>Organisation par canaux très claire</li>
        <li>Historique de conversation indestructible</li>
        <li>Intégrations professionnelles massives</li>
        <li>Sécurité et conformité de haut niveau</li>
      </ul>

      <p><strong>Inconvénients :</strong></p>
      <ul>
        <li>Coûteux pour les grands groupes</li>
        <li>Pas de support audio natif de qualité</li>
        <li>Atmosphère trop "work" pour des communautés gaming</li>
        <li>Pas de fonctionnalités de gaming spécifiques</li>
      </ul>

      <h3>5. Revolt - L'alternative open-source</h3>

      <p>Revolt est une plateforme open-source qui prend sérieusement la vie privée des utilisateurs. Elle attire ceux qui recherchent une alternative décentralisée à Discord.</p>

      <p><strong>Avantages :</strong></p>
      <ul>
        <li>Entièrement open-source</li>
        <li>Respect de la vie privée garanti</li>
        <li>Interface familière pour les utilisateurs de Discord</li>
        <li>Gratuit sans limitations</li>
      </ul>

      <p><strong>Inconvénients :</strong></p>
      <ul>
        <li>Écosystème de bots moins développé</li>
        <li>Communauté très jeune et petite</li>
        <li>Performance parfois instable</li>
        <li>Support communautaire limité</li>
        <li>Aucune fonctionnalité gaming native</li>
      </ul>

      <h3>Quel choix faire\u00a0?</h3>

      <p>Ton choix dépend de tes priorités :</p>
      <ul>
        <li><strong>Tu cherches une organisation d'équipe gaming complète\u00a0?</strong> → Squad Planner</li>
        <li><strong>Tu privilégies la communication et la voix\u00a0?</strong> → Discord ou TeamSpeak</li>
        <li><strong>Tu as une équipe compétitive professionnelle\u00a0?</strong> → Slack + Squad Planner</li>
        <li><strong>Tu veux respecter ta vie privée\u00a0?</strong> → Revolt</li>
      </ul>

      <p>En 2026, la meilleure stratégie est souvent d'utiliser <strong>Squad Planner pour l'organisation, le chat et la party vocale gaming</strong> et <strong>Discord pour la communauté élargie</strong>. Les deux plateformes se complètent parfaitement et offrent la meilleure expérience pour les communautés gaming modernes.</p>

      <p>Guilded nous manquera, mais l'écosystème gaming n'a jamais été aussi riche en options. À toi de trouver la combinaison parfaite pour ta squad\u00a0!</p>
    </article>`,
  },
  {
    slug: 'organiser-tournoi-entre-amis',
    title: 'Comment organiser un tournoi entre amis en 5 étapes',
    excerpt:
      'Guide complet pour organiser un tournoi gaming fluide et mémorable grâce à Squad Planner. Que tu sois débutant ou expérimenté, tu trouveras tous les conseils pour réussir.',
    date: '2026-02-10',
    author: 'Squad Planner Team',
    tags: ['tournoi', 'organisation', 'guide'],
    readTime: 10,
    coverEmoji: '🏆',
    content: `<article>
      <h2>Comment organiser un tournoi entre amis en 5 étapes</h2>

      <p>Organiser un tournoi gaming entre amis peut sembler complexe : coordonner les horaires, gérer les brackets, communiquer avec les participants, valider les résultats... Mais avec une bonne méthode et les bons outils, c'est bien plus simple qu'il n'y paraît\u00a0!</p>

      <p>Dans ce guide complet, je te montrerai comment organiser un tournoi fluide et mémorable en utilisant Squad Planner. Que tu organises ton premier tournoi ou que tu sois déjà expérimenté, tu trouveras des astuces pour améliorer ton approche.</p>

      <h3>Étape 1 : Définir les paramètres du tournoi</h3>

      <p>Avant de convier tes amis, tu dois établir les fondamentaux. Cette étape est cruciale pour éviter les malentendus plus tard.</p>

      <p><strong>Questions à te poser :</strong></p>
      <ul>
        <li><strong>Quel jeu\u00a0?</strong> Assure-toi que tous tes participants le possèdent et le maîtrisent à peu près au même niveau</li>
        <li><strong>Format\u00a0?</strong> 1v1, 2v2, battle royale\u00a0? Élimination directe ou round-robin\u00a0?</li>
        <li><strong>Nombre de participants\u00a0?</strong> 4-8 pour un premier tournoi, plutôt que 20 qui devient ingérable</li>
        <li><strong>Dates et horaires\u00a0?</strong> Prévoir des créneaux pratiques pour tous (notamment les fuseaux horaires différents)</li>
        <li><strong>Lots/récompenses\u00a0?</strong> Purement symboliques (skins in-game) ou réels (cadeaux Amazon)\u00a0? C'est optionnel mais ça crée de la motivation</li>
        <li><strong>Règles spécifiques\u00a0?</strong> Perks autorisés\u00a0? Perso limité\u00a0? Bugs à éviter\u00a0?</li>
      </ul>

      <p>Prends 30 minutes pour documenter tout cela clairement. Cela t'évitera 3 heures de débats le jour J.</p>

      <h3>Étape 2 : Créer la squad et l'événement sur Squad Planner</h3>

      <p>Squad Planner rend cette étape triviale. Voici comment procéder :</p>

      <p><strong>Crée d'abord une squad dédiée :</strong></p>
      <ul>
        <li>Va dans "Squads" et crée une nouvelle squad appelée "[Jeu] - Tournoi 2026" ou quelque chose de mémorable</li>
        <li>Invite tous tes participants. Idéalement, fais-le un mois avant le tournoi pour qu'ils acceptent</li>
        <li>Mets un emoji sympathique en cover : 🏆, ⚔️, ou 🎮</li>
      </ul>

      <p><strong>Crée un événement pour chaque étape :</strong></p>
      <ul>
        <li><strong>Jour 0 (optionnel):</strong> "Warm-up" 2-3 jours avant le tournoi pour que chacun se chauffe</li>
        <li><strong>Jour 1:</strong> "Tournoi - Demi-finales" (ou ton format)</li>
        <li><strong>Jour 2:</strong> "Tournoi - Finales" (si multi-jour)</li>
      </ul>

      <p>Pour chaque événement, utilise la description pour rappeler :</p>
      <ul>
        <li>L'heure exacte de début (avec ton fuseau horaire)</li>
        <li>Un lien Discord pour l'audio si tu en as un</li>
        <li>Les règles importantes</li>
        <li>Comment signaler un résultat</li>
      </ul>

      <h3>Étape 3 : Communiquer et valider les présences</h3>

      <p>C'est l'une des forces majeures de Squad Planner : la gestion des présences et la fiabilité.</p>

      <p><strong>Avant le tournoi :</strong></p>
      <ul>
        <li>Envoie un message récapitulatif 2 semaines avant : "Hey la team, tournoi le 1er mars\u00a0! Confirme ta présence sur l'événement"</li>
        <li>Relance 1 semaine avant</li>
        <li>Relance 24h avant : c'est crucial pour savoir qui sera là</li>
      </ul>

      <p><strong>Utilise la confirmation de présence de Squad Planner :</strong></p>
      <ul>
        <li>Les participants qui cliquent sur "Je viens" sont comptabilisés automatiquement</li>
        <li>Squad Planner t'avertit en temps réel si quelqu'un valide ou annule sa présence</li>
        <li>Tu vois les taux de présence estimée</li>
      </ul>

      <p><strong>Gère les no-shows :</strong></p>
      <ul>
        <li>Si quelqu'un confirme mais n'apparaît pas, Squad Planner marque automatiquement sa fiabilité</li>
        <li>Pour les futurs tournois, tu sauras qui est fiable et qui ne l'est pas</li>
        <li>Cela crée une culture d'engagement naturelle dans ta communauté</li>
      </ul>

      <h3>Étape 4 : Gérer les matchs en temps réel</h3>

      <p>Le jour J, tu dois être organisé. Voici le workflow :</p>

      <p><strong>30 minutes avant :</strong></p>
      <ul>
        <li>Tous les joueurs rejoignent ton Discord ou plateforme vocale</li>
        <li>Fais un test audio rapide</li>
        <li>Rappelle les règles\u00a0: pas d'excuses, pas de report</li>
      </ul>

      <p><strong>Pendant le tournoi :</strong></p>
      <ul>
        <li>Utilise un tableau pour tracker les résultats (bracket.gg, AEStournaments, ou même un simple Google Sheets visible)</li>
        <li>Après chaque match, le gagnant poste un screenshot du résultat en chat</li>
        <li>Tu valides et passes au match suivant</li>
        <li>Garde le tempo : c'est important que personne n'attende plus de 10 minutes entre ses matchs</li>
      </ul>

      <p><strong>Utilise Squad Planner pour :</strong></p>
      <ul>
        <li>Un "rapport de tournoi" que tu poses dans la session principale</li>
        <li>Documenter les upsets et les faits marquants</li>
        <li>Laisser les joueurs commenter et réagir après</li>
      </ul>

      <h3>Étape 5 : Conclure et célébrer</h3>

      <p>Ne termine pas abruptement ton tournoi. Crée du momentum pour les futurs.</p>

      <p><strong>Immédiatement après :</strong></p>
      <ul>
        <li>Annonce les top 3 en grande pompe sur Discord / Squad Planner</li>
        <li>Attribue les lots/récompenses (skins, rôles Discord, ce que tu avais promis)</li>
        <li>Poste des screenshots des moments clés dans le chat</li>
      </ul>

      <p><strong>Dans les 48h :</strong></p>
      <ul>
        <li>Publie un résumé avec les statistiques : "Marc a remporté le tournoi avec un ratio 2-0\u00a0! Emma a fait une comeback épique au Match 3\u00a0!"</li>
        <li>Crée un moment mémorable : élis le "meilleur joueur du tournoi" (pas juste le vainqueur) comme celui avec le meilleur esprit sportif</li>
        <li>Annonce la date du prochain tournoi : entretenir la dynamique</li>
      </ul>

      <p><strong>Astuces pour ta fiabilité future :</strong></p>
      <ul>
        <li>Ceux qui n'ont pas honoré leur confirmation se voient automatiquement dégradés dans Squad Planner</li>
        <li>Au prochain tournoi, tu peux former des poules en évitant les no-shows connus</li>
        <li>Les gens seront plus vigilants à honorer leurs engagements s'ils savent qu'on suit ça</li>
      </ul>

      <h3>Bonus : Checklist du tournoi</h3>

      <ul>
        <li>☐ Définir le jeu, format, dates, lots</li>
        <li>☐ Créer la squad Squad Planner</li>
        <li>☐ Inviter les participants (30j avant)</li>
        <li>☐ Créer les événements Squad Planner</li>
        <li>☐ Relancer à J-14, J-7, J-1</li>
        <li>☐ Vérifier les confirmations 24h avant</li>
        <li>☐ Préparer un bracket ou système de matchmaking</li>
        <li>☐ Test audio 30min avant</li>
        <li>☐ Lancer les matchs avec tempo</li>
        <li>☐ Annoncer les résultats en grande pompe</li>
        <li>☐ Publier un résumé 48h après</li>
        <li>☐ Annoncer le prochain tournoi</li>
      </ul>

      <h3>Conclusion</h3>

      <p>Organiser un tournoi entre amis n'est pas sorcier. En suivant ces 5 étapes et en utilisant Squad Planner pour coordonner, tu garantis une expérience fluide où tout le monde s'amuse.</p>

      <p>La clé\u00a0? <strong>Clarté</strong>, <strong>communication</strong>, et <strong>suivi des présences</strong>. C'est exactement ce pour quoi Squad Planner a été conçu.</p>

      <p>À toi de jouer, et que les meilleurs gagnent\u00a0!</p>
    </article>`,
  },
  {
    slug: 'squad-ghost-astuces',
    title: '5 astuces pour que ta squad ne ghost plus jamais',
    excerpt:
      "Découvre comment réduire les no-shows et créer une culture d'engagement dans ta communauté gaming.",
    date: '2026-02-05',
    author: 'Squad Planner Team',
    tags: ['squad', 'engagement', 'astuces'],
    readTime: 7,
    coverEmoji: '👥',
    content: `<article>
      <h2>5 astuces pour que ta squad ne ghost plus jamais</h2>

      <p>C'est la frustration numéro un des chefs de squad : tu organises une session, 8 personnes confirment, et le jour J, seules 3 apparaissent. C'est ce qu'on appelle le "ghosting" - et c'est une plaie.</p>

      <p>Si tu as déjà vécu ça, tu sais à quel point c'est démotivant de devoir annuler ou jouer en mode dégradé parce que les gens ne respectent pas leurs engagements.</p>

      <p>Bonne nouvelle : il existe des solutions éprouvées pour pratiquement éliminer le ghosting. Voici mes 5 astuces favorites, et je peux t'assurer qu'elles fonctionnent.</p>

      <h3>Astuce 1 : Utiliser un système de scoring de fiabilité</h3>

      <p>C'est la fondation. Le système doit être <strong>transparent et juste</strong>.</p>

      <p><strong>Comment ça marche :</strong></p>
      <ul>
        <li>Chaque personne a un score de fiabilité (ex: 1-10 ou en pourcentage)</li>
        <li>Quand quelqu'un confirme et vient : +points</li>
        <li>Quand quelqu'un confirme mais ne vient pas (ghost) : -points importants</li>
        <li>Quand quelqu'un confirme, puis annule avant l'heure limite (24h) : perte minime</li>
      </ul>

      <p><strong>C'est ce que fait Squad Planner nativement :</strong></p>
      <ul>
        <li>Le score de fiabilité s'ajuste automatiquement selon tes absences</li>
        <li>Les joueurs voient leur propre score - c'est motivant de le voir augmenter</li>
        <li>Tu peux favoriser les high-reliability players dans tes prochaines sessions</li>
      </ul>

      <p><strong>Impact psychologique :</strong> Les gens ne veulent pas avoir un mauvais score. C'est simple mais ça marche. Dès le moment où quelqu'un réalise que son absence affecte son score public, ils font plus attention.</p>

      <h3>Astuce 2 : Mettre une deadline claire pour l'annulation</h3>

      <p>L'une des raisons majeures du ghosting : les gens ne savent pas clairement quand ils peuvent annuler.</p>

      <p><strong>Établir une règle :</strong></p>
      <ul>
        <li>"Tu peux annuler jusqu'à 24h avant la session sans pénalité"</li>
        <li>"Après cette heure, annuler compte comme un ghost"</li>
      </ul>

      <p>Pourquoi 24h\u00a0? Parce que ça te laisse du temps pour inviter quelqu'un d'autre en remplacement. Et psychologiquement, c'est "assez strict" pour que les gens réfléchissent deux fois avant de confirmer.</p>

      <p><strong>Communication :</strong></p>
      <p>À chaque session, indique clairement dans la description :</p>
      <code>"Deadline annulation : [DATE/HEURE]. Après cette heure, l'absence affectera ta fiabilité."</code>

      <p>Mets aussi un rappel 24h avant. Les gens oublient, ce n'est pas par malveillance.</p>

      <h3>Astuce 3 : Rendre publique la liste de présence (ou au moins partagée)</h3>

      <p>C'est simple mais très efficace : si tous les participants voient qui a confirmé, l'effet de groupe joue en ta faveur.</p>

      <p><strong>Pourquoi ça marche :</strong></p>
      <ul>
        <li>Les gens n'aiment pas être celui qui "gâche" la session</li>
        <li>Si 7 personnes confirmées sont visibles, la 8ème qui veut ghost va hésiter ("tout le monde compte sur moi...")</li>
        <li>Ça crée une forme légère de pression sociale positive</li>
      </ul>

      <p><strong>Comment faire avec Squad Planner :</strong></p>
      <ul>
        <li>La liste des confirmations est visible pour tous les participants de la squad</li>
        <li>Les gens voient qui a dit "oui", "peut-être", "non"</li>
        <li>Juste voir "7 personnes ont confirmé" augmente la responsabilité</li>
      </ul>

      <p><strong>Note importante :</strong> Reste bienveillant. Le but n'est pas de faire honte, mais de créer une culture d'engagement.</p>

      <h3>Astuce 4 : Avoir une "file d'attente" de remplaçants</h3>

      <p>Parfois, même avec les meilleures intentions, quelqu'un ne peut vraiment pas venir. Pas de problème si tu as un backup.</p>

      <p><strong>Stratégie :</strong></p>
      <ul>
        <li>Identifie 3-4 personnes "flexibles" qui peuvent potentiellement t'aider en dernier recours</li>
        <li>Dès qu'une réponse passe à "non" ou que tu as un ghost (24h avant), tu les contactes</li>
        <li>"Hey, une place s'est libérée pour [Session]... tu peux\u00a0?"</li>
      </ul>

      <p><strong>Avantages :</strong></p>
      <ul>
        <li>Ça évite d'annuler la session</li>
        <li>Les remplaçants sont motivés (ils comblent un besoin)</li>
        <li>Tu gardes le moral dans la squad</li>
      </ul>

      <p>Squad Planner simplifie ça : tu peux voir instantanément qui a dit "oui" et qui a dit "non", et tu contactes tes back-ups via message direct.</p>

      <h3>Astuce 5 : Célébrer la fiabilité et les "perfect attendance"</h3>

      <p>Tout ce que tu mesures, tu le renforces. Inversement, mesurer uniquement les absences crée une atmosphère négative.</p>

      <p><strong>Changer la narration :</strong></p>
      <ul>
        <li>Au lieu de "Marc a ghost 2 fois", dis "Clara a 95% de fiabilité, respect\u00a0!"</li>
        <li>Donne un titre/rôle aux gens loyaux : "The Reliable Ones", "Core Crew", etc.</li>
        <li>Une fois par mois, mets en avant le joueur avec le meilleur score de fiabilité</li>
      </ul>

      <p><strong>Idées :</strong></p>
      <ul>
        <li>Crée un classement visible sur ton Discord ou Squad Planner</li>
        <li>Offre des petits avantages aux high-reliability : accès à des sessions premium, rôle Discord spécial, etc.</li>
        <li>Lors de tes tournois, priorise les joueurs avec high reliability</li>
      </ul>

      <p><strong>Impact :</strong> Les gens veulent être reconnus. Valoriser la fiabilité crée une culture où tout le monde veut participer régulièrement.</p>

      <h3>Bonus : Pattern à éviter</h3>

      <p>Pendant que tu appliques ces astuces, attention à :</p>

      <ul>
        <li><strong>Ne pas être trop strict trop tôt :</strong> Donne un cycle de 2-3 semaines où la règle est en place avant de commencer à pénaliser</li>
        <li><strong>Ne pas pénaliser les circonstances légitimes :</strong> Si quelqu'un a un vrai problème (panne internet, urgence familiale), c'est pas un ghost</li>
        <li><strong>Ne pas inviter trop de gens :</strong> Plus le groupe est grand, plus le ghosting augmente. Reste à 6-12 personnes régulières</li>
        <li><strong>Ne pas ignorer les "peut-être" :</strong> Relance les peut-être 48h avant pour clarifier</li>
      </ul>

      <h3>Résumé : La recette</h3>

      <p>En combinant ces 5 astuces, tu obtiens une machine bien huilée :</p>

      <ol>
        <li>Score de fiabilité transparent (Squad Planner fait ça)</li>
        <li>Deadline claire pour annuler (communiquée dans chaque session)</li>
        <li>Confirmations visibles par tous (crée la responsabilité)</li>
        <li>File d'attente de remplaçants (safety net)</li>
        <li>Célébration de la fiabilité (positiver la culture)</li>
      </ol>

      <p>Applique ces stratégies et tu verras ton taux de présence passer de 50% à 85%+ en quelques semaines.</p>

      <p>Et le meilleur\u00a0? Ça crée une squad plus soudée, plus motivée, et plus amusante pour tout le monde.</p>

      <p>À toi de jouer\u00a0!</p>
    </article>`,
  },
]

/**
 * Récupère un article de blog par son slug
 */
export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug)
}

/**
 * Retourne tous les articles de blog triés par date décroissante
 */
export function getAllBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Retourne les posts liés (autres posts avec au moins un tag en commun)
 */
export function getRelatedPosts(currentSlug: string, limit: number = 2): BlogPost[] {
  const current = getBlogPostBySlug(currentSlug)
  if (!current) return []

  return getAllBlogPosts()
    .filter((post) => post.slug !== currentSlug)
    .filter((post) => post.tags.some((tag) => current.tags.includes(tag)))
    .slice(0, limit)
}
