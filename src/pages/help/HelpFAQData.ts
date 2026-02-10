export interface FAQItem {
  question: string
  answer: string
  category: string
  illustration?: 'create-squad' | 'reliability-score' | 'plan-session' | 'join-voice'
}

export const FAQ_ITEMS: FAQItem[] = [
  // Getting Started
  {
    category: 'Démarrage',
    question: "Comment créer ma première squad ?",
    answer: "Va dans l'onglet Squads et clique sur 'Créer une squad'. Donne-lui un nom, choisis ton jeu principal, et c'est parti ! Tu recevras un code d'invitation unique à partager avec tes potes. Tu peux aussi ajouter une description et une image pour personnaliser ta squad et la rendre reconnaissable.",
    illustration: 'create-squad'
  },
  {
    category: 'Démarrage',
    question: "Comment inviter des amis dans ma squad ?",
    answer: "Dans ta squad, tu trouveras un code d'invitation unique (ex: ABC123). Partage ce code à tes amis, ils pourront le coller dans 'Rejoindre une squad' pour te rejoindre. Le code ne change pas sauf si tu le régénères manuellement depuis les paramètres de la squad. Tu peux aussi copier le lien d'invitation directement pour le partager sur Discord ou WhatsApp."
  },
  {
    category: 'Démarrage',
    question: "C'est quoi le score de fiabilité ?",
    answer: "Ton score de fiabilité (0-100%) montre à quel point tu es régulier. Quand tu confirmes ta présence à une session et que tu te pointes vraiment, ton score augmente. Si tu ghost ta squad, il baisse. Un score élevé = ta squad peut compter sur toi ! Le coach IA utilise aussi ce score pour prédire la probabilité qu'une session se lance.",
    illustration: 'reliability-score'
  },

  // Sessions
  {
    category: 'Sessions',
    question: "Comment planifier une session ?",
    answer: "Dans une squad, clique sur 'Planifier une session'. Choisis la date, l'heure, et le nombre minimum de joueurs requis. Les membres de ta squad recevront une notification pour confirmer leur présence. Tu peux aussi ajouter des notes (par exemple le mode de jeu ou la map) pour que tout le monde soit au courant du programme.",
    illustration: 'plan-session'
  },
  {
    category: 'Sessions',
    question: "Quand une session est-elle confirmée ?",
    answer: "Une session passe en 'confirmée' automatiquement quand le nombre minimum de joueurs (que tu as défini) ont répondu 'Présent'. Par défaut c'est 3 joueurs, mais tu peux ajuster ce seuil à la création de la session. Tu verras une jauge de progression en temps réel qui indique combien de joueurs manquent encore."
  },
  {
    category: 'Sessions',
    question: "Je peux changer ma réponse après avoir RSVP ?",
    answer: "Oui ! Tu peux modifier ta réponse à tout moment avant le début de la session. Mais attention, changer à la dernière minute (moins de 30 minutes avant le début) peut affecter ton score de fiabilité. Pour modifier, retourne simplement sur la session et clique sur ton nouveau statut."
  },

  // Party Vocale
  {
    category: 'Party Vocale',
    question: "Comment rejoindre une party vocale ?",
    answer: "Va dans l'onglet Party ou clique sur 'Rejoindre' sur n'importe quelle squad. Assure-toi d'autoriser l'accès à ton micro quand le navigateur te le demande. Une fois connecté, tu peux te mute/unmute avec le bouton micro, et régler le volume de chaque participant individuellement.",
    illustration: 'join-voice'
  },
  {
    category: 'Party Vocale',
    question: "Ma voix ne passe pas, que faire ?",
    answer: "Voici les étapes à suivre dans l'ordre : 1) Vérifie que ton micro n'est pas muté dans l'app. 2) Va dans Paramètres > Audio et sélectionne le bon périphérique micro. 3) Vérifie les permissions de ton navigateur (clique sur l'icône cadenas dans la barre d'adresse). 4) Essaie un autre navigateur (Chrome est recommandé pour la meilleure compatibilité). Si le problème persiste, redémarre ton navigateur ou essaie en navigation privée."
  },
  {
    category: 'Party Vocale',
    question: "Combien de personnes peuvent rejoindre une party ?",
    answer: "En version gratuite, jusqu'à 8 personnes par party vocale. Avec Premium, tu peux avoir jusqu'à 15 personnes en audio HD. La qualité audio s'adapte automatiquement en fonction de ta connexion pour garantir une expérience fluide sans coupures."
  },

  // Premium
  {
    category: 'Premium',
    question: "Quels sont les avantages Premium ?",
    answer: "Squads illimitées, stats avancées avec prédictions IA, audio HD pour les parties vocales, historique illimité, rôles personnalisés, et badge Premium visible par ta squad. Tu bénéficies aussi d'un accès prioritaire aux nouvelles fonctionnalités et d'un export calendrier pour synchroniser tes sessions avec Google Calendar ou iCal."
  },
  {
    category: 'Premium',
    question: "Je peux annuler mon abonnement ?",
    answer: "Oui, à tout moment depuis ton Profil > Gérer l'abonnement. Tu garderas l'accès Premium jusqu'à la fin de ta période payée, sans frais supplémentaires. Le processus d'annulation prend moins de 30 secondes et tu peux te réabonner quand tu veux."
  },
  {
    category: 'Premium',
    question: "C'est pour moi ou pour toute ma squad ?",
    answer: "L'abonnement est personnel. Cependant, certains avantages s'appliquent à tes squads (comme les rôles avancés et les stats détaillées). Tes potes n'ont pas besoin d'être Premium pour profiter de l'audio HD quand tu es dans la party. On offre aussi une garantie satisfait ou remboursé de 30 jours."
  },

  // Compte
  {
    category: 'Compte',
    question: "Comment modifier mon profil ?",
    answer: "Va dans l'onglet Profil et clique sur 'Modifier le profil'. Tu peux changer ton pseudo, ta bio, ta photo de profil, et ton fuseau horaire. Tes modifications sont sauvegardées automatiquement et visibles par les membres de tes squads."
  },
  {
    category: 'Compte',
    question: "Comment supprimer mon compte ?",
    answer: "Va dans Paramètres > Données > Supprimer mon compte. Attention, cette action est irréversible et toutes tes données seront définitivement effacées (profil, messages, statistiques, squads). Avant de supprimer, tu peux exporter tes données au format JSON via le bouton 'Exporter mes données' juste au-dessus."
  },
]

export const CATEGORIES = ['Démarrage', 'Sessions', 'Party Vocale', 'Premium', 'Compte']
