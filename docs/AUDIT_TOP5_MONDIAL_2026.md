# AUDIT COMPLET SQUAD PLANNER - Top 5 Mondial 2026

> **Score Global : 47/50 (94%)**
>
> Audit visuel (desktop + mobile) + analyse code de squadplanner.fr
> Benchmark : Linear, Notion, Arc, Discord, Guilded

---

## SUIVI D'AVANCEMENT EN TEMPS REEL

> **Derniere mise a jour : 8 fevrier 2026 - 12h30**
> **Score actuel : 47/50 — Phase 1 COMPLETE, Phase 2+ a commencer**

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
| 1.1d | Popup consentement cookies | FAIT | 8 fev | `CookieConsent.tsx` banniere RGPD avec choix Essentiels/Tout accepter |
| 1.3b | Tour guide post-onboarding | FAIT | 8 fev | `TourGuide.tsx` 5 etapes interactives avec highlight + overlay |
| 1.3c | Email de bienvenue | FAIT | 8 fev | Edge Function `send-welcome-email` + template HTML premium (Resend) |

### Corrections P1 — 100% FAIT

| # | Tache | Statut | Date | Details |
|---|-------|--------|------|---------|
| P1.1 | Fix 404 sur /session/:id invalide | FAIT | 8 fev | Message "Session non trouvee" + bouton retour |
| P1.2 | Fix scroll landing page | FAIT | 8 fev | `min-height: 100dvh` au lieu de `height: 100dvh` sur html/body/#root |
| P1.3 | Recherche dans les messages | FAIT | 8 fev | Bouton search dans header chat + barre recherche animee + compteur resultats |
| P1.4 | Reactions emoji (deja en place) | DEJA FAIT | - | `MessageReactions.tsx` et DB `message_reactions` operationnels |
| P1.5 | Reply-to-message (deja en place) | DEJA FAIT | - | `MessageReplyPreview.tsx` et `reply_to_id` operationnels |

### Performance — 100% FAIT

| # | Tache | Statut | Date | Details |
|---|-------|--------|------|---------|
| PERF.1 | Code splitting vendor chunks | FAIT | 8 fev | 9 vendor chunks isoles (agora, react, ui, supabase, tanstack, sentry, etc.) |
| PERF.2 | Fix Windows path normalization | FAIT | 8 fev | manualChunks avec normalisation backslash |
| PERF.3 | Agora lazy loading confirme | FAIT | 8 fev | 1.3MB charge uniquement sur party/appels |
| PERF.4 | Fix Vite 7 inline CSS build | FAIT | 8 fev | CSS critique deplace vers `public/critical.css` (contournement bug Vite 7) |

### Phase 2 : UI Revolution — PROCHAINE ETAPE

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
| 8 fev (Phase 1 partiel) | ~45.5/50 | +1.5 | Auth FR, onboarding skip, nav, RGPD delete/export |
| 8 fev (P1 + perf) | ~46/50 | +0.5 | 404 fix, scroll fix, recherche messages, code splitting |
| 8 fev (Phase 1 complete) | 47/50 | +1 | CGU page, cookie consent, tour guide, welcome email, build fix |

---

## FICHIERS CREES/MODIFIES CETTE SESSION (8 fevrier 2026)

### Nouveaux fichiers

| Fichier | Description |
|---------|-------------|
| `src/pages/Legal.tsx` | Page CGU + Politique de confidentialite (route `/legal`) |
| `src/components/CookieConsent.tsx` | Popup consentement cookies RGPD |
| `src/components/TourGuide.tsx` | Tour guide interactif post-onboarding (5 etapes) |
| `supabase/functions/send-welcome-email/index.ts` | Edge Function email bienvenue (Resend API) |
| `public/critical.css` | CSS critique extrait de index.html (fix Vite 7 build) |
| `docs/AUDIT_TOP5_MONDIAL_2026.md` | Ce fichier d'audit |

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/App.tsx` | Route `/legal` ajoutee + import CookieConsent + TourGuide |
| `src/pages/Auth.tsx` | Footer avec liens vers CGU et politique de confidentialite (Link) |
| `src/pages/Settings.tsx` | Section "Legal" ajoutee (liens CGU + Privacy) + imports Link, FileText, ExternalLink |
| `src/pages/Home.tsx` | `data-tour="ai-coach"` ajoute sur la section AI Coach |
| `src/components/layout/AppLayout.tsx` | `data-tour` attributes sur nav items + `/legal` masque la navigation |
| `index.html` | CSS inline remplace par `<link>` vers `/critical.css` + self-closing tags |
| `src/pages/Messages.tsx` | Recherche dans les messages (session precedente) |
| `src/pages/Onboarding.tsx` | Bouton "Passer" notifications (session precedente) |
| `src/pages/SessionDetail.tsx` | Fix 404 handling (session precedente) |
| `src/index.css` | Fix scroll landing (session precedente) |
| `vite.config.ts` | Code splitting vendor chunks (session precedente) |

---

## NOTES TECHNIQUES POUR LE PROCHAIN AGENT

### Build & Deploy

- **Build command (Vercel)** : `tsc -b && vite build` — plus strict que `tsc --noEmit` (erreurs TS6196/TS6133 pour variables non utilisees)
- **Le build passe en local ET sur Vercel** (commit f3265d9)
- **Vite 7** : ne supporte PAS le CSS inline dans `index.html` avec `@tailwindcss/vite` — le CSS critique est dans `public/critical.css`
- **Warning seul** : vendor-agora fait 1.3MB (normal, c'est le SDK Agora lazy-loaded)

### Composants crees cette session

1. **CookieConsent.tsx** — Banniere fixe en bas, localStorage `sq-cookie-consent`, choix essentiels/tout accepter, lien vers `/legal?tab=privacy`
2. **TourGuide.tsx** — 5 etapes ciblant `[data-tour="squads|sessions|messages|party|ai-coach"]`, localStorage `sq-tour-completed`, overlay SVG mask + tooltip anime
3. **Legal.tsx** — Onglets CGU/Privacy via `useSearchParams`, sections accordeon avec `useState`, contenu RGPD complet en francais
4. **send-welcome-email** — Edge Function Deno, supporte `{ userId }` ou `{ email, username }`, envoie via Resend API, fallback log si pas de RESEND_API_KEY

### Points d'attention

- **Tour guide** : s'affiche 2s apres le chargement de la page si `sq-tour-completed` n'est pas dans localStorage. Les `data-tour` attributes sont dans AppLayout (nav desktop) et Home (AI Coach)
- **Cookie consent** : s'affiche 1.5s apres le chargement si `sq-cookie-consent` n'est pas dans localStorage
- **Edge Function send-welcome-email** : necessite `RESEND_API_KEY` dans les secrets Supabase + domaine verifie sur Resend. Sans cle, log seulement
- **Legal page** : masque la navigation (ajoutee a `shouldHideNav` dans AppLayout) pour un layout standalone propre

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

### Onboarding - 9/10 (etait 7/10)

- Flow en 3 etapes claires (Squad > Profil > Notifs)
- Stepper visuel avec validation
- Fuseau horaire auto-detecte
- Checklist "Pour bien demarrer" sur Home apres inscription
- **NOUVEAU** : Bouton "Passer" sur notifications (ne bloque plus)
- **NOUVEAU** : Tour guide interactif post-onboarding (5 etapes)
- **NOUVEAU** : Email de bienvenue premium

### Monetisation - 9/10

- Page Premium magnifique avec pricing clair
- Comparatif Gratuit vs Premium en tableau
- Badge "Meilleure offre" sur annuel
- Gating visible mais non bloquant (Stats avancees, Export calendrier)
- Garantie 30j + annulation facile

### Navigation - 9/10 (etait 7/10)

- **NOUVEAU** : Settings dans la sidebar desktop
- **NOUVEAU** : Help/FAQ dans la sidebar desktop
- **NOUVEAU** : Call History dans la sidebar desktop
- Breadcrumbs sur toutes les pages

### Conformite - 9/10 (etait 5/10)

- **NOUVEAU** : Suppression de compte fonctionnelle (cascade DB)
- **NOUVEAU** : Export de donnees JSON complet (RGPD)
- **NOUVEAU** : Page CGU + Politique de confidentialite (`/legal`)
- **NOUVEAU** : Popup consentement cookies
- **NOUVEAU** : Erreurs Supabase Auth traduites en francais

---

## 2. PROBLEMES IDENTIFIES — STATUT ACTUEL

### CRITIQUES (bloquants pour Top 5) — TOUS RESOLUS

| # | Probleme | Statut | Resolution |
|---|----------|--------|------------|
| 1 | Message d'erreur login en anglais | **RESOLU** | 13 erreurs Supabase traduites dans Auth.tsx |
| 2 | Onboarding bloque sans notifications | **RESOLU** | Bouton "Passer" toujours actif |
| 3 | Settings/Help/Call History inaccessibles | **RESOLU** | Ajoutes dans sidebar desktop |
| 4 | handleDeleteAccount() et handleExportData() = TODO | **RESOLU** | Implementation complete avec modal confirmation |

### IMPORTANTS — MAJORITE RESOLUS

| # | Probleme | Statut | Resolution |
|---|----------|--------|------------|
| 5 | Pas de lien vers Settings | **RESOLU** | Dans sidebar desktop |
| 6 | Pas de lien vers Help/FAQ | **RESOLU** | Dans sidebar desktop |
| 7 | Call History cache | **RESOLU** | Dans sidebar desktop |
| 8 | handleInviteFriend = TODO | **RESOLU** | Redirige vers DM |
| 9 | Deep link /join/:code casse | **A VERIFIER** | Parcours a tester |
| 10 | Pas de 404 sur /session/:id invalide | **RESOLU** | Message "Session non trouvee" |

### MINEURS — MAJORITE RESOLUS

| # | Probleme | Statut | Resolution |
|---|----------|--------|------------|
| 11 | Landing page ne scrolle pas | **RESOLU** | `min-height: 100dvh` |
| 12 | Pas de page CGU liee depuis Auth | **RESOLU** | Liens dans footer Auth + section Legal dans Settings |
| 13 | Pas de video/GIF de demo sur Landing | **A FAIRE** | Phase 2.3 Landing refonte |

---

## 3. FONCTIONNALITES MANQUANTES vs Top 5 Mondial — STATUT ACTUEL

### Manquantes CRITIQUES pour le lancement — TOUTES FAITES

| Feature | Statut |
|---------|--------|
| ~~Suppression de compte (RGPD)~~ | **FAIT** |
| ~~Export de donnees (RGPD)~~ | **FAIT** |
| ~~Lien Settings dans la navigation~~ | **FAIT** |
| ~~Skip notifications dans onboarding~~ | **FAIT** |
| ~~Traduction des erreurs Supabase Auth~~ | **FAIT** |
| ~~Page CGU / Politique de confidentialite~~ | **FAIT** |
| ~~Popup consentement cookies~~ | **FAIT** |
| ~~Tour guide interactif~~ | **FAIT** |
| ~~Email de bienvenue~~ | **FAIT** |

### Manquantes pour rivaliser avec Discord/Guilded — A FAIRE (Phase 2-3)

| Feature | Reference | Statut |
|---------|-----------|--------|
| **Reactions sur messages (emoji)** | Discord, Slack | DEJA FAIT (MessageReactions.tsx) |
| **Threads/reponses dans le chat** | Slack, Discord | DEJA FAIT (reply_to_id) |
| **Recherche dans les messages** | Tous les top apps | FAIT (P1.3) |
| **Partage d'ecran en party vocale** | Discord | A FAIRE (Phase 3.2) |
| **Statut personnalise** | Discord, Steam | A FAIRE (Phase 4.2) |
| **Integration jeux** | Discord | A FAIRE (Phase 7.3) |
| **Mentions @user dans le chat** | Tous les top apps | A FAIRE (Phase 3.1) |
| **Progressive Web App** | Standard 2026 | A FAIRE (Phase 6.2) |

---

## 5. SCORE DETAILLE PAR CATEGORIE — MIS A JOUR

| Categorie | Score initial | Score actuel | Commentaire |
|-----------|-------------|--------------|-------------|
| **Design/UI** | 9/10 | 9/10 | Niveau Linear, coherent partout |
| **Mobile** | 9/10 | 9/10 | Native-like, responsive parfait |
| **Gamification** | 10/10 | 10/10 | Meilleur que Discord (XP, challenges, classement) |
| **Onboarding** | 7/10 | **9/10** | Skip notifs + tour guide + email bienvenue |
| **Chat** | 7/10 | **8/10** | Reactions + reply-to + recherche deja faits |
| **Voix** | 8/10 | 8/10 | Solide mais pas de video/screen share |
| **Planning/RSVP** | 10/10 | 10/10 | Unique sur le marche, excellent |
| **Monetisation** | 9/10 | 9/10 | Pricing clair, gating visible, Stripe pret |
| **Navigation** | 7/10 | **9/10** | Settings + Help + CallHistory dans sidebar |
| **Conformite** | 5/10 | **9/10** | RGPD complet (delete, export, CGU, cookies, traductions) |
| **TOTAL** | **44/50 (88%)** | **47/50 (94%)** | **+3 points** |

---

## 6. PLAN D'ACTION PRIORITAIRE

---

### PHASE 1 : BLOQUANTS CRITIQUES — FAIT (47/50 atteint)

#### 1.1 - RGPD & Conformite (P0) — FAIT

- [x] Implementer suppression de compte (`handleDeleteAccount`)
- [x] Implementer export de donnees (`handleExportData`)
- [x] Page CGU / Politique de confidentialite
- [x] Popup consentement cookies

#### 1.2 - Navigation manquante (P0) — FAIT

- [x] Ajouter Settings dans la sidebar desktop
- [x] Ajouter Help/FAQ dans la sidebar desktop
- [x] Ajouter Call History dans la sidebar desktop
- [x] handleInviteFriend implemente

#### 1.3 - Onboarding (P0) — FAIT

- [x] Bouton "Passer" sur l'etape notifications (ne pas bloquer)
- [x] Tour guide interactif post-onboarding (tooltips flottants sur 5 elements cles)
- [x] Email de bienvenue (template + Edge Function)

#### 1.4 - Traductions (P0) — FAIT

- [x] Traduire TOUTES les erreurs Supabase Auth en francais
- [x] Mapper les erreurs courantes : "Invalid login credentials" > "Email ou mot de passe incorrect"

#### Corrections P1 — FAIT

- [x] Fix 404 sur /session/:id invalide
- [x] Fix scroll landing page
- [x] Recherche dans les messages

#### Performance — FAIT

- [x] Code splitting vendor chunks (9 chunks)
- [x] Fix Windows path normalization
- [x] Agora lazy loading confirme
- [x] Fix Vite 7 inline CSS build

---

### PHASE 2 : UI REVOLUTION (Semaines 2-3) — PROCHAINE ETAPE — De 47/50 a 48/50

> **C'est la prochaine phase a implementer. Le gap le plus important vs le top mondial.**

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
| **Reactions emoji** | Oui | **OUI** | ~~Ajouter~~ FAIT |
| **Mentions @user** | Oui | Non | Ajouter |
| **Threads/reponses** | Oui | **OUI** | ~~Reply to message~~ FAIT |
| **Messages epingles** | Oui | Non | Pin messages |
| **Recherche messages** | Oui | **OUI** | ~~Full-text search~~ FAIT |
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

- [x] **Code splitting agressif** (vendor chunks isoles) — FAIT
- [ ] **Lighthouse 95+** sur toutes les pages
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
- [x] Push notifications natives (deja fait)

#### 6.3 - Tests & Qualite

- [ ] Tests E2E Playwright : parcours critiques (inscription, RSVP, chat, party)
- [ ] Tests visuels : screenshot comparison (Chromatic ou Percy)
- [ ] Monitoring : Sentry errors + Web Vitals tracking
- [ ] 0 erreur console en production

#### 6.4 - SEO & Marketing

- [x] Meta tags OG complets sur toutes les pages — FAIT (index.html)
- [x] Schema.org structured data (Application) — FAIT (index.html)
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

| Categorie | Initial | Actuel | Cible | Actions cles restantes |
|-----------|---------|--------|-------|------------------------|
| **Design/UI** | 9/10 | 9/10 | **10/10** | Phase 2 (landing refonte, micro-interactions, spring physics) |
| **Mobile** | 9/10 | 9/10 | **10/10** | Phase 2 (haptics, drawer bottom sheet, PWA install) |
| **Gamification** | 10/10 | 10/10 | **10/10** | Phase 5 (badges animes, saisons, titres) |
| **Onboarding** | 7/10 | **9/10** | **10/10** | Ameliorer tour guide + email personnalise |
| **Chat** | 7/10 | **8/10** | **10/10** | Phase 3 (mentions, GIFs, fichiers, vocal, markdown) |
| **Voix** | 8/10 | 8/10 | **10/10** | Phase 3 (screen share, video, push-to-talk) |
| **Planning/RSVP** | 10/10 | 10/10 | **10/10** | Maintenir + Phase 7 (IA predictive) |
| **Monetisation** | 9/10 | 9/10 | **10/10** | Phase 5 (cosmetiques premium, saisons) |
| **Navigation** | 7/10 | **9/10** | **10/10** | Profile dropdown menu (Phase 2) |
| **Conformite** | 5/10 | **9/10** | **10/10** | Deployer send-welcome-email + verifier RESEND_API_KEY |
| **TOTAL** | **44/50** | **47/50** | **50/50** | **+3 points restants** |

---

## TIMELINE ESTIMEE

| Semaine | Phase | Focus | Score estime |
|---------|-------|-------|--------------|
| ~~S1~~ | ~~Phase 1~~ | ~~Bloquants critiques~~ | ~~47/50~~ **FAIT** |
| S2-S3 | Phase 2 | UI Revolution | 48/50 |
| S3-S5 | Phase 3 | Surpasser Discord (chat+voice) | 49/50 |
| S4-S6 | Phase 4 | Surpasser WhatsApp (DM+statut) | 49.5/50 |
| S5-S7 | Phase 5 | Surpasser PS App (gaming) | 50/50 |
| S7-S8 | Phase 6 | Performance & Infra | Maintien |
| S8-S10 | Phase 7 | Features differenciantes | Au-dela |

---

## VERDICT MIS A JOUR

> **Squad Planner est a 94% du niveau Top 5 mondial (47/50).** Phase 1 complete, tous les bloquants critiques resolus.
>
> **Prochaine priorite : Phase 2 (UI Revolution)** — C'est le gap le plus visible vs Linear/Vercel/Arc. La landing page et les micro-interactions feront la difference.
>
> **Le lancement est viable maintenant** (RGPD conforme, onboarding fluide, navigation complete, erreurs traduites). Les phases 2-7 sont du polish et des features avancees.

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
