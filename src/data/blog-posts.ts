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

      <p>Squad Planner est né directement de la demande des communautés gaming qui cherchaient une alternative à Guilded. Contrairement à Discord, qui se concentre sur la communication, Squad Planner offre une suite complète d'outils d'organisation spécifiquement conçue pour les gamers.</p>

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

      <p>Tu as envoyé le message à 18h. À 20h, 2 réponses sur 5. À 21h, tu annules. Tu joues solo. Encore.</p>

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
  {
    slug: 'creer-team-esport-2026',
    title: 'Comment créer une team esport en 2026',
    excerpt:
      'Guide complet pour monter ta team esport de zéro\u00a0: recrutement, rôles, planning et outils pour réussir.',
    date: '2026-02-20',
    author: 'Squad Planner Team',
    tags: ['esport', 'team', 'guide'],
    readTime: 9,
    coverEmoji: '🏆',
    content: `<article>
      <h2>Comment créer une team esport en 2026</h2>

      <p>Créer une team esport, ce n'est pas juste rassembler 5 potes sur Discord et lancer une ranked. C'est un vrai projet qui demande de la structure, de la rigueur et une vision claire. En 2026, l'écosystème compétitif est plus accessible que jamais, mais la concurrence est féroce. Voici comment poser les bases d'une équipe solide et durable.</p>

      <h3>1. Définis ton identité et tes objectifs</h3>

      <p>Avant de recruter qui que ce soit, pose-toi les bonnes questions\u00a0:</p>
      <ul>
        <li><strong>Quel jeu\u00a0?</strong> Concentre-toi sur un seul titre au départ. Valorant, League of Legends, Rocket League… choisis celui où tu as le plus d'expertise.</li>
        <li><strong>Quel niveau\u00a0?</strong> Amateur, semi-pro ou pro\u00a0? Sois honnête sur tes ambitions à court terme.</li>
        <li><strong>Quelle culture\u00a0?</strong> Compétition pure, ambiance détendue mais sérieuse, ou mélange des deux\u00a0? Ta culture attirera (ou repoussera) les bons profils.</li>
      </ul>

      <p>Donne un nom à ta team, crée un logo simple et rédige une courte charte. Ces éléments peuvent sembler superficiels, mais ils donnent une identité qui fédère.</p>

      <h3>2. Recrute les bons profils</h3>

      <p>Le recrutement est l'étape la plus critique. Un joueur toxique ou peu fiable peut détruire la dynamique de toute l'équipe.</p>

      <p><strong>Où chercher\u00a0?</strong></p>
      <ul>
        <li>Les serveurs Discord dédiés au jeu</li>
        <li>Les forums et subreddits compétitifs</li>
        <li>La page Discover de Squad Planner, qui te permet de trouver des joueurs par jeu et par région</li>
        <li>Les tournois locaux ou en ligne (observe les joueurs prometteurs)</li>
      </ul>

      <p><strong>Critères de sélection\u00a0:</strong></p>
      <ul>
        <li><strong>Skill\u00a0:</strong> Évidemment, mais ce n'est pas le seul critère</li>
        <li><strong>Fiabilité\u00a0:</strong> Un joueur qui ghost les entraînements ne vaut rien. Le score de fiabilité de Squad Planner t'aide à identifier les joueurs sérieux.</li>
        <li><strong>Communication\u00a0:</strong> En compétition, un joueur qui communique bien vaut mieux qu'un carry silencieux</li>
        <li><strong>Disponibilité\u00a0:</strong> Vérifie que les créneaux correspondent avant de recruter</li>
      </ul>

      <h3>3. Structure les rôles</h3>

      <p>Une team esport, ce n'est pas 5 joueurs égaux. Chacun a un rôle\u00a0:</p>
      <ul>
        <li><strong>IGL (In-Game Leader)\u00a0:</strong> Le stratège, celui qui fait les calls</li>
        <li><strong>Joueurs de rôle\u00a0:</strong> Entry fragger, support, lurker, etc. selon le jeu</li>
        <li><strong>Manager\u00a0:</strong> Gère la logistique, les inscriptions aux tournois, la communication</li>
        <li><strong>Coach (optionnel)\u00a0:</strong> Analyse les replays et propose des ajustements tactiques</li>
      </ul>

      <p>Définis clairement qui fait quoi dès le départ. Les conflits de rôles sont la première cause de dissolution des teams.</p>

      <h3>4. Établis un planning d'entraînement régulier</h3>

      <p>La régularité fait la différence entre une team qui stagne et une qui progresse. Fixe un planning hebdomadaire\u00a0:</p>
      <ul>
        <li><strong>3 à 4 sessions par semaine</strong> minimum pour une team semi-pro</li>
        <li><strong>Mardi, jeudi, dimanche</strong> sont souvent les créneaux les plus populaires</li>
        <li><strong>Durée fixe\u00a0:</strong> 2h par session, pas plus (la fatigue diminue les performances)</li>
      </ul>

      <p>Squad Planner est idéal pour gérer ce planning. Crée des sessions récurrentes, active les rappels automatiques et suis la présence de chaque membre. Tu sauras immédiatement qui s'investit vraiment et qui décroche.</p>

      <h3>5. Inscris-toi aux compétitions</h3>

      <p>Une team qui ne joue que des scrims finit par s'ennuyer. Inscris-toi rapidement à des tournois\u00a0:</p>
      <ul>
        <li><strong>Tournois communautaires</strong> pour commencer (faible enjeu, bonne ambiance)</li>
        <li><strong>Ligues amateurs</strong> comme les opens ESWC, les qualifiers VCT ou les tournois Toornament</li>
        <li><strong>Scrims réguliers</strong> contre d'autres teams de ton niveau</li>
      </ul>

      <p>Chaque compétition est une opportunité d'apprentissage. Gagne ou perd, l'important est de débriefer après chaque match.</p>

      <h3>6. Utilise les bons outils</h3>

      <p>En 2026, une team esport qui gère tout "à la main" se pénalise. Voici ta stack idéale\u00a0:</p>
      <ul>
        <li><strong>Squad Planner\u00a0:</strong> Planning, RSVP, fiabilité, chat d'équipe, analytics</li>
        <li><strong>Discord\u00a0:</strong> Communication vocale pendant les matchs</li>
        <li><strong>Un outil de VOD review\u00a0:</strong> Pour analyser vos parties (Insights.gg, Medal.tv)</li>
        <li><strong>Un tableur partagé\u00a0:</strong> Pour les strats, les compos, les notes de scrim</li>
      </ul>

      <h3>Conclusion</h3>

      <p>Créer une team esport en 2026, c'est un projet passionnant mais exigeant. La clé du succès tient en trois mots\u00a0: <strong>structure</strong>, <strong>régularité</strong> et <strong>communication</strong>. Avec les bons outils et la bonne mentalité, ta team peut aller loin. Commence petit, sois constant, et les résultats suivront.</p>
    </article>`,
  },
  {
    slug: 'meilleurs-horaires-jouer-equipe',
    title: 'Les meilleurs horaires pour jouer en équipe',
    excerpt:
      'Découvre les créneaux optimaux pour rassembler ta squad et maximiser le plaisir de jeu.',
    date: '2026-02-18',
    author: 'Squad Planner Team',
    tags: ['organisation', 'horaires', 'astuces'],
    readTime: 6,
    coverEmoji: '⏰',
    content: `<article>
      <h2>Les meilleurs horaires pour jouer en équipe</h2>

      <p>Tu le sais\u00a0: trouver un créneau qui convient à tout le monde, c'est le défi numéro un des squads. Entre le boulot, les cours, la vie perso et les fuseaux horaires différents, coordonner 4 ou 5 personnes relève parfois de l'exploit. Pourtant, certains créneaux fonctionnent nettement mieux que d'autres.</p>

      <h3>Les créneaux en semaine</h3>

      <p>En semaine, la fenêtre magique pour la plupart des joueurs européens se situe entre <strong>20h30 et 23h00</strong>. C'est le moment où la majorité des gens ont terminé leur journée, dîné, et sont prêts à jouer.</p>

      <ul>
        <li><strong>20h30 - 21h00\u00a0:</strong> Le sweet spot. Assez tard pour que tout le monde soit dispo, assez tôt pour jouer 2-3 heures sans se coucher trop tard.</li>
        <li><strong>21h00 - 22h00\u00a0:</strong> Le pic d'activité. Les serveurs sont remplis, les files d'attente rapides.</li>
        <li><strong>22h00 - 23h00\u00a0:</strong> Encore jouable, mais les joueurs avec des contraintes matinales commencent à décrocher.</li>
      </ul>

      <p>À éviter en semaine\u00a0: les créneaux avant 19h (trop de gens encore occupés) et après 23h30 (fatigue, performances dégradées).</p>

      <h3>Le week-end\u00a0: plus de flexibilité</h3>

      <p>Le week-end ouvre des possibilités supplémentaires\u00a0:</p>

      <ul>
        <li><strong>L'après-midi (14h-17h)\u00a0:</strong> Excellent pour les longues sessions, les tournois, ou les VOD reviews. Tout le monde est frais et dispo.</li>
        <li><strong>Le soir (20h-00h)\u00a0:</strong> Comme en semaine, mais avec moins de pression sur l'heure de fin.</li>
        <li><strong>Le dimanche soir\u00a0:</strong> Souvent le créneau le plus populaire. Dernier moment de détente avant la semaine.</li>
      </ul>

      <h3>Le casse-tête des fuseaux horaires</h3>

      <p>Si ta squad regroupe des joueurs de différents pays, les fuseaux horaires compliquent tout. Un joueur à Paris (UTC+1) et un à Montréal (UTC-5) ont 6 heures de décalage. Quand il est 21h à Paris, il n'est que 15h au Québec.</p>

      <p><strong>Solutions\u00a0:</strong></p>
      <ul>
        <li>Choisis un créneau de compromis (souvent en fin d'après-midi heure européenne / début d'après-midi heure américaine)</li>
        <li>Alterne les créneaux pour ne pas toujours pénaliser les mêmes joueurs</li>
        <li>Utilise Squad Planner pour afficher les horaires dans le fuseau de chaque joueur automatiquement</li>
      </ul>

      <h3>Comment Squad Planner t'aide à trouver le bon créneau</h3>

      <p>Plutôt que d'envoyer un sondage Doodle à chaque session, Squad Planner propose des outils intégrés\u00a0:</p>

      <ul>
        <li><strong>Analytics de présence\u00a0:</strong> Visualise quels jours et quelles heures obtiennent le meilleur taux de présence dans ta squad</li>
        <li><strong>Heatmaps\u00a0:</strong> Identifie les créneaux où tes membres sont le plus souvent disponibles</li>
        <li><strong>Sessions récurrentes\u00a0:</strong> Fixe un créneau régulier et laisse le système gérer les rappels</li>
        <li><strong>Gestion des fuseaux\u00a0:</strong> Chaque joueur voit l'heure de la session dans son propre fuseau</li>
      </ul>

      <h3>Nos recommandations par profil</h3>

      <ul>
        <li><strong>Squad d'étudiants\u00a0:</strong> Semaine 21h-23h, week-end après-midi</li>
        <li><strong>Squad d'actifs\u00a0:</strong> Semaine 20h30-22h30, dimanche après-midi</li>
        <li><strong>Squad internationale\u00a0:</strong> Week-end 17h-19h CET (compromis Europe/Amérique)</li>
        <li><strong>Team esport\u00a0:</strong> 3 créneaux fixes par semaine, dont 1 le week-end</li>
      </ul>

      <h3>Conclusion</h3>

      <p>Le meilleur horaire, c'est celui où tout le monde est là. Pas celui qui est parfait sur le papier, mais celui qui garantit la présence régulière de ta squad. Teste, observe les tendances grâce à tes analytics, et ajuste. Avec un créneau bien choisi et bien communiqué, tu verras ton taux de présence grimper en flèche.</p>
    </article>`,
  },
  {
    slug: 'discord-vs-squad-planner',
    title: 'Discord vs Squad Planner\u00a0: quelle différence\u00a0?',
    excerpt:
      'Discord et Squad Planner remplissent des rôles différents. Découvre pourquoi ils se complètent parfaitement.',
    date: '2026-02-16',
    author: 'Squad Planner Team',
    tags: ['comparaison', 'discord', 'plateforme'],
    readTime: 8,
    coverEmoji: '⚔️',
    content: `<article>
      <h2>Discord vs Squad Planner\u00a0: quelle différence\u00a0?</h2>

      <p>On nous pose souvent la question\u00a0: "Pourquoi utiliser Squad Planner si on a déjà Discord\u00a0?" C'est une question légitime. Discord est fantastique pour la communication, mais quand il s'agit d'organiser concrètement les sessions de jeu de ta squad, ses limites apparaissent rapidement.</p>

      <h3>Discord\u00a0: le roi de la communication</h3>

      <p>Discord excelle dans ce pour quoi il a été conçu\u00a0:</p>
      <ul>
        <li><strong>Chat textuel\u00a0:</strong> Channels organisés par sujet, rôles, permissions granulaires</li>
        <li><strong>Voix\u00a0:</strong> Qualité audio excellente, channels vocaux instantanés</li>
        <li><strong>Communauté\u00a0:</strong> Des millions de serveurs publics, un écosystème de bots énorme</li>
        <li><strong>Intégrations\u00a0:</strong> Spotify, YouTube, Twitch, jeux… tout s'intègre nativement</li>
      </ul>

      <p>Pour discuter, traîner ensemble et partager des memes, Discord est imbattable. Personne ne prétend le contraire.</p>

      <h3>Là où Discord atteint ses limites</h3>

      <p>Essaie d'organiser une session de jeu régulière avec 6 personnes sur Discord. Tu vas vite rencontrer ces problèmes\u00a0:</p>

      <ul>
        <li><strong>Pas de vrai système RSVP\u00a0:</strong> Les "Discord Events" existent, mais ils n'offrent pas de confirmation fiable. Les réactions emoji ne sont pas du RSVP.</li>
        <li><strong>Aucun suivi de fiabilité\u00a0:</strong> Qui a ghost la dernière session\u00a0? Qui est toujours présent\u00a0? Discord ne te le dit pas.</li>
        <li><strong>Pas de rappels intelligents\u00a0:</strong> Un rappel @everyone est spammé, pas ciblé. Les gens mute le channel et ratent les sessions.</li>
        <li><strong>Pas d'analytics\u00a0:</strong> Quel jour fonctionne le mieux\u00a0? Quel taux de présence\u00a0? Impossible à savoir sans outils externes.</li>
        <li><strong>Information noyée\u00a0:</strong> Le message "session ce soir 21h" disparaît dans le flux en 2 minutes</li>
      </ul>

      <h3>Squad Planner\u00a0: l'organisation gaming</h3>

      <p>Squad Planner a été conçu spécifiquement pour résoudre ces problèmes\u00a0:</p>

      <ul>
        <li><strong>RSVP intégré\u00a0:</strong> Présent, Absent, Peut-être — chaque joueur confirme sa présence d'un tap. L'organisateur sait exactement qui sera là.</li>
        <li><strong>Score de fiabilité\u00a0:</strong> Chaque joueur a un score qui reflète sa ponctualité. Les ghosteurs sont identifiés automatiquement.</li>
        <li><strong>Rappels ciblés\u00a0:</strong> Les joueurs qui n'ont pas répondu reçoivent un rappel. Ceux qui ont confirmé reçoivent un rappel 30 minutes avant.</li>
        <li><strong>Analytics de squad\u00a0:</strong> Heatmaps de présence, créneaux optimaux, tendances de participation sur le mois.</li>
        <li><strong>Check-in\u00a0:</strong> Le jour J, les joueurs confirment leur présence réelle. Plus de "j'ai dit oui mais je suis pas là".</li>
        <li><strong>Gamification\u00a0:</strong> XP, challenges, streaks, badges — jouer régulièrement est récompensé</li>
      </ul>

      <h3>Ce que Squad Planner ne remplace pas</h3>

      <p>Soyons honnêtes\u00a0: Squad Planner n'a pas vocation à remplacer Discord. Voici ce que Discord fait mieux\u00a0:</p>

      <ul>
        <li>Les grandes communautés publiques (100+ membres)</li>
        <li>Le streaming en direct dans un channel</li>
        <li>L'écosystème de bots (modération, musique, mini-jeux)</li>
        <li>Le partage d'écran en temps réel</li>
      </ul>

      <h3>La combinaison gagnante</h3>

      <p>Les meilleures squads utilisent les deux\u00a0:</p>

      <ol>
        <li><strong>Squad Planner</strong> pour planifier les sessions, suivre les présences, gérer la fiabilité et motiver les joueurs</li>
        <li><strong>Discord</strong> pour discuter au quotidien, rejoindre le vocal pendant les parties, et maintenir le lien social</li>
      </ol>

      <p>C'est comme utiliser un agenda (Squad Planner) et un téléphone (Discord). L'un planifie, l'autre communique. Ensemble, ils couvrent 100\u00a0% des besoins d'une squad organisée.</p>

      <h3>En résumé</h3>

      <p>Discord est un outil de communication extraordinaire. Squad Planner est un outil d'organisation gaming. Ils ne se concurrencent pas, ils se complètent. Si tu veux que ta squad arrête de ghost et commence à jouer sérieusement ensemble, ajoute Squad Planner à ta stack. Tu garderas Discord pour le fun quotidien.</p>
    </article>`,
  },
  {
    slug: '5-jeux-parfaits-entre-potes',
    title: '5 jeux parfaits pour jouer entre potes en 2026',
    excerpt:
      'Notre sélection des 5 meilleurs jeux multijoueur pour des sessions mémorables avec ta squad.',
    date: '2026-02-14',
    author: 'Squad Planner Team',
    tags: ['jeux', 'recommandation', 'multijoueur'],
    readTime: 7,
    coverEmoji: '🎮',
    content: `<article>
      <h2>5 jeux parfaits pour jouer entre potes en 2026</h2>

      <p>Trouver le bon jeu pour ta squad, c'est la moitié du succès. Un jeu trop compétitif peut créer des tensions, un jeu trop simple peut ennuyer. Voici notre sélection 2026 des jeux qui offrent le meilleur équilibre entre fun, coopération et replay value quand on joue en groupe.</p>

      <h3>1. Valorant — Le tactique qui soude les équipes</h3>

      <p>Valorant reste le roi du FPS tactique en 2026. Avec ses agents aux capacités uniques, chaque joueur a un rôle précis dans l'équipe. C'est le jeu idéal pour les squads qui aiment la compétition et la stratégie.</p>

      <p><strong>Pourquoi c'est parfait en squad\u00a0:</strong></p>
      <ul>
        <li>La communication est essentielle — impossible de jouer sans se parler</li>
        <li>5 joueurs pile, le format squad idéal</li>
        <li>Le ranked à 5 récompense la coordination</li>
        <li>Les compositions d'agents nécessitent une vraie réflexion d'équipe</li>
      </ul>

      <h3>2. Helldivers 2 — Le chaos coopératif</h3>

      <p>Helldivers 2 a explosé et continue de recevoir du contenu régulier. Ce shooter coopératif à 4 joueurs est un pur concentré de fun, de teamwork et de moments hilarants.</p>

      <p><strong>Pourquoi c'est parfait en squad\u00a0:</strong></p>
      <ul>
        <li>Le friendly fire crée des situations mémorables (et des fous rires)</li>
        <li>La difficulté élevée force la coordination</li>
        <li>Les sessions sont courtes (20-40 min par mission), parfait pour les soirées semaine</li>
        <li>Pas besoin d'être un pro pour s'amuser</li>
      </ul>

      <h3>3. Minecraft — L'intemporel créatif</h3>

      <p>Minecraft ne vieillit pas. Que tu construises un empire, que tu explores des caves ou que tu survives ensemble, c'est le jeu de squad par excellence pour les sessions décontractées.</p>

      <p><strong>Pourquoi c'est parfait en squad\u00a0:</strong></p>
      <ul>
        <li>Zéro pression compétitive — juste du fun et de la créativité</li>
        <li>Les projets de construction créent des objectifs à long terme pour la squad</li>
        <li>Accessible à tous les niveaux de skill</li>
        <li>Les mods et serveurs personnalisés renouvellent l'expérience à l'infini</li>
      </ul>

      <h3>4. Lethal Company — L'horreur qui rapproche</h3>

      <p>Lethal Company est le jeu d'horreur coopératif qui fait hurler et rire en même temps. Explorer des lunes abandonnées pour récupérer du loot tout en évitant des créatures terrifiantes\u00a0: le concept est simple mais terriblement efficace.</p>

      <p><strong>Pourquoi c'est parfait en squad\u00a0:</strong></p>
      <ul>
        <li>Les réactions vocales créent des souvenirs inoubliables</li>
        <li>Le travail d'équipe est vital pour survivre</li>
        <li>Les sessions sont courtes et intenses</li>
        <li>Le jeu est léger et tourne sur n'importe quel PC</li>
      </ul>

      <h3>5. It Takes Two — Le chef-d'œuvre à deux</h3>

      <p>Si ta squad se joue parfois à deux, It Takes Two est une pépite. Ce jeu d'aventure coopératif exclusivement en duo offre une variété de gameplay incroyable et une histoire touchante.</p>

      <p><strong>Pourquoi c'est parfait\u00a0:</strong></p>
      <ul>
        <li>Chaque chapitre propose des mécaniques totalement nouvelles</li>
        <li>La coopération est au cœur de chaque puzzle</li>
        <li>Le Friend Pass permet de jouer à deux avec un seul achat</li>
        <li>10-12 heures de contenu de qualité exceptionnelle</li>
      </ul>

      <h3>Comment organiser tes sessions</h3>

      <p>Avoir les bons jeux, c'est bien. Mais si personne ne se pointe aux sessions, ça ne sert à rien. Voici un conseil\u00a0: crée une session dédiée pour chaque jeu sur Squad Planner. Par exemple\u00a0:</p>

      <ul>
        <li>Mardi 21h\u00a0: Valorant ranked</li>
        <li>Jeudi 21h\u00a0: Helldivers 2 missions</li>
        <li>Dimanche 15h\u00a0: Minecraft chill</li>
      </ul>

      <p>Avec des créneaux fixes et des rappels automatiques, ta squad aura toujours quelque chose à attendre avec impatience. Et grâce au système RSVP, tu sauras à l'avance combien de joueurs seront présents pour adapter le jeu en conséquence.</p>

      <h3>Conclusion</h3>

      <p>Le meilleur jeu pour ta squad est celui qui vous fait passer un bon moment ensemble. Varie les genres, alterne entre compétition et détente, et surtout\u00a0: planifie tes sessions pour que tout le monde soit au rendez-vous. Bonne game\u00a0!</p>
    </article>`,
  },
  {
    slug: 'ameliorer-communication-squad',
    title: 'Comment améliorer la communication dans ta squad',
    excerpt:
      'La communication est la clé du succès en équipe. Voici des conseils concrets pour mieux jouer ensemble.',
    date: '2026-02-12',
    author: 'Squad Planner Team',
    tags: ['communication', 'squad', 'teamwork'],
    readTime: 7,
    coverEmoji: '💬',
    content: `<article>
      <h2>Comment améliorer la communication dans ta squad</h2>

      <p>Tu peux avoir les meilleurs joueurs du monde dans ta squad\u00a0: sans communication efficace, vous perdrez contre des équipes moins skilled mais mieux coordonnées. La communication est le multiplicateur de force ultime en gaming.</p>

      <h3>Les bases\u00a0: la communication en jeu</h3>

      <p>En plein match, chaque seconde compte. Ta communication doit être\u00a0:</p>
      <ul>
        <li><strong>Concise\u00a0:</strong> "2 ennemis B" plutôt que "Euh, je crois que j'ai vu des gens, ils étaient vers B je pense"</li>
        <li><strong>Précise\u00a0:</strong> Utilise les callouts officiels de la map. "Long A" est universellement compris, "là-bas à gauche" ne l'est pas.</li>
        <li><strong>Timing\u00a0:</strong> L'info doit arriver au moment où elle est utile, pas 10 secondes après</li>
        <li><strong>Calme\u00a0:</strong> Crier l'info ne la rend pas plus utile. Ça stresse tout le monde.</li>
      </ul>

      <h3>Assigner des rôles de communication</h3>

      <p>Dans une squad bien organisée, tout le monde ne parle pas en même temps\u00a0:</p>
      <ul>
        <li><strong>L'IGL (leader)\u00a0:</strong> Fait les calls stratégiques. Quand il parle, tout le monde écoute.</li>
        <li><strong>Les joueurs\u00a0:</strong> Donnent les infos de leur zone (positions ennemies, cooldowns, ressources) mais ne font pas de calls stratégiques sauf urgence.</li>
        <li><strong>Le shotcaller\u00a0:</strong> En cas de fight, une seule personne décide si on engage ou on se replie.</li>
      </ul>

      <p>Règle d'or\u00a0: pendant un fight, seuls l'IGL et les callouts critiques passent. Les commentaires ("oh noooon", "c'est injuste\u00a0!") polluent le vocal.</p>

      <h3>Le debrief post-session</h3>

      <p>Les meilleures squads progressent parce qu'elles prennent 10 minutes après chaque session pour débriefer\u00a0:</p>

      <ol>
        <li><strong>Qu'est-ce qui a bien marché\u00a0?</strong> Identifiez les rounds ou moments où la coordination était parfaite.</li>
        <li><strong>Qu'est-ce qui a merdé\u00a0?</strong> Sans accuser personne. "On a perdu le contrôle de B" plutôt que "C'est de la faute de Marc".</li>
        <li><strong>Qu'est-ce qu'on change\u00a0?</strong> Un ajustement concret pour la prochaine fois.</li>
      </ol>

      <p>Utilise le chat de Squad Planner pour noter ces points après chaque session. Avec le temps, vous aurez un historique précieux de votre progression.</p>

      <h3>Gérer la toxicité</h3>

      <p>La toxicité tue la communication. Si un joueur rage, insulte ou blame constamment, les autres cessent de parler. C'est un cercle vicieux.</p>

      <p><strong>Règles à établir\u00a0:</strong></p>
      <ul>
        <li>Pas de blame en plein match. Le debrief est fait pour ça.</li>
        <li>Si tu es tilté, mute-toi et respire. Reviens quand tu es calme.</li>
        <li>Critiquer une décision est OK. Attaquer une personne ne l'est jamais.</li>
        <li>L'IGL a le dernier mot. Même si tu n'es pas d'accord, on exécute et on discute après.</li>
      </ul>

      <h3>Les outils qui aident</h3>

      <p>Au-delà du vocal pendant les parties, la communication entre les sessions est tout aussi importante\u00a0:</p>

      <ul>
        <li><strong>Le chat Squad Planner\u00a0:</strong> Pour discuter des prochaines sessions, partager des strats, ou simplement maintenir le lien social</li>
        <li><strong>Les mentions @\u00a0:</strong> Pour interpeller quelqu'un spécifiquement sans spammer tout le monde</li>
        <li><strong>Les threads\u00a0:</strong> Pour organiser les discussions par sujet (strats, recrutement, banter)</li>
        <li><strong>Les sondages\u00a0:</strong> Pour prendre des décisions collectives (quel jeu ce week-end\u00a0? quel créneau\u00a0?)</li>
      </ul>

      <h3>Conclusion</h3>

      <p>La communication est un skill qui se travaille, comme le aim ou le game sense. Investis du temps à améliorer la communication de ta squad et tu verras les résultats immédiatement\u00a0: moins de frustration, plus de victoires, et surtout plus de fun ensemble.</p>
    </article>`,
  },
  {
    slug: 'guide-igl-in-game-leader',
    title: 'Le guide du IGL (In-Game Leader)',
    excerpt:
      'Tout ce que tu dois savoir pour devenir un bon IGL\u00a0: shotcalling, gestion d\u2019équipe et préparation.',
    date: '2026-02-08',
    author: 'Squad Planner Team',
    tags: ['leadership', 'IGL', 'compétitif'],
    readTime: 10,
    coverEmoji: '🧠',
    content: `<article>
      <h2>Le guide du IGL (In-Game Leader)</h2>

      <p>L'IGL, c'est le cerveau de l'équipe. Pas forcément le meilleur joueur en termes de skill pur, mais celui qui fait gagner les rounds grâce à ses décisions. Si tu veux assumer ce rôle — ou si tu le fais déjà sans le savoir — ce guide est pour toi.</p>

      <h3>Qu'est-ce qu'un IGL exactement\u00a0?</h3>

      <p>L'In-Game Leader est le joueur qui\u00a0:</p>
      <ul>
        <li>Décide de la stratégie à chaque round ou phase de jeu</li>
        <li>Fait les calls en temps réel (attaquer, défendre, rotater, sauvegarder)</li>
        <li>Lit le jeu de l'adversaire et adapte le plan</li>
        <li>Maintient le moral de l'équipe pendant les moments difficiles</li>
      </ul>

      <p>En résumé, l'IGL est à la fois stratège, communicateur et leader émotionnel. C'est le rôle le plus exigeant du jeu compétitif.</p>

      <h3>Les qualités d'un bon IGL</h3>

      <p><strong>1. La capacité de décision rapide</strong></p>
      <p>Un bon IGL ne doute pas pendant 10 secondes. Il analyse, décide et communique. Même une décision moyenne exécutée rapidement est meilleure qu'une décision parfaite prise trop tard. Ton équipe a besoin de direction, pas de perfection.</p>

      <p><strong>2. La lecture du jeu (game sense)</strong></p>
      <p>L'IGL doit constamment se demander\u00a0: "Que fait l'adversaire\u00a0?" En analysant les patterns (rotations, timing, tendances de l'équipe ennemie), il anticipe et prend des contre-mesures.</p>

      <p><strong>3. La communication claire</strong></p>
      <p>Les calls doivent être courts, précis et compréhensibles. "On push B ensemble dans 5 secondes, Marc flash, Emma smoke" — tout le monde sait quoi faire. Évite les calls vagues comme "on va essayer un truc".</p>

      <p><strong>4. La gestion émotionnelle</strong></p>
      <p>Perdre 5 rounds d'affilée, c'est dur. L'IGL ne peut pas se permettre de tilter. Au contraire, c'est son rôle de calmer les esprits\u00a0: "On respire, on revient aux fondamentaux, on prend un round à la fois."</p>

      <h3>Comment préparer tes sessions en tant qu'IGL</h3>

      <p>Le travail d'un IGL ne commence pas au début du match. Il commence bien avant\u00a0:</p>

      <ol>
        <li><strong>Analyse les replays\u00a0:</strong> Regarde vos dernières parties. Identifie les patterns qui fonctionnent et ceux qui échouent.</li>
        <li><strong>Prépare 3-4 strats par map\u00a0:</strong> Pas 20 strats complexes. 3 solides que tout le monde connaît par cœur.</li>
        <li><strong>Connais tes joueurs\u00a0:</strong> Qui est en forme\u00a0? Qui a besoin de confiance\u00a0? Adapte ton plan aux forces de chacun.</li>
        <li><strong>Planifie les sessions d'entraînement\u00a0:</strong> Utilise Squad Planner pour fixer des sessions régulières. La régularité est la clé de la progression.</li>
      </ol>

      <h3>Le shotcalling en pratique</h3>

      <p>Voici un framework simple pour tes calls\u00a0:</p>

      <ul>
        <li><strong>Début de round\u00a0:</strong> Annonce le plan ("Default B, on cherche des picks")</li>
        <li><strong>Mid-round\u00a0:</strong> Adapte selon les infos ("Ils stack A, on rotate B execute")</li>
        <li><strong>Clutch\u00a0:</strong> Si un joueur est seul, guide-le calmement ou laisse-le se concentrer en silence</li>
        <li><strong>Entre les rounds\u00a0:</strong> Feedback rapide + annonce du plan suivant</li>
      </ul>

      <p>Adapte le niveau de détail à ton équipe. Avec des joueurs expérimentés, "Default A" suffit. Avec des débutants, détaille chaque position.</p>

      <h3>Gérer les désaccords</h3>

      <p>Ton équipe ne sera pas toujours d'accord avec tes calls. C'est normal. Voici comment gérer\u00a0:</p>

      <ul>
        <li><strong>Pendant le match\u00a0:</strong> L'IGL a le dernier mot. On exécute, on discute après.</li>
        <li><strong>Après le match\u00a0:</strong> Écoute les retours. "Tu avais raison, on aurait dû rotater plus tôt" — cette ouverture renforce la confiance.</li>
        <li><strong>Si tu te trompes\u00a0:</strong> Assume-le. "Mon call était mauvais, on fera différemment." L'humilité inspire le respect.</li>
      </ul>

      <h3>L'IGL et l'organisation de la squad</h3>

      <p>Un bon IGL ne se limite pas au jeu. Il est souvent le moteur organisationnel de la squad\u00a0:</p>

      <ul>
        <li>Il planifie les sessions d'entraînement régulières sur Squad Planner</li>
        <li>Il s'assure que tout le monde est présent et préparé</li>
        <li>Il utilise les analytics de Squad Planner pour identifier qui décroche et pourquoi</li>
        <li>Il organise les VOD reviews et les debriefs</li>
      </ul>

      <p>Le score de fiabilité est un outil précieux pour l'IGL\u00a0: il montre objectivement l'investissement de chaque membre sans avoir à faire de reproches.</p>

      <h3>Conclusion</h3>

      <p>Être IGL, c'est un engagement. C'est prendre des responsabilités que les autres ne veulent pas. Mais c'est aussi le rôle le plus gratifiant\u00a0: quand ta strat fonctionne, quand ton call retourne un round perdu d'avance, quand ton équipe progresse grâce à ta vision — il n'y a rien de comparable. Travaille ta lecture du jeu, communique clairement, et surtout\u00a0: reste calme sous la pression.</p>
    </article>`,
  },
  {
    slug: 'pourquoi-squads-meurent',
    title: 'Pourquoi les squads meurent (et comment sauver la tienne)',
    excerpt:
      'Les 5 raisons principales pour lesquelles les squads se dissolvent, et les solutions pour y remédier.',
    date: '2026-02-06',
    author: 'Squad Planner Team',
    tags: ['retention', 'squad', 'engagement'],
    readTime: 8,
    coverEmoji: '💀',
    content: `<article>
      <h2>Pourquoi les squads meurent (et comment sauver la tienne)</h2>

      <p>Tu as déjà vécu ça\u00a0: une squad qui commence dans l'enthousiasme, des sessions enflammées pendant 2-3 semaines, puis les absences s'accumulent, les messages se font rares, et un jour tu réalises que c'est fini. Personne ne joue plus ensemble.</p>

      <p>Ce n'est pas une fatalité. La plupart des squads meurent pour des raisons identifiables — et évitables. Voici les 5 causes principales et comment les contrer.</p>

      <h3>Raison 1\u00a0: Le planning inconsistant</h3>

      <p>C'est le tueur numéro un. Sans horaire fixe, chaque session devient une négociation\u00a0: "Vous jouez ce soir\u00a0?" "Peut-être." "À quelle heure\u00a0?" "Sais pas." Résultat\u00a0: personne ne s'organise et les sessions deviennent aléatoires.</p>

      <p><strong>La solution\u00a0:</strong></p>
      <ul>
        <li>Fixe 2-3 créneaux récurrents par semaine. Même jours, même heure.</li>
        <li>Crée des sessions récurrentes sur Squad Planner pour que chaque membre les voie dans son calendrier.</li>
        <li>Les rappels automatiques font le reste\u00a0: plus besoin de relancer manuellement.</li>
      </ul>

      <h3>Raison 2\u00a0: Le ghosting non adressé</h3>

      <p>Un joueur ghost une session. Puis deux. Puis trois. Personne ne dit rien. Les autres commencent à se dire "pourquoi je me donnerais la peine si lui ne vient pas\u00a0?" L'effet domino est dévastateur.</p>

      <p><strong>La solution\u00a0:</strong></p>
      <ul>
        <li>Un système de fiabilité transparent. Quand le score baisse, c'est visible par tous.</li>
        <li>Une conversation directe mais bienveillante avec le ghosteur\u00a0: "Hey, tout va bien\u00a0? On a remarqué que tu as raté les 3 dernières sessions."</li>
        <li>Si le joueur ne peut plus venir régulièrement, c'est OK — mais il faut le dire ouvertement plutôt que disparaître.</li>
      </ul>

      <h3>Raison 3\u00a0: L'absence de responsabilité</h3>

      <p>Quand personne ne prend les choses en main, tout le monde attend que quelqu'un d'autre organise. C'est le syndrome du "je viens si quelqu'un crée la session". Sans leader, il ne se passe rien.</p>

      <p><strong>La solution\u00a0:</strong></p>
      <ul>
        <li>Désigne un responsable par squad (pas forcément le meilleur joueur, mais le plus fiable).</li>
        <li>Ce responsable crée les sessions, vérifie les RSVP, relance les absents.</li>
        <li>Avec Squad Planner, ce travail prend 5 minutes par semaine grâce aux sessions récurrentes et aux rappels automatiques.</li>
      </ul>

      <h3>Raison 4\u00a0: Le burnout du leader</h3>

      <p>Le revers de la médaille du point précédent. Si une seule personne fait tout — organise, relance, motive, résout les conflits — elle finit par craquer. Et quand le leader abandonne, la squad suit.</p>

      <p><strong>La solution\u00a0:</strong></p>
      <ul>
        <li>Répartis les responsabilités. Un joueur gère le planning, un autre le recrutement, un troisième les strats.</li>
        <li>Automatise tout ce qui peut l'être\u00a0: rappels automatiques, RSVP en un clic, analytics consultables par tous.</li>
        <li>Le leader doit aussi se sentir écouté et soutenu. Demandez-lui régulièrement comment il va.</li>
      </ul>

      <h3>Raison 5\u00a0: On a oublié le fun</h3>

      <p>Parfois, la squad devient trop sérieuse. Chaque session est ranked tryhard, les debriefs virent au blame game, et le plaisir de jouer ensemble disparaît. Le gaming, c'est d'abord un loisir.</p>

      <p><strong>La solution\u00a0:</strong></p>
      <ul>
        <li>Alterne sessions compétitives et sessions fun (chill games, mini-jeux, sessions "tout est permis").</li>
        <li>Célèbre les victoires, même les petites. Les challenges et badges de Squad Planner sont conçus pour ça.</li>
        <li>Organisez des événements spéciaux\u00a0: soirée tournoi, marathon gaming, découverte d'un nouveau jeu.</li>
        <li>Le système de streaks et d'XP maintient la motivation au quotidien sans pression.</li>
      </ul>

      <h3>Les signes avant-coureurs</h3>

      <p>Ta squad est peut-être en danger si\u00a0:</p>
      <ul>
        <li>Le taux de présence descend en dessous de 60\u00a0%</li>
        <li>Les messages dans le chat se font rares</li>
        <li>Les sessions sont annulées plus souvent que jouées</li>
        <li>Un ou plusieurs membres ne répondent plus aux RSVP</li>
        <li>Le leader semble fatigué ou désengagé</li>
      </ul>

      <p>Si tu repères ces signes, agis vite. Une conversation ouverte avec ta squad peut tout changer.</p>

      <h3>Conclusion</h3>

      <p>Les squads ne meurent pas par accident. Elles meurent par négligence\u00a0: planning flou, ghosting non adressé, responsabilités mal réparties, burnout du leader, ou perte de fun. La bonne nouvelle, c'est que chacun de ces problèmes a une solution. Avec un peu d'organisation et les bons outils, ta squad peut durer des années. Et c'est exactement ce qu'on construit ici.</p>
    </article>`,
  },
  {
    slug: 'ranked-a-5-guide-monter',
    title: 'Ranked à 5\u00a0: le guide pour monter ensemble',
    excerpt:
      'Conseils pratiques pour grimper le ladder en 5-stack\u00a0: planning, rôles, mental et progression.',
    date: '2026-02-03',
    author: 'Squad Planner Team',
    tags: ['ranked', 'compétitif', 'guide'],
    readTime: 9,
    coverEmoji: '📈',
    content: `<article>
      <h2>Ranked à 5\u00a0: le guide pour monter ensemble</h2>

      <p>Jouer en ranked à 5, c'est l'expérience la plus intense et gratifiante du gaming compétitif. Mais c'est aussi la plus exigeante\u00a0: contrairement au solo queue où tu ne dépends que de toi, le 5-stack demande une coordination parfaite. Voici comment transformer ta squad en machine à LP.</p>

      <h3>Le prérequis\u00a0: un planning d'entraînement sérieux</h3>

      <p>Tu ne grimperas pas en jouant "quand on peut". Les meilleurs stacks jouent ensemble régulièrement, aux mêmes horaires, avec la même intensité.</p>

      <ul>
        <li><strong>Minimum 3 sessions par semaine\u00a0:</strong> C'est le seuil pour maintenir la synergie d'équipe</li>
        <li><strong>Sessions de 2-3 heures max\u00a0:</strong> Au-delà, la concentration chute et les performances avec</li>
        <li><strong>Un créneau fixe\u00a0:</strong> Mardi-jeudi-dimanche par exemple. La régularité bat l'intensité.</li>
      </ul>

      <p>Crée des sessions récurrentes sur Squad Planner. Les rappels automatiques garantissent que personne n'oublie, et le score de fiabilité montre qui est vraiment investi dans la montée.</p>

      <h3>Attribuer les rôles et s'y tenir</h3>

      <p>En 5-stack, chaque joueur doit maîtriser un rôle et s'y spécialiser\u00a0:</p>

      <ul>
        <li><strong>IGL\u00a0:</strong> Le stratège qui fait les calls (voir notre guide dédié)</li>
        <li><strong>Entry\u00a0:</strong> Le joueur agressif qui ouvre les sites</li>
        <li><strong>Support\u00a0:</strong> Flash, smoke, heal — celui qui rend les autres meilleurs</li>
        <li><strong>Flex\u00a0:</strong> S'adapte selon la composition adverse</li>
        <li><strong>Anchor\u00a0:</strong> Tient les sites, dernière ligne de défense</li>
      </ul>

      <p>Résiste à la tentation de changer de rôle constamment. La spécialisation crée de la maîtrise, et la maîtrise crée des victoires.</p>

      <h3>La VOD review\u00a0: le secret des teams qui progressent</h3>

      <p>80\u00a0% des teams ne regardent jamais leurs replays. C'est une erreur énorme. Voici comment intégrer la VOD review\u00a0:</p>

      <ol>
        <li><strong>Enregistre chaque session ranked\u00a0:</strong> Medal.tv, OBS, ou le replay intégré du jeu</li>
        <li><strong>Après la session, identifie 2-3 rounds clés\u00a0:</strong> Un round perdu qu'on aurait pu gagner, un round gagné grâce à un bon call</li>
        <li><strong>Analysez ensemble pendant 15 minutes\u00a0:</strong> Pas 2 heures. Ciblez les erreurs récurrentes.</li>
        <li><strong>Définissez un objectif pour la prochaine session\u00a0:</strong> "On améliore notre retake A" ou "On arrête de perdre les anti-eco"</li>
      </ol>

      <p>Utilise le chat Squad Planner pour partager les clips et les notes de VOD review. Avec le temps, vous accumulerez un historique précieux de votre progression.</p>

      <h3>Le mental\u00a0: gérer les lose streaks</h3>

      <p>Toute team traverse des périodes de défaites. La différence entre les teams qui grimpent et celles qui stagnent, c'est leur gestion du mental\u00a0:</p>

      <ul>
        <li><strong>Règle des 2 défaites\u00a0:</strong> Après 2 défaites consécutives, faites une pause de 15 minutes. Hydratez-vous, étirez-vous, décompressez.</li>
        <li><strong>Jamais de blame\u00a0:</strong> "On a perdu en équipe" est la seule phrase acceptable. Le blame détruit la confiance.</li>
        <li><strong>Célébrez les petites victoires\u00a0:</strong> Un beau clutch, une strat bien exécutée, un comeback — même si vous perdez le match.</li>
        <li><strong>Le score n'est pas tout\u00a0:</strong> Si vous progressez dans votre coordination, vous êtes sur la bonne voie même en perdant.</li>
      </ul>

      <h3>Tracker votre progression</h3>

      <p>Ce qui n'est pas mesuré ne s'améliore pas. Suivez ces indicateurs\u00a0:</p>

      <ul>
        <li><strong>Win rate en 5-stack\u00a0:</strong> Visez 55\u00a0%+ pour grimper régulièrement</li>
        <li><strong>Taux de présence\u00a0:</strong> Via Squad Planner, vérifiez que tout le monde est là. Un remplaçant change la dynamique.</li>
        <li><strong>Rounds types gagnés/perdus\u00a0:</strong> Vous perdez toujours les pistol rounds\u00a0? Les retakes\u00a0? Ciblez vos faiblesses.</li>
        <li><strong>Score de fiabilité individuel\u00a0:</strong> Un joueur qui ghost les entraînements pénalise toute l'équipe</li>
      </ul>

      <h3>Le planning type d'une semaine ranked</h3>

      <ul>
        <li><strong>Lundi\u00a0:</strong> Repos ou aim training individuel</li>
        <li><strong>Mardi 21h\u00a0:</strong> Session ranked (3 matchs max)</li>
        <li><strong>Mercredi\u00a0:</strong> VOD review 30 min (async via clips partagés)</li>
        <li><strong>Jeudi 21h\u00a0:</strong> Session ranked avec focus sur l'objectif de la semaine</li>
        <li><strong>Vendredi\u00a0:</strong> Repos</li>
        <li><strong>Samedi\u00a0:</strong> Fun games ou scrims décontractés</li>
        <li><strong>Dimanche 15h\u00a0:</strong> Session ranked longue (5 matchs si tout va bien)</li>
      </ul>

      <h3>Conclusion</h3>

      <p>Monter en ranked à 5, c'est un marathon, pas un sprint. La clé, c'est la régularité\u00a0: sessions fixes, rôles définis, VOD review régulière, et un mental d'acier face aux défaites. Organise ta squad sérieusement, et les LP suivront. À toi de grinder\u00a0!</p>
    </article>`,
  },
  {
    slug: 'gerer-joueur-toxique-squad',
    title: 'Comment gérer un joueur toxique dans ta squad',
    excerpt:
      'Un joueur toxique peut détruire l\u2019ambiance de toute la squad. Voici comment gérer la situation avec tact.',
    date: '2026-02-01',
    author: 'Squad Planner Team',
    tags: ['toxicité', 'management', 'squad'],
    readTime: 6,
    coverEmoji: '🛡️',
    content: `<article>
      <h2>Comment gérer un joueur toxique dans ta squad</h2>

      <p>Il y a ce joueur qui rage après chaque défaite. Qui blame ses coéquipiers systématiquement. Qui transforme chaque session en expérience stressante. Tu le connais, et tu sais que ça plombe l'ambiance pour tout le monde. Mais comment gérer la situation sans faire exploser la squad\u00a0?</p>

      <h3>Reconnaître la toxicité</h3>

      <p>Première étape\u00a0: distinguer une mauvaise journée d'un comportement toxique récurrent. Tout le monde peut tilter une fois. La toxicité, c'est un pattern\u00a0:</p>

      <ul>
        <li><strong>Blame systématique\u00a0:</strong> C'est toujours la faute des autres, jamais la sienne</li>
        <li><strong>Insultes ou remarques blessantes\u00a0:</strong> Même "pour rire", si ça blesse, c'est toxique</li>
        <li><strong>Rage quit\u00a0:</strong> Quitter la partie en cours de match parce qu'il est tilté</li>
        <li><strong>Négativité constante\u00a0:</strong> "On va perdre", "c'est mort", "ce jeu est nul" — à chaque session</li>
        <li><strong>Refus de communiquer\u00a0:</strong> Boude, se mute, ignore les calls après un désaccord</li>
      </ul>

      <p>Si tu coches 2 ou 3 de ces points pour le même joueur, c'est un problème qu'il faut adresser.</p>

      <h3>Étape 1\u00a0: La conversation privée</h3>

      <p>Ne règle jamais ça en public ou en plein match. Contacte le joueur en privé, en DM, calmement\u00a0:</p>

      <ul>
        <li>Commence par le positif\u00a0: "T'es un bon joueur et on aime jouer avec toi."</li>
        <li>Décris le problème sans accuser\u00a0: "Les dernières sessions, il y a eu pas mal de remarques négatives et ça pèse sur l'ambiance."</li>
        <li>Écoute sa version\u00a0: Peut-être qu'il traverse une période difficile. La toxicité est souvent un symptôme, pas la cause.</li>
        <li>Propose des solutions\u00a0: "Si tu sens le tilt monter, mute-toi 2 minutes et respire. On préfère le silence à la négativité."</li>
      </ul>

      <p>Dans 70\u00a0% des cas, cette conversation suffit. Les gens ne réalisent pas toujours l'impact de leur comportement.</p>

      <h3>Étape 2\u00a0: Établir des règles de squad</h3>

      <p>Si le problème est récurrent ou concerne plusieurs joueurs, il est temps de poser des règles claires\u00a0:</p>

      <ol>
        <li><strong>Pas d'insultes, même "pour rire"\u00a0:</strong> Si la personne visée ne rit pas, ce n'est pas drôle.</li>
        <li><strong>Le blame se fait en debrief, pas en match\u00a0:</strong> Pendant la partie, on se concentre sur la solution.</li>
        <li><strong>Le rage quit est inacceptable\u00a0:</strong> Quitter en cours de match pénalise tout le monde.</li>
        <li><strong>Le droit au tilt\u00a0:</strong> Chacun peut dire "je suis tilté, je me mute 2 min" sans jugement.</li>
      </ol>

      <p>Épingle ces règles dans le chat de ta squad sur Squad Planner. Ce n'est pas de la bureaucratie — c'est de la protection pour tout le monde.</p>

      <h3>Étape 3\u00a0: Le suivi objectif</h3>

      <p>Plutôt que de se baser sur des impressions, utilise des données\u00a0:</p>

      <ul>
        <li>Le score de fiabilité de Squad Planner montre objectivement l'engagement de chaque joueur</li>
        <li>Un joueur qui rage quit régulièrement verra son score baisser naturellement</li>
        <li>Les taux de présence révèlent si les autres membres commencent à éviter les sessions à cause d'un joueur problématique</li>
      </ul>

      <p>Ces données permettent d'avoir une conversation factuelle, pas émotionnelle.</p>

      <h3>Étape 4\u00a0: Savoir quand exclure</h3>

      <p>Si malgré la conversation privée et les règles établies, le comportement ne change pas, il faut prendre une décision difficile\u00a0: exclure le joueur.</p>

      <p><strong>Signes qu'il est temps\u00a0:</strong></p>
      <ul>
        <li>Les autres membres commencent à annuler quand ce joueur est présent</li>
        <li>L'ambiance se détériore session après session</li>
        <li>Le joueur refuse de reconnaître le problème malgré plusieurs discussions</li>
        <li>D'autres membres menacent de quitter</li>
      </ul>

      <p><strong>Comment le faire\u00a0:</strong></p>
      <ul>
        <li>En privé, jamais en public</li>
        <li>Avec respect\u00a0: "On pense que la squad n'est pas le bon fit pour toi en ce moment"</li>
        <li>Sans hostilité\u00a0: ne brûle pas les ponts, les gens changent</li>
      </ul>

      <h3>Prévenir plutôt que guérir</h3>

      <p>La meilleure stratégie, c'est de créer une culture où la toxicité n'a pas sa place dès le départ\u00a0:</p>

      <ul>
        <li>Intègre les règles de conduite dès le recrutement</li>
        <li>Valorise les bons comportements (les challenges d'esprit sportif, les badges de fiabilité)</li>
        <li>En tant que leader, montre l'exemple\u00a0: si toi tu ne tiltes pas, les autres suivront</li>
        <li>Crée un espace où dire "je suis frustré" est normal et accepté</li>
      </ul>

      <h3>Conclusion</h3>

      <p>Gérer un joueur toxique, c'est inconfortable. Mais ne rien faire est pire\u00a0: ça détruit l'ambiance, fait fuir les bons joueurs, et tue la squad à petit feu. Avec une approche humaine — conversation privée, règles claires, données objectives et, si nécessaire, exclusion respectueuse — tu protèges ce qui compte vraiment\u00a0: le plaisir de jouer ensemble.</p>
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
 * Retourne tous les slugs des articles de blog
 */
export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug)
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
