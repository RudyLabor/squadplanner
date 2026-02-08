# AUDIT COMPLET SQUAD PLANNER - Top 5 Mondial 2026

> **Score Global : 44/50 (88%)**
>
> Audit visuel (desktop + mobile) + analyse code de squadplanner.fr
> Benchmark : Linear, Notion, Arc, Discord, Guilded

---

## SUIVI D'AVANCEMENT EN TEMPS REEL

> **Derniere mise a jour : 8 fevrier 2026 - 12h00**
> **Score actuel : ~47/50 -> Phase 1 COMPLETE !**

### Phase 1 : Bloquants Critiques (P0) — 100% FAIT

| # | Tache | Statut | Date | Details |
|---|-------|--------|------|---------|
| 1.4a | Traduire erreurs Supabase Auth en FR | FAIT | 8 fev | 13 messages d'erreur traduits dans `Auth.tsx` |
| 1.3a | Bouton "Passer" onboarding notifs | FAIT | 8 fev | Bouton toujours actif + badge "Recommande" au lieu de "Requis" |
| 1.2a | Settings dans la navigation | FAIT | 8 fev | Parametres + Aide + Appels ajoutes dans sidebar desktop |
| 1.2b | Help/FAQ dans la navigation | FAIT | 8 fev | Lien vers `/help` avec icone HelpCircle |
| 1.2c | Call History dans la navigation | FAIT | 8 fev | Lien vers `/call-history` avec icone Phone |
| 1.1a | Suppression de compte (RGPD) | FAIT | 8 fev | Modal de confirmation + suppression cascade DB + signout |
| 1.1b | Export de donnees (RGPD) | FAIT | 8 fev | Export JSON complet (profil, squads, messages, RSVP, appels) |
| 1.2d | handleInviteFriend implemente | FAIT | 8 fev | Redirige vers DM avec l'ami |
| 1.1c | Page CGU / Politique de confidentialite | FAIT | 8 fev | Page `/legal` avec CGU + Privacy Policy en onglets, sections accordeon |
| 1.1d | Popup consentement cookies | FAIT | 8 fev | Banniere RGPD avec choix Essentiels/Tout accepter + details |
| 1.3b | Tour guide post-onboarding | FAIT | 8 fev | 5 etapes interactives (Squads, Sessions, Messages, Party, IA Coach) |
| 1.3c | Email de bienvenue | FAIT | 8 fev | Edge Function `send-welcome-email` + template HTML premium |

### Corrections P1 — FAIT

| # | Tache | Statut | Date | Details |
|---|-------|--------|------|---------|
| P1.1 | Fix 404 sur /session/:id invalide | FAIT | 8 fev | Message "Session non trouvee" + bouton retour |
| P1.2 | Fix scroll landing page | FAIT | 8 fev | `min-height: 100dvh` au lieu de `height: 100dvh` sur html/body/#root |
| P1.3 | Recherche dans les messages | FAIT | 8 fev | Bouton search dans header chat + barre recherche animee + compteur resultats |
| P1.4 | Reactions emoji (deja en place) | DEJA FAIT | - | `MessageReactions.tsx` et DB `message_reactions` operationnels |
| P1.5 | Reply-to-message (deja en place) | DEJA FAIT | - | `MessageReplyPreview.tsx` et `reply_to_id` operationnels |

### Performance — FAIT

| # | Tache | Statut | Date | Details |
|---|-------|--------|------|---------|
| PERF.1 | Code splitting vendor chunks | FAIT | 8 fev | 9 vendor chunks isoles (agora, react, ui, supabase, tanstack, sentry, etc.) |
| PERF.2 | Fix Windows path normalization | FAIT | 8 fev | manualChunks avec normalisation backslash |
| PERF.3 | Agora lazy loading confirme | FAIT | 8 fev | 1.3MB charge uniquement sur party/appels |

### Phase 2 : UI Revolution — NON COMMENCEE

| Sous-phase | Statut | Progression |
|------------|--------|-------------|
| 2.1 Design System 2026 Upgrade | A FAIRE | 0% |
| 2.2 Nouveaux composants UI | A FAIRE | 0% |
| 2.3 Landing Page Refonte Totale | A FAIRE | 0% |
| 2.4 Theme Clair perfectionne | A FAIRE | 0% |

### Phase 3 : Surpasser Discord — NON COMMENCEE

| Sous-phase | Statut | Progression |
|------------|--------|-------------|
| 3.1 Chat Niveau Discord | A FAIRE | 0% |
| 3.2 Voice Niveau Discord+ | A FAIRE | 0% |
| 3.3 Roles & Permissions | A FAIRE | 0% |

### Phase 4 : Surpasser WhatsApp — NON COMMENCEE

| Sous-phase | Statut | Progression |
|------------|--------|-------------|
| 4.1 DM Niveau WhatsApp | A FAIRE | 0% |
| 4.2 Statut & Presence | A FAIRE | 0% |

### Phase 5 : Surpasser PlayStation App — NON COMMENCEE

| Sous-phase | Statut | Progression |
|------------|--------|-------------|
| 5.1 Gaming Features | A FAIRE | 0% |
| 5.2 Gamification Ultime | A FAIRE | 0% |
| 5.3 Feed d'Activite | A FAIRE | 0% |

### Phase 6 : Performance & Infra — NON COMMENCEE

| Sous-phase | Statut | Progression |
|------------|--------|-------------|
| 6.1 Performance (Lighthouse 95+) | A FAIRE | 0% |
| 6.2 PWA Complete | A FAIRE | 0% |
| 6.3 Tests & Qualite | A FAIRE | 0% |
| 6.4 SEO & Marketing | A FAIRE | 0% |

### Phase 7 : Features Differenciantes — NON COMMENCEE

| Sous-phase | Statut | Progression |
|------------|--------|-------------|
| 7.1 IA Coach Avance | A FAIRE | 0% |
| 7.2 Social Discovery | A FAIRE | 0% |
| 7.3 Integrations | A FAIRE | 0% |

### Scoring Evolution

| Date | Score | Delta | Actions |
|------|-------|-------|---------|
| 8 fev (debut) | 44/50 | - | Audit initial |
| 8 fev (Phase 1 partiel) | ~45.5/50 | +1.5 | Auth FR, onboarding skip, nav, RGPD |
| 8 fev (P1 + perf) | ~46/50 | +0.5 | 404 fix, scroll fix, recherche messages, code splitting |
| 8 fev (Phase 1 complete) | ~47/50 | +1 | CGU page, cookie consent, tour guide, welcome email, build fix |

---

## 1. CE QUI EST EXCELLENT (Top niveau mondial)

### Design & UI - 9/10

- Dark theme Linear-like coherent et premium sur TOUTES les pages
- Typographie, espacements, couleurs parfaitement harmonises
- Animations subtiles (stagger, confetti, CountUp)
- Empty states bien geres avec CTAs contextuels
- Page 404 propre avec navigation maintenue

### Mobile Responsive - 9/10

- Bottom navigation native-like (5 tabs avec Party au centre)
- Toutes les pages parfaitement adaptees au 390px
- Grilles qui passent en 2x2 sur mobile (stats profil)
- Touch targets suffisamment grands

### Gamification - 10/10

- Systeme XP + niveaux (Debutant > Regulier > ...)
- 9 challenges (Quotidien/Hebdo/Succes) avec barres de progression
- Streak de connexion avec flamme + calendrier 7 jours
- Classement squad avec podium dore
- Score de fiabilite avec tiers (Legende = 100%)
- Badges saisonniers

### Onboarding - 8/10

- Flow en 3 etapes claires (Squad > Profil > Notifs)
- Stepper visuel avec validation
- Fuseau horaire auto-detecte
- Checklist "Pour bien demarrer" sur Home apres inscription

### Monetisation - 9/10

- Page Premium magnifique avec pricing clair
- Comparatif Gratuit vs Premium en tableau
- Badge "Meilleure offre" sur annuel
- Gating visible mais non bloquant (Stats avancees, Export calendrier)
- Garantie 30j + annulation facile

---

## 2. PROBLEMES IDENTIFIES

### CRITIQUES (bloquants pour Top 5)

| # | Probleme | Impact | Page |
|---|----------|--------|------|
| 1 | **Message d'erreur login en anglais** ("Invalid login credentials") | Casse l'immersion FR | Auth |
| 2 | **Onboarding bloque sans notifications** - Le bouton "Terminer" est grise tant que les notifs ne sont pas activees. Pas de "Passer" | **Abandon utilisateur garanti** | Onboarding step 3 |
| 3 | **Settings/Help/Call History inaccessibles** depuis la navigation | Features cachees = features mortes | Global |
| 4 | **handleDeleteAccount() et handleExportData() = TODO** | Non-conformite RGPD | Settings |

### IMPORTANTS (a corriger avant lancement)

| # | Probleme | Impact | Page |
|---|----------|--------|------|
| 5 | Pas de lien vers Settings dans le nav ou profil | Utilisateur doit deviner l'URL | Navigation |
| 6 | Pas de lien vers Help/FAQ | Support utilisateur inexistant | Navigation |
| 7 | Call History cache | Feature premium invisible | Navigation |
| 8 | handleInviteFriend = TODO (console.log) | Bouton qui ne fait rien | Home |
| 9 | Deep link /join/:code - si non connecte, redirige vers /auth mais ne revient pas automatiquement au lien | Parcours invitation casse | JoinSquad |
| 10 | Pas de 404 handling sur /squad/:id et /session/:id invalides | Crash ou page blanche possible | SquadDetail/SessionDetail |

### MINEURS (polish)

| # | Probleme | Impact |
|---|----------|--------|
| 11 | Landing page ne scrolle pas avec window.scrollTo (body overflow hidden) | Bug technique mineur |
| 12 | Pas de page "Conditions d'utilisation" liee depuis Auth | Mention legale |
| 13 | Landing : pas de video/GIF de demo (mentionne V2 dans roadmap) | Conversion moindre |

---

## 3. FONCTIONNALITES MANQUANTES vs Top 5 Mondial

### Manquantes CRITIQUES pour le lancement

| Feature | Reference | Priorite |
|---------|-----------|----------|
| **Suppression de compte (RGPD)** | GDPR obligatoire | **P0** |
| **Export de donnees (RGPD)** | GDPR obligatoire | **P0** |
| **Lien Settings dans la navigation** | UX basique | **P0** |
| **Skip notifications dans onboarding** | Retention | **P0** |
| **Traduction des erreurs Supabase Auth** | Coherence FR | **P1** |

### Manquantes pour rivaliser avec Discord/Guilded

| Feature | Reference | Priorite |
|---------|-----------|----------|
| **Reactions sur messages (emoji)** | Discord, Slack | P1 |
| **Partage d'ecran en party vocale** | Discord | P2 |
| **Statut personnalise** ("En train de jouer a...") | Discord, Steam | P2 |
| **Integration jeux** (Rich Presence type) | Discord | P3 |
| **Mentions @user dans le chat** | Tous les top apps | P1 |
| **Threads/reponses dans le chat** | Slack, Discord | P2 |
| **Recherche dans les messages** | Tous les top apps | P1 |
| **Progressive Web App** (installation mobile) | Standard 2026 | P1 |
| **Onboarding tour interactif** (tooltips guides) | Notion, Linear | P2 |

---

## 4. PARCOURS UTILISATEURS - ANALYSE

### Parcours "Nouveau membre rejoint une squad" - 7/10

1. Landing > Creer un compte > Onboarding > **BLOQUE** si refuse notifs
2. Pas de parcours "rejoindre via lien" fluide (auth > retour au lien casse)
3. Pas de tutorial/tour guide post-onboarding

### Parcours "Organiser une session" - 9/10

1. SquadDetail > "Planifier une session" > Formulaire
2. RSVP systeme + auto-confirm + toast feedback
3. Check-in + fiabilite mesuree
4. Rappels automatiques (pg_cron)

### Parcours "Lancer une party vocale" - 8/10

1. Bouton accessible partout (SquadDetail, page Party, Home)
2. Reconnection automatique, qualite adaptive
3. Volume individuel par participant
4. Manque : partage d'ecran, video

### Parcours "Chatter" - 8/10

1. Chat squad + DM prives avec onglets
2. Read receipts + typing indicator
3. Messages systeme automatiques
4. Manque : reactions emoji, threads, mentions @

---

## 5. SCORE DETAILLE PAR CATEGORIE

| Categorie | Score | Commentaire |
|-----------|-------|-------------|
| **Design/UI** | 9/10 | Niveau Linear, coherent partout |
| **Mobile** | 9/10 | Native-like, responsive parfait |
| **Gamification** | 10/10 | Meilleur que Discord (XP, challenges, classement) |
| **Onboarding** | 7/10 | Joli mais bloquant (notifs) + pas de tour guide |
| **Chat** | 7/10 | Fonctionnel mais manque reactions/threads/mentions |
| **Voix** | 8/10 | Solide mais pas de video/screen share |
| **Planning/RSVP** | 10/10 | Unique sur le marche, excellent |
| **Monetisation** | 9/10 | Pricing clair, gating visible, Stripe pret |
| **Navigation** | 7/10 | Settings/Help/CallHistory caches |
| **Conformite** | 5/10 | RGPD non implemente (delete/export account) |
| **TOTAL** | **44/50 (88%)** | |

---

## 6. PLAN D'ACTION PRIORITAIRE

---

### PHASE 1 : BLOQUANTS CRITIQUES (Semaine 1) — De 44/50 a 47/50

#### 1.1 - RGPD & Conformite (P0)

- [ ] Implementer suppression de compte (`handleDeleteAccount`)
- [ ] Implementer export de donnees (`handleExportData`)
- [ ] Page CGU / Politique de confidentialite
- [ ] Popup consentement cookies

#### 1.2 - Navigation manquante (P0)

- [ ] Ajouter Settings dans le menu profil (dropdown au clic sur avatar)
- [ ] Ajouter Help/FAQ dans sidebar footer
- [ ] Ajouter Call History accessible depuis Profil ou Party
- [ ] Breadcrumb cliquable sur toutes les pages

#### 1.3 - Onboarding (P0)

- [ ] Bouton "Passer" sur l'etape notifications (ne pas bloquer)
- [ ] Tour guide interactif post-onboarding (tooltips flottants sur 5 elements cles)
- [ ] Email de bienvenue (template + Edge Function)

#### 1.4 - Traductions (P0)

- [ ] Traduire TOUTES les erreurs Supabase Auth en francais
- [ ] Mapper les erreurs courantes : "Invalid login credentials" > "Email ou mot de passe incorrect"
- [ ] Verifier 0 texte anglais dans toute l'app

---

### PHASE 2 : UI REVOLUTION (Semaines 2-3) — Le gap le plus important vs le top mondial

#### 2.1 - Design System 2026 Upgrade

Ce qui manque vs Linear/Vercel/Arc :

| Element | Actuel | Objectif 2026 |
|---------|--------|---------------|
| **Page transitions** | View Transitions basiques | Shared element transitions (morph avatar, cards) |
| **Micro-interactions** | Hover lift basique | Spring physics sur chaque interaction (boutons, toggles, cards) |
| **Loading states** | Skeleton basique | Skeleton + shimmer contextuels sur CHAQUE section |
| **Depth/Layers** | Flat dark | Multi-layer glassmorphism avec noise texture |
| **Gradients** | Peu utilises | Mesh gradients animes (landing, headers) |
| **Illustrations** | Icones Lucide basiques | Illustrations custom SVG animees (empty states, onboarding) |
| **Sound design** | Aucun | Sons subtils (notification, RSVP, join party, confetti) |
| **Haptics** | Aucun | Capacitor Haptics sur mobile (boutons, swipe, actions) |
| **Curseur** | Default | Curseur custom sur la landing (trail effect) |
| **Scrollbar** | Minimal | Scrollbar avec indicateur de progression |

#### 2.2 - Nouveaux composants UI a creer

- [ ] **Avatar ameliore** : ring de statut anime (en ligne = pulse vert, en party = pulse violet, absent = gris)
- [ ] **AnimatedCounter** : compteur qui s'anime quand visible (IntersectionObserver)
- [ ] **Drawer** : bottom sheet native-like pour mobile (swipe down to dismiss)
- [ ] **Toast ameliore** : avec undo action, progress bar, icones animees
- [ ] **ContextMenu** : clic droit sur messages/membres (comme Discord)
- [ ] **CommandPalette ameliore** : sous-commandes, raccourcis, fuzzy search avec preview
- [ ] **SegmentedControl** : remplacer les tabs par des segments animes
- [ ] **ProgressRing** : cercle de progression anime (fiabilite, XP)
- [ ] **Confetti ameliore** : particules 3D avec physique realiste
- [ ] **Notification in-app** : banner slide-in avec actions
- [ ] **ImageViewer** : lightbox zoom pour images partagees dans le chat
- [ ] **EmojiPicker** : selecteur d'emoji natif pour reactions

#### 2.3 - Landing Page Refonte Totale

Benchmarks : Linear.app, Vercel.com, Arc.net

- [ ] Hero avec mesh gradient anime (WebGL ou CSS)
- [ ] Mockup 3D interactif de l'app (rotatif au scroll)
- [ ] Sections avec parallax scroll
- [ ] Video/GIF de demo integree (autoplay muted)
- [ ] Temoignages avec avatars et animation carousel
- [ ] Section "Comparaison vs Discord" (tableau interactif)
- [ ] Counter anime de joueurs inscrits (social proof)
- [ ] Footer complet (liens legaux, reseaux, newsletter)
- [ ] Performance : Lighthouse 95+

#### 2.4 - Theme Clair perfectionne

- [ ] Tester CHAQUE page en mode clair
- [ ] Shadows adaptatives (plus prononcees en clair)
- [ ] Illustrations qui changent de couleur selon le theme

---

### PHASE 3 : SURPASSER DISCORD (Semaines 3-5) — Communication & Social

#### 3.1 - Chat Niveau Discord

| Feature | Discord a | Squad Planner a | A faire |
|---------|-----------|-----------------|---------|
| **Reactions emoji** | Oui | Non | Ajouter |
| **Mentions @user** | Oui | Non | Ajouter |
| **Threads/reponses** | Oui | Non | Reply to message |
| **Messages epingles** | Oui | Non | Pin messages |
| **Recherche messages** | Oui | Non | Full-text search |
| **Partage fichiers** | Oui | Non | Images + fichiers |
| **GIFs (Tenor/Giphy)** | Oui | Non | Integration API |
| **Formatage markdown** | Oui | Non | Bold, italic, code |
| **Preview liens** | Oui | Non | OG meta preview |
| **Messages vocaux** | Oui (recent) | Non | Enregistrer + envoyer audio |
| **Stickers/emojis custom** | Oui | Non | V3 (optionnel) |

#### 3.2 - Voice Niveau Discord+

| Feature | Discord | PS App | A faire |
|---------|---------|--------|---------|
| **Partage d'ecran** | Oui | Non | WebRTC screen share |
| **Video** | Oui | Non | Camera optionnelle |
| **Soundboard** | Oui | Non | V3 |
| **Musique bot** | Oui | Non | V3 |
| **Noise suppression** | Oui (Krisp) | Non | Agora AI Noise |
| **Push-to-talk** | Oui | Non | Ajouter option |
| **Spatial audio** | Non | Oui | V3 premium |

#### 3.3 - Roles & Permissions (comme Discord)

- [ ] Roles personnalisables (Coach, Manager, Remplacant, etc.)
- [ ] Couleur par role (affichee dans le chat et la liste membres)
- [ ] Permissions granulaires (creer sessions, inviter, kick, mute)
- [ ] Badge de role sur le profil

---

### PHASE 4 : SURPASSER WHATSAPP (Semaines 4-6) — Messaging & Communication directe

#### 4.1 - DM Niveau WhatsApp

| Feature | WhatsApp a | A faire |
|---------|-----------|---------|
| **Messages vocaux** | Oui | Record + play avec waveform |
| **Partage de localisation** | Oui | "Je suis la" pour meetups IRL |
| **Statut/Stories** | Oui | "Game Status" (ce que tu joues) |
| **Polls** | Oui | Sondages dans le chat squad |
| **Disparition messages** | Oui | V3 optionnel |
| **Transfert messages** | Oui | Forward to autre squad |
| **Multi-device** | Oui | PWA + Capacitor natif |
| **Appel video** | Oui | WebRTC dans CallModal |

#### 4.2 - Statut & Presence (mieux que WhatsApp)

- [ ] **Game Status** : "En train de jouer a Valorant" (saisie manuelle ou integration)
- [ ] **Disponibilite** : Disponible / Occupe / Ne pas deranger / Invisible
- [ ] **Statut personnalise** avec emoji + texte + duree
- [ ] **"Derniere connexion"** : Il y a 5 min, Il y a 2h, etc.
- [ ] **Activite live** : indicateur "En party vocale" / "En session" sur l'avatar

---

### PHASE 5 : SURPASSER PLAYSTATION APP (Semaines 5-7) — Gaming & Gamification

#### 5.1 - Gaming Features

| Feature | PS App a | A faire |
|---------|---------|---------|
| **Trophees/Succes** | Platine/Or/Argent/Bronze | Badges Squad Planner (deja partiel) |
| **Game activity feed** | Oui | Feed d'activite squad |
| **Clips/Screenshots** | Oui | Partage de clips dans le chat |
| **Events/Tournois** | Oui | Events speciaux saisonniers |
| **Wishlist jeux** | Oui | Liste "prochains jeux" par squad |
| **Friends suggestions** | Oui | "Joueurs que tu pourrais connaitre" |

#### 5.2 - Gamification Ultime (deja forte, a perfectionner)

- [ ] **Badges visuels animes** : animations Lottie pour chaque badge debloque
- [ ] **Saisons competitives** : Classements par saison (reset mensuel)
- [ ] **Quetes narratives** : "La saga de ta squad" (parcours scenarise)
- [ ] **Recompenses cosmetiques** : themes de profil, cadres d'avatar, couleurs de pseudo
- [ ] **Titre personnalise** : "Le Fiable", "L'Organisateur", "Le Fetard" (debloque par achievements)
- [ ] **Progression de squad** : Niveau de squad collectif (Bronze > Silver > Gold > Platinum)
- [ ] **Weekly recap** : email/notification resume hebdo avec stats

#### 5.3 - Feed d'Activite

- [ ] Timeline "Activite recente" sur Home
- [ ] "X a cree une session", "Y a rejoint la party", "Z a obtenu le badge Fetard"
- [ ] Reactions rapides sur les activites (high-five, applaudissements)

---

### PHASE 6 : PERFORMANCE & INFRA (Semaines 7-8) — Base technique pour le top mondial

#### 6.1 - Performance

> **REGLE D'OR : Une app top 5 mondial n'est pas juste belle, elle est RAPIDE.**
> Discord charge en < 2s. WhatsApp en < 1s. On doit etre a ce niveau.

- [ ] **Lighthouse 95+** sur toutes les pages
- [ ] **Code splitting agressif** (route-level chunks < 50KB)
- [ ] **Images** : WebP/AVIF + srcset responsive + lazy loading
- [ ] **Fonts** : preload Inter, font-display: swap
- [ ] **Virtual scrolling** sur toutes les longues listes (messages, membres, sessions)
- [ ] **Service Worker** : cache strategique (stale-while-revalidate)
- [ ] **Prefetch** : preload les pages liees au hover sur les links

#### 6.2 - PWA Complete

- [ ] manifest.json complet (icons, screenshots, shortcuts)
- [ ] Installation prompt intelligente (apres 3 visites)
- [ ] Offline mode : afficher les donnees cachees
- [ ] Background sync : envoyer messages en offline
- [ ] Push notifications natives (deja fait)

#### 6.3 - Tests & Qualite

- [ ] Tests E2E Playwright : parcours critiques (inscription, RSVP, chat, party)
- [ ] Tests visuels : screenshot comparison (Chromatic ou Percy)
- [ ] Monitoring : Sentry errors + Web Vitals tracking
- [ ] 0 erreur console en production

#### 6.4 - SEO & Marketing

- [ ] Meta tags OG complets sur toutes les pages
- [ ] Schema.org structured data (Application)
- [ ] Sitemap.xml + robots.txt
- [ ] Blog/Changelog page (optionnel mais valorisant)

---

### PHASE 7 : FEATURES DIFFERENCIANTES (Semaines 8-10) — Ce que PERSONNE n'a

#### 7.1 - IA Coach Avance (Notre avantage unique)

- [ ] **IA predictive** : "Ta squad joue souvent le mardi soir, propose une session ?"
- [ ] **IA resume de session** : resume auto de ce qui s'est passe
- [ ] **IA team building** : suggestions d'activites pour souder la squad
- [ ] **IA conflict resolution** : detecte les tensions (no-shows repetes) et propose des solutions
- [ ] **IA planning optimal** : croise les dispos de tous les membres automatiquement

#### 7.2 - Social Discovery

- [ ] **Squad publiques** : decouvrir des squads ouvertes par jeu
- [ ] **Matchmaking** : trouver des joueurs pour completer ta squad
- [ ] **Profils publics** : page profil partageable avec stats
- [ ] **Classement global** : top squads par jeu, par region

#### 7.3 - Integrations

- [ ] **Google Calendar sync** : export et import bidirectionnel
- [ ] **Twitch** : statut "En live" automatique
- [ ] **Steam/Epic/Xbox/PS** : import de la bibliotheque de jeux
- [ ] **Webhook API** : pour les power users / bots

---

## SCORING CIBLE 50/50

| Categorie | Actuel | Cible | Actions cles |
|-----------|--------|-------|--------------|
| **Design/UI** | 9/10 | **10/10** | Phase 2 (landing refonte, micro-interactions, spring physics, sound design) |
| **Mobile** | 9/10 | **10/10** | Phase 2 (haptics, drawer bottom sheet, PWA install) |
| **Gamification** | 10/10 | **10/10** | Phase 5 (badges animes, saisons, titres, weekly recap) |
| **Onboarding** | 7/10 | **10/10** | Phase 1 (skip notifs, tour guide, email bienvenue) |
| **Chat** | 7/10 | **10/10** | Phase 3 (reactions, mentions, threads, GIFs, fichiers, vocal, markdown) |
| **Voix** | 8/10 | **10/10** | Phase 3 (screen share, video, push-to-talk, noise suppression) |
| **Planning/RSVP** | 10/10 | **10/10** | Maintenir + Phase 7 (IA predictive) |
| **Monetisation** | 9/10 | **10/10** | Phase 5 (cosmetiques premium, saisons) |
| **Navigation** | 7/10 | **10/10** | Phase 1 (settings, help, call history, profile dropdown) |
| **Conformite** | 5/10 | **10/10** | Phase 1 (RGPD, CGU, cookies, traductions) |
| **TOTAL** | **44/50** | **50/50** | |

---

## TIMELINE ESTIMEE

| Semaine | Phase | Focus | Score estime |
|---------|-------|-------|--------------|
| S1 | Phase 1 | Bloquants critiques | 47/50 |
| S2-S3 | Phase 2 | UI Revolution | 48/50 |
| S3-S5 | Phase 3 | Surpasser Discord (chat+voice) | 49/50 |
| S4-S6 | Phase 4 | Surpasser WhatsApp (DM+statut) | 49.5/50 |
| S5-S7 | Phase 5 | Surpasser PS App (gaming) | 50/50 |
| S7-S8 | Phase 6 | Performance & Infra | Maintien |
| S8-S10 | Phase 7 | Features differenciantes | Au-dela |

---

## VERDICT

> **Squad Planner est a 88% du niveau Top 5 mondial.** Le design et la gamification sont exceptionnels, le planning/RSVP est unique sur le marche.
>
> Les 5 corrections P0 (onboarding skip, RGPD, navigation, traductions) suffisent pour un lancement solide. Les P1 rapprochent de 95%+.
>
> **Les apps qu'on veut surpasser ne sont pas les meilleures juste parce qu'elles sont belles mais aussi parce qu'elles sont performantes avec un UX parfait.** Chaque feature doit etre rapide, fluide, et intuitive. Performance = UX.

---

## RAPPEL PERFORMANCE (NON NEGOCIABLE)

> **Discord** charge en < 2 secondes. **WhatsApp Web** est instantane. **PlayStation App** est native-fast.
>
> Pour chaque feature implementee, verifier :
> 1. **Bundle size** : pas de lib lourde sans raison (< 50KB par chunk)
> 2. **Render time** : pas de re-render inutile (React.memo, useMemo, useCallback)
> 3. **Network** : pas de requete dupliquee (React Query cache, deduplication)
> 4. **Perception** : skeleton/shimmer AVANT les donnees (jamais de blank screen)
> 5. **Mobile** : 60fps minimum sur animations (pas de jank)
> 6. **Memory** : cleanup subscriptions, pas de memory leaks
