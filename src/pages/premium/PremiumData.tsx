import {
  Users,
  Calendar,
  BarChart3,
  Sparkles,
  Mic2,
  Shield,
  Crown,
} from '../../components/icons'
export const FEATURES = [
  { name: 'Squads', free: '2 max', premium: 'Illimité', icon: Users, highlight: true },
  { name: 'Historique sessions', free: '30 jours', premium: 'Illimité', icon: Calendar, highlight: true },
  { name: 'Stats & Analytics', free: 'Basiques', premium: 'Avancées + Tendances', icon: BarChart3, highlight: true },
  { name: 'IA Coach', free: 'Conseils simples', premium: 'Prédictions + Personnalisé', icon: Sparkles, highlight: true },
  { name: 'Qualité audio Party', free: 'Standard', premium: 'Audio HD Premium', icon: Mic2, highlight: false },
  { name: 'Rôles squad', free: 'Membre / Admin', premium: 'Coach, Manager, Personnalisé', icon: Shield, highlight: false },
  { name: 'Export calendrier', free: false, premium: true, icon: Calendar, highlight: false },
  { name: 'Badge Premium', free: false, premium: true, icon: Crown, highlight: false }
]

export const TESTIMONIALS = [
  { name: 'AlexGaming', squad: 'Les Ranked du Soir', memberSince: 'Membre depuis 6 mois', text: "Depuis qu'on est Premium, plus personne oublie les sessions. Le coach IA nous a fait gagner 2 ranks !", avatarType: 'alex' as const },
  { name: 'MarieGG', squad: 'GG Girls', memberSince: 'Membre depuis 4 mois', text: "L'audio HD fait vraiment la diff en ranked. Et les stats nous aident à voir qui clutch le plus.", avatarType: 'marie' as const },
  { name: 'LucasApex', squad: 'Apex Legends FR', memberSince: 'Membre depuis 8 mois', text: "On gère 5 squads différentes maintenant. Impossible sans Premium !", avatarType: 'lucas' as const }
]

export const FAQ = [
  { q: "Je peux annuler quand je veux ?", a: "Oui ! Tu peux annuler ton abonnement à tout moment depuis ton profil. Tu garderas l'accès Premium jusqu'à la fin de ta période payée." },
  { q: "C'est pour toute ma squad ou juste moi ?", a: "L'abonnement Premium est personnel. Mais quand tu crées une squad, elle bénéficie de certains avantages (squads illimitées, rôles avancés)." },
  { q: "Y a-t-il une période d'essai ?", a: "Oui ! Tu bénéficies de 7 jours d'essai gratuit sans carte bancaire. À la fin de l'essai, tu choisis ton plan. On offre aussi une garantie satisfait ou remboursé de 30 jours sur les abonnements." }
]
