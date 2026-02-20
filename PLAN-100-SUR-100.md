# PLAN D'ACTIONS : Squad Planner → Top Mondial 2026

**Évaluation actuelle révisée : 72/100** (après les 30 fixes du QA audit)
**Objectif : 95-100/100** — Niveau Discord, Spotify, WhatsApp

---

## ÉTAT DES LIEUX — Ce qui est DÉJÀ bien

Avant de lister ce qu'il manque, il faut reconnaître les bases solides :

- Design system cohérent avec tokens sémantiques (couleurs, ombres, espacements)
- 453 tests (unit + e2e + a11y) — c'est rare pour une app indie
- Capacitor configuré (iOS/Android) — prêt pour le natif
- Onboarding en 7 étapes — existe déjà
- Analytics PostHog avec event batching
- Error boundaries + Sentry
- SSR avec React Router v7 + Vercel preset
- Web Vitals monitoring
- Système de traduction fr/en
- Voice chat WebRTC natif
- Premium/Stripe intégré

**Ce qui manque pour passer de 72 à 100, c'est du POLISH, de l'IDENTITÉ et de l'OBSESSION DU DÉTAIL.**

---

## PHASE 1 — IDENTITÉ VISUELLE UNIQUE (72 → 78/100)
**Durée estimée : 2-3 semaines**
**Impact : CRITIQUE — C'est ce qui différencie une app "correcte" d'une app mémorable**

### 1.1 Logo & Branding

Actuellement, l'app ressemble à "n'importe quelle app Tailwind dark mode". Les top apps ont une identité visuelle immédiatement reconnaissable.

**Actions :**
- Créer un logo iconique avec un symbole fort (pas juste du texte). Pense au ghost de Snapchat, au bird de Twitter, au controller de PlayStation. Squad Planner a besoin d'un symbole qui dit "gaming + planning + communauté" en un coup d'œil
- Définir une palette de marque signature : ta couleur primary (#5c60ef) est trop générique. Discord a le blurple (#5865F2), Spotify le vert (#1DB954). Choisis UNE couleur signature qui sera immédiatement associée à Squad Planner
- Créer un favicon, splash screen, et app icon qui utilisent ce symbole partout

### 1.2 Typographie distinctive

Inter + Space Grotesk est un combo très commun en 2026. C'est propre mais pas mémorable.

**Actions :**
- Garder Inter pour le body (excellent pour la lisibilité)
- Remplacer Space Grotesk par une display font plus distinctive pour les titres. Suggestions : **Clash Display**, **Satoshi**, **Cabinet Grotesk**, ou même une font custom. Discord utilise gg sans, Spotify utilise Circular — elles sont immédiatement reconnaissables
- Créer une échelle typographique stricte : display-xl, display-lg, heading, subheading, body, caption, micro — avec des line-heights et letter-spacings optimisés pour chaque taille

### 1.3 Iconographie custom

Tu utilises Lucide React (icônes génériques). Toutes les apps qui utilisent Lucide se ressemblent.

**Actions :**
- Créer ou commander un set d'icônes custom pour la navigation principale (5 icônes : Accueil, Squads, Sessions, Party, Messages). Elles doivent avoir un style unique (plus arrondies ? remplissage dégradé ? outline épaisse ?)
- Les icônes secondaires peuvent rester Lucide, mais les 5 principales doivent être uniques

### 1.4 Illustrations & Empty States

Les top apps ne montrent JAMAIS un écran vide avec juste du texte.

**Actions :**
- Créer des illustrations custom pour chaque empty state : pas de squads, pas de sessions, pas de messages, première visite Discover
- Style cohérent : soit flat illustration, soit 3D style, soit une mascotte/personnage. Choisis UN style et applique-le partout
- Chaque empty state doit avoir un CTA clair et engageant

---

## PHASE 2 — MICRO-INTERACTIONS & ANIMATIONS (78 → 84/100)
**Durée estimée : 2-3 semaines**
**Impact : ÉLEVÉ — C'est ce qui rend l'app "vivante"**

### 2.1 Transitions de page

**Actions :**
- Implémenter des View Transitions API (React Router v7 les supporte nativement) entre chaque page
- Chaque transition doit être contextuelle : slide-left pour aller en profondeur, slide-right pour revenir, fade-up pour les modales
- Durée : 200-300ms max, easing spring
- Fallback `crossfade` pour les navigateurs qui ne supportent pas View Transitions

### 2.2 Micro-animations sur chaque interaction

Les top apps animent TOUT : chaque tap, chaque swipe, chaque changement d'état.

**Actions :**
- **Boutons** : scale(0.97) au press + relâchement spring. Jamais un bouton statique
- **Cards** : hover → subtle lift (translateY -2px + shadow increase). Tap → scale(0.98)
- **Listes** : staggered entrance animation (chaque item arrive 30ms après le précédent)
- **Toggles/Switches** : animation fluide du thumb avec spring physics
- **Pull-to-refresh** : animation custom avec le logo/mascotte (pas le spinner par défaut)
- **Tab switching** : underline qui slide entre les tabs avec un spring
- **Badge de notification** : bounce-in quand un nouveau message arrive
- **Avatar speaking** : l'animation pulse actuelle est OK, mais ajoute des "sound waves" autour de l'avatar
- **RSVP** : animation de confetti (déjà canvas-confetti installé !) quand quelqu'un confirme sa présence

### 2.3 Haptic Feedback (natif)

Capacitor Haptics est déjà installé mais probablement sous-utilisé.

**Actions :**
- Light impact : chaque tap sur un bouton
- Medium impact : RSVP confirmé, message envoyé
- Heavy impact : appel vocal connecté, session créée
- Selection changed : scroll entre les items d'un picker
- Notification : nouveau message, appel entrant

### 2.4 Skeleton Screens partout

**Actions :**
- Remplacer TOUS les spinners par des skeleton screens qui reproduisent la forme exacte du contenu à venir
- Les skeletons doivent avoir un shimmer animation (gradient qui slide)
- Chaque page doit avoir son propre skeleton layout custom

---

## PHASE 3 — UX OBSESSIONNELLE (84 → 90/100)
**Durée estimée : 3-4 semaines**
**Impact : ÉLEVÉ — C'est ce qui fait que les utilisateurs RESTENT**

### 3.1 Gestion d'état optimiste partout

**Actions :**
- RSVP : quand tu cliques "Présent", l'UI change IMMÉDIATEMENT, avant la réponse serveur. Rollback si erreur
- Messages : le message apparaît dans la liste IMMÉDIATEMENT avec un indicateur "envoi en cours"
- Squad join/leave : changement immédiat, sync en background
- Toutes les mutations TanStack Query doivent avoir `onMutate` avec optimistic update

### 3.2 Offline-first

Les top apps fonctionnent sans internet. Discord montre les messages cachés, Spotify joue la musique téléchargée.

**Actions :**
- Service Worker avec stratégie cache-first pour les assets statiques
- Stockage local des conversations récentes (IndexedDB via idb-keyval ou Dexie)
- File d'attente des actions offline : si tu RSVP sans internet, l'action se queue et s'exécute à la reconnexion
- Indicateur visuel discret quand l'app est offline (barre subtile en haut, pas un gros modal bloquant)
- Les images de profil doivent être cachées localement

### 3.3 Gestion des erreurs "humaine"

**Actions :**
- Chaque erreur doit avoir un message HUMAIN en français, jamais un code technique
- Erreur réseau → "Connexion perdue. On réessaie automatiquement..." + retry automatique
- Erreur 404 → Page custom avec illustration + CTA pour retourner à l'accueil
- Erreur de formulaire → animation shake sur le champ invalide + message sous le champ
- Rate limit → "Doucement ! Réessaie dans quelques secondes" avec un countdown

### 3.4 Accessibilité A++

453 tests a11y c'est bien, mais les top apps vont plus loin.

**Actions :**
- Focus visible sur TOUS les éléments interactifs (outline custom qui matche le design)
- Skip-to-content link sur chaque page
- Announce dynamique via aria-live pour les notifications temps réel
- Réduire les animations si `prefers-reduced-motion` est activé (remplacer par des fades simples)
- Mode contraste élevé : vérifier TOUS les textes en contrast checker
- Keyboard navigation complète : Tab, Enter, Escape, Arrow keys dans les listes et menus
- Screen reader : tester avec VoiceOver (iOS) et TalkBack (Android)

### 3.5 Gestures natives (mobile)

**Actions :**
- Swipe-right sur un message → répondre
- Swipe-left sur un message → options (supprimer, réagir)
- Swipe-down sur une conversation → fermer/retour
- Long press sur un message → menu contextuel avec haptic
- Pull-to-refresh sur toutes les listes
- Swipe entre les tabs de navigation

### 3.6 Deep Links & Partage

**Actions :**
- Chaque squad a un lien partageable : squadplanner.app/s/mon-squad
- Chaque session a un lien : squadplanner.app/session/abc123
- Quand tu partages un lien, il génère une Open Graph card riche (image, titre, description)
- iOS/Android : Universal Links / App Links pour ouvrir directement dans l'app native

---

## PHASE 4 — PERFORMANCE OBSESSIONNELLE (90 → 94/100)
**Durée estimée : 2 semaines**
**Impact : MOYEN-ÉLEVÉ — Les top apps sont INSTANTANÉES**

### 4.1 Core Web Vitals parfaits

**Objectifs :**
- LCP < 1.2s (actuellement probablement ~2-3s)
- FID/INP < 100ms
- CLS < 0.05
- TTFB < 200ms (Vercel Edge)

**Actions :**
- Audit avec Lighthouse CI dans le pipeline
- Preload les fonts critiques (Inter 400, 600, 700) avec `<link rel="preload">`
- Images : convertir tout en WebP/AVIF avec `<picture>` et srcset pour responsive
- Code splitting agressif : chaque page est déjà lazy-loaded, mais vérifier que les chunks sont < 50KB
- Prefetch les routes probables : sur la page Home, prefetch /squads et /sessions
- DNS prefetch pour Supabase et les CDN d'images
- SSR les pages critiques (Home, Squad Detail) pour un FCP ultra-rapide

### 4.2 Bundle Size

**Actions :**
- Analyser avec `npx vite-bundle-visualizer`
- Vérifier que Remotion n'est pas importé sur les pages qui ne l'utilisent pas (c'est une lib lourde)
- Tree-shake agressif : vérifier les imports de Radix, Lucide, et date-fns
- Target un bundle JS initial < 150KB gzipped

### 4.3 Optimisation des requêtes

**Actions :**
- Supabase : utiliser `.select()` avec uniquement les colonnes nécessaires (pas de `select('*')` sur les grosses tables)
- Pagination curseur-based (pas offset) pour les listes longues
- Cache TanStack Query avec staleTime intelligent : profils = 5min, messages = 30s, sessions = 1min
- Batch les requêtes quand possible (ex: charger les profils de tous les membres d'un squad en une seule query avec `in()`)

### 4.4 Realtime optimisé

**Actions :**
- Un seul channel Supabase Realtime par page (pas un par composant)
- Throttle les événements de typing à 1 par seconde (pas plus)
- Cleanup systématique des subscriptions (vérifier qu'il n'y a aucune fuite)

---

## PHASE 5 — FONCTIONNALITÉS "WOW" (94 → 97/100)
**Durée estimée : 3-4 semaines**
**Impact : ÉLEVÉ — C'est ce qui fait parler de l'app**

### 5.1 Système de notifications intelligent

**Actions :**
- Push notifications natives (Capacitor Push déjà installé) avec des messages contextuels : "La session de ce soir sur Valorant commence dans 30min ! 🎮"
- Notification groupées (pas 10 notifs séparées pour 10 messages dans le même chat)
- Quiet hours : pas de notifications entre 23h et 8h (configurable)
- Notification preferences granulaires par squad et par type

### 5.2 Widgets & Quick Actions

**Actions :**
- Widget iOS/Android : prochaine session avec countdown
- Widget "Qui est en ligne dans mes squads"
- Quick Actions (3D Touch / long press sur l'icône app) : "Créer une session", "Rejoindre le vocal"
- Spotlight search (iOS) : chercher des squads et sessions depuis le home screen

### 5.3 Personnalisation

**Actions :**
- Thèmes de couleur par squad (le squad leader peut choisir la couleur accent)
- Avatar personnalisé : pas juste une photo, mais un cadre/bordure qui montre le niveau/statut
- Statut personnalisé : "En game", "AFK", "Disponible ce soir", avec un emoji
- Sons personnalisés pour les notifications (optionnel)

### 5.4 Gamification poussée

Tu as déjà les streaks et les badges. Les top apps de gaming vont plus loin.

**Actions :**
- Système de niveaux : XP gagnée en participant aux sessions, en invitant des amis, en créant du contenu
- Classement hebdomadaire par squad : qui a participé le plus cette semaine
- Achievements avec des conditions intéressantes : "Night Owl" (5 sessions après 22h), "Squad Leader" (créer 3 squads), "Social Butterfly" (envoyer 100 messages)
- Animation spectaculaire quand tu level-up (fullscreen, confetti, son)
- Profil public qui montre les badges et le niveau (déjà PublicProfile.tsx — enrichir)

### 5.5 Mode Discover enrichi

**Actions :**
- Algorithme de recommandation : suggérer des squads basés sur les jeux que l'utilisateur joue
- Catégories : FPS, MOBA, RPG, Casual, Stratégie...
- "Trending" : squads qui ont eu le plus de sessions cette semaine
- Cartes de squad riches : avec le nombre de membres actifs, la fréquence des sessions, les jeux joués
- Search full-text avec filtres (jeu, taille du squad, langue, région)

---

## PHASE 6 — POLISH FINAL & PRODUCTION-READY (97 → 100/100)
**Durée estimée : 2-3 semaines**
**Impact : Le dernier 3% qui fait la différence**

### 6.1 Onboarding revu

L'onboarding existe mais doit être SPECTACULAIRE.

**Actions :**
- Animation Remotion pour la splash/intro (puisque c'est déjà installé)
- Chaque étape doit avoir une micro-animation qui explique visuellement ce que fait l'app
- Le flow doit se terminer par un "moment wow" : ta première squad avec des membres suggérés
- A/B test le taux de complétion avec PostHog

### 6.2 Gestion du son

**Actions :**
- Son de notification custom (court, satisfaisant, reconnaissable — comme le "ding" de iMessage)
- Son de connexion vocale (comme Discord quand tu rejoins un channel)
- Son de déconnexion
- Son de message reçu (subtil)
- TOUS les sons doivent être désactivables dans les settings
- Utiliser Tone.js ou de simples fichiers audio

### 6.3 Dark mode / Light mode

**Actions :**
- Actuellement dark-only. Ajouter un light mode complet (même si le dark est par défaut)
- Le switch doit être smooth : transition de 300ms sur le background
- Respecter `prefers-color-scheme` par défaut

### 6.4 Internationalisation complète

**Actions :**
- Compléter TOUTES les traductions anglaises (vérifier que en.ts couvre 100% des clés de fr.ts)
- Ajouter la détection automatique de la langue du navigateur
- Formater les dates selon la locale (14 février vs February 14)
- Pluralisation correcte ("1 membre" vs "3 membres")

### 6.5 Test & QA final

**Actions :**
- Tester sur 10+ devices : iPhone SE, iPhone 15, Pixel 7, Samsung Galaxy S24, iPad, tablette Android
- Tester en 2G/3G (throttle réseau dans DevTools) — l'app doit rester utilisable
- Tester avec 500+ messages dans une conversation (performance de scroll)
- Tester avec 50+ membres dans un squad
- Audit Lighthouse : viser 95+ sur les 4 catégories
- Audit axe-core : 0 violation critical ou serious
- Stress test du WebRTC avec 5+ participants simultanés

### 6.6 Métriques & Monitoring

**Actions :**
- Dashboard PostHog avec les métriques clés : DAU, rétention J1/J7/J30, sessions par user, messages par jour
- Alertes automatiques si le taux d'erreur dépasse 1%
- Suivi du funnel : inscription → onboarding → première squad → première session → retour J7
- A/B testing framework pour tester les changements UX

### 6.7 App Store / Play Store

**Actions :**
- Screenshots professionnelles (5-6) avec device mockups et texte marketing
- Vidéo promo de 30s montrant les features clés
- Description ASO-optimisée (mots-clés : gaming, planification, squad, voice chat, sessions)
- Rating prompt intelligent : demander un avis UNIQUEMENT après une expérience positive (ex: 3ème session complétée)

---

## RÉCAPITULATIF DES PRIORITÉS

| Phase | Points | Durée | Priorité |
|-------|--------|-------|----------|
| 1. Identité visuelle | +6 pts (72→78) | 2-3 sem | 🔴 CRITIQUE |
| 2. Micro-interactions | +6 pts (78→84) | 2-3 sem | 🔴 CRITIQUE |
| 3. UX obsessionnelle | +6 pts (84→90) | 3-4 sem | 🟠 HAUTE |
| 4. Performance | +4 pts (90→94) | 2 sem | 🟠 HAUTE |
| 5. Features wow | +3 pts (94→97) | 3-4 sem | 🟡 MOYENNE |
| 6. Polish final | +3 pts (97→100) | 2-3 sem | 🟡 MOYENNE |

**Total estimé : 14-19 semaines de travail intensif (3.5 à 5 mois)**

---

## CE QUE TU PEUX FAIRE TOI-MÊME vs CE QUI NÉCESSITE UN SPÉCIALISTE

### Tu peux faire seul (avec Claude) :
- Toutes les phases 2, 3, 4, 6 (code, animations, UX, performance, polish)
- Phase 5 en grande partie (gamification, notifications, personnalisation)

### Tu as besoin d'un spécialiste :
- **Phase 1.1** : Logo et branding → un graphiste/directeur artistique (budget : 500-2000€)
- **Phase 1.3** : Icônes custom → un icon designer (budget : 200-800€)
- **Phase 1.4** : Illustrations → un illustrateur (budget : 300-1500€)
- **Phase 6.7** : Screenshots/vidéo App Store → un designer marketing (budget : 200-500€)

**Budget total spécialistes : ~1500-5000€**

---

## ORDRE D'EXÉCUTION RECOMMANDÉ

1. **MAINTENANT** : Commencer la Phase 2 (micro-interactions) — c'est le meilleur rapport effort/impact et tu peux le faire seul
2. **En parallèle** : Lancer le brief pour le branding (Phase 1) auprès d'un designer
3. **Semaine 3-4** : Phase 3 (UX) quand le branding est en cours
4. **Semaine 5-6** : Phase 4 (performance) — audit et optimisation
5. **Semaine 7-10** : Phase 5 (features wow) — les features qui font parler
6. **Semaine 11-14** : Phase 6 (polish) + intégration du nouveau branding
7. **Semaine 15** : Beta test avec 20-50 vrais utilisateurs, itérer sur leur feedback
8. **Semaine 16-19** : Corrections basées sur le feedback, soumission App Store

---

**Le secret des top apps mondiales, ce n'est pas UNE grande feature — c'est 1000 petits détails parfaitement exécutés.**

*Créé le 20 février 2026 — Plan d'actions Squad Planner*
