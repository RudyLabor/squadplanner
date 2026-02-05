# Squad Planner - Mémoire Projet

> Ce fichier est lu par chaque nouvel agent au début de chaque conversation.
> Dernière mise à jour: 5 février 2026 - 15h00

---

## 🚨 RÈGLES DE TRAVAIL OBLIGATOIRES (NON NÉGOCIABLE)

### AVANT CHAQUE MODIFICATION DE CODE :

1. **TESTER AVANT** — Comprendre le code existant et ses dépendances
2. **VÉRIFIER LES CONTRAINTES DB** — Foreign keys, triggers, RLS policies
3. **TESTER APRÈS** — Tester EN VRAI avec un nouveau compte, pas juste visuellement

### APRÈS CHAQUE MODIFICATION :

1. **TESTER LE PARCOURS COMPLET** — Pas juste la feature isolée
2. **VÉRIFIER LA CONSOLE** — Aucune erreur tolérée
3. **TESTER AVEC UN NOUVEAU COMPTE** — Les comptes existants masquent les bugs

### MÉTHODOLOGIE OBLIGATOIRE :

```
1. Lire le code concerné
2. Identifier TOUTES les dépendances (DB, hooks, stores)
3. Coder la modification
4. Tester localement avec un NOUVEAU compte
5. Vérifier la console (0 erreur)
6. Commit + Push
7. Mettre à jour ce fichier
```

### CE QUI EST INTERDIT :

- ❌ Déclarer "terminé" sans avoir testé avec un nouveau compte
- ❌ Ignorer les erreurs console
- ❌ Modifier du code sans comprendre les foreign keys associées
- ❌ Faire des corrections ponctuelles sans audit global
- ❌ Avancer sur une nouvelle feature si la précédente a des bugs

---

## 📖 BIBLE DU PROJET (LECTURE OBLIGATOIRE)

👉 **[BIBLE.md](./BIBLE.md)** — Document fondateur complet

### Règle Absolue

> **Tant qu'une étape n'est pas 100% fonctionnelle et testée, on n'avance PAS à la suivante.**

### Checklist Nouvel Agent

1. ✅ Lire GEMINI.md (ce fichier)
2. ✅ Lire **BIBLE.md** en entier
3. ✅ Identifier l'étape en cours dans la roadmap
4. ✅ Compléter cette étape à 100%
5. ✅ Mettre à jour l'état réel ici

---

## 🎯 AUDIT TOP 5 MONDIAL 2026 (5 février 2026)

### Score Global : 38.3/50 (77%) — Objectif : 46+/50 (92%)

> Audit réalisé selon les critères des meilleures apps mondiales 2026 (Linear, Notion, Arc, Vercel, Discord)

### 📊 Scores par Page

| Page | Score | Wording | UI | UX | Détails | Célébration |
|------|-------|---------|----|----|---------|-------------|
| **Landing** | 38/50 | 6/10 | 7/10 | 8/10 | 6/10 | 5/10 |
| **Home** | 38/50 | 7/10 | 6/10 | 7/10 | 5/10 | 3/10 |
| **Auth** | 38/50 | 7/10 | 7.5/10 | 8/10 | 6/10 | 9.5/10 |
| **Squads** | 41/50 | 8/10 | 8.5/10 | 7/10 | 7.5/10 | 6/10 |
| **SquadDetail** | 38/50 | 7/10 | 8/10 | 7/10 | 7/10 | 2/10 |
| **Party** | 36/50 | 7/10 | 6/10 | 7/10 | 5/10 | 5/10 |
| **Messages** | 36/50 | 7/10 | 8/10 | 8/10 | 6/10 | 7/10 |
| **Profile** | 38/50 | 8/10 | 7/10 | 7/10 | 7/10 | 2/10 |
| **Navigation** | 42/50 | 8.5/10 | 8/10 | 7.5/10 | 6.5/10 | 5/10 |

### 📈 Score par Catégorie vs BIBLE

| Catégorie | Requis | Implémenté | Score |
|-----------|--------|------------|-------|
| 🟢 **Pilier 1 - Party vocale** | 100% | 90% | ✅ |
| 🟡 **Pilier 2 - Planning** | 100% | 95% | ✅ |
| 🔵 **Pilier 3 - Fiabilité** | 100% | 100% | ✅ |
| 💬 **Communication** | 100% | 95% | ✅ |
| 🤖 **IA** | 100% | 60% | ⚠️ |
| 💰 **Monétisation** | 100% | 50% | ⚠️ |
| 📞 **Appels 1-to-1** | 100% | 0% | 🔴 |
| 🔔 **Notifications Push** | 100% | 10% | 🔴 |

### 🔴 2 LACUNES CRITIQUES (Conditions de mort BIBLE)

1. **Appels 1-to-1** — Parcours D non implémenté du tout
2. **Notifications Push** — Seulement Browser API (app doit être ouverte)

---

## 🔴 PROBLÈMES CRITIQUES À CORRIGER

### Point Faible #1 : CÉLÉBRATION (moyenne 4.9/10)

| Page | Score | Problème |
|------|-------|----------|
| **SquadDetail** | 2/10 | ❌ ZERO toast après RSVP, ZERO feedback party rejoint |
| **Profile** | 2/10 | ❌ ZERO animation score, ZERO confetti 100% |
| **Home** | 3/10 | ❌ ZERO gamification, streaks, récompenses visuelles |
| **Party** | 5/10 | ❌ Pas de toast connexion réussie, pas de confetti |
| **Landing** | 5/10 | ❌ Pas de vidéo/GIF démo, pas d'interactivité |

### Bugs Fonctionnels Critiques

| Bug | Impact | Page | Temps Fix |
|-----|--------|------|-----------|
| **Username = "User {uid}"** | Impossible d'identifier qui parle | Party.tsx ligne 92 | 1h |
| **Badge messages cassé** | Faux système de counting (TODO) | AppLayout.tsx | 4h |
| **Mot de passe oublié vide** | Bouton sans action | Auth.tsx | 2h |
| **RSVP sans feedback** | Utilisateur doute du clic | SquadDetail.tsx | 2h |

---

## ⚡ TOP 10 QUICK WINS (< 4h chaque)

| # | Tâche | Temps | Impact | Fichier |
|---|-------|-------|--------|---------|
| 1 | **Fix username Party.tsx** | 1h | 🔴 Bug critique | `src/pages/Party.tsx:92` |
| 2 | **Toast après RSVP** | 2h | +3pts SquadDetail | `src/pages/SquadDetail.tsx` |
| 3 | **Toast rejoindre Party** | 1h | +2pts Party | `src/pages/Party.tsx` |
| 4 | **Confetti score 100% Profile** | 2h | +3pts Profile | `src/pages/Profile.tsx` |
| 5 | **CountUp animation fiabilité** | 2h | +2pts global | Tous les scores |
| 6 | **Mobile active state visual** | 2h | +1.5pts Nav | `src/components/layout/AppLayout.tsx` |
| 7 | **Mot de passe oublié fonctionnel** | 2h | +1.5pts Auth | `src/pages/Auth.tsx` |
| 8 | **Agrandir boutons RSVP mobile** | 30min | +1pt SquadDetail | `src/pages/SquadDetail.tsx` |
| 9 | **Stagger animations Landing** | 2h | +2pts Landing | `src/pages/Landing.tsx` |
| 10 | **Badge pop animation** | 1h | +1pt Nav | `src/components/layout/AppLayout.tsx` |

---

## 🎯 ROADMAP PRIORISÉE

### 🔴 Phase 3 : FONCTIONNALITÉS CRITIQUES (Semaine 1-2)

| Tâche | Priorité | Temps | Impact |
|-------|----------|-------|--------|
| **Appels 1-to-1 Agora** | 🔴 CRITIQUE | 3-4 jours | Parcours D BIBLE |
| **Notifications Push (Web Push + SW)** | 🔴 CRITIQUE | 2-3 jours | Condition mort #2 |
| **Fix badge messages (vrai tracking)** | 🔴 CRITIQUE | 4h | UX cassée |
| **Fix username Party ("User {uid}")** | 🔴 CRITIQUE | 1h | UX cassée |
| **Gating Premium actif** | 🔴 HAUTE | 1 jour | Business |

#### 3.1 Appels 1-to-1 (Parcours D BIBLE) — ❌ NON IMPLÉMENTÉ
- [ ] Intégration Agora Voice Call SDK (1-to-1)
- [ ] UI appel entrant/sortant (modal plein écran)
- [ ] Push notifications VoIP (app fermée)
- [ ] États : ringing, connected, ended, missed
- [ ] Historique appels
- [ ] Bouton appel depuis DM et profil membre

#### 3.2 Notifications Push — ❌ 10% SEULEMENT
- [ ] Service Worker (`public/sw.js`)
- [ ] VAPID keys configuration
- [ ] Web Push subscription handling
- [ ] Edge Function pour envoyer les push
- [ ] Notifications rappel session (1h avant, 15min avant)
- [ ] Notifications nouveau message / DM
- [ ] Notifications appel entrant

#### 3.3 Fix Bugs Critiques
- [ ] **Party.tsx ligne 92** : Remplacer `User ${uid}` par vrai username
- [ ] **AppLayout.tsx** : Implémenter vrai tracking messages lus
- [ ] **Auth.tsx** : Implémenter `handleForgotPassword()` avec `supabase.auth.resetPasswordForEmail()`
- [ ] **SquadDetail.tsx** : Ajouter toast après RSVP

---

### 🟠 Phase 4 : COMPLÉTUDE PRODUIT (Semaine 3-4)

| Tâche | Priorité | Temps | Impact |
|-------|----------|-------|--------|
| **IA Coach dynamique (API)** | 🟠 HAUTE | 2 jours | Différenciateur |
| **Champs Squad complets** | 🟠 HAUTE | 4h | Parcours B BIBLE |
| **Messages système** | 🟠 HAUTE | 1 jour | Parcours E BIBLE |
| **Auto-confirm sessions** | 🟠 MOYENNE | 4h | Automatisation |
| **Reconnect logic Agora** | 🟠 MOYENNE | 4h | Robustesse |

#### 4.1 IA fonctionnelle (Section 7 BIBLE)
- [ ] Remplacer texte IA Coach hardcodé par appel Edge Function
- [ ] Intégrer Claude/OpenAI/Gemini pour conseils personnalisés
- [ ] IA relance RSVP automatique
- [ ] IA détection no-show chronique

#### 4.2 Création Squad complète (Parcours B BIBLE)
- [ ] Ajouter champ fuseau horaire
- [ ] Ajouter champ taille idéale (2-10 joueurs)
- [ ] Ajouter règles (jours préférés, heure habituelle, durée moyenne)

#### 4.3 Messages système (Parcours E BIBLE)
- [ ] "X a rejoint la squad"
- [ ] "Session confirmée pour [date]"
- [ ] "Y est en retard"
- [ ] "Session annulée"

---

### 🟡 Phase 5 : CÉLÉBRATION & POLISH (Semaine 5-6)

| Tâche | Priorité | Temps | Impact |
|-------|----------|-------|--------|
| **Toast RSVP + Party rejoint** | 🟡 HAUTE | 2h | +3pts SquadDetail |
| **Confetti score 100%** | 🟡 HAUTE | 2h | +3pts Profile |
| **CountUp animation scores** | 🟡 HAUTE | 2h | +2pts partout |
| **Page transitions (AnimatePresence)** | 🟡 MOYENNE | 4h | +2pts global |
| **Vidéo/GIF démo Landing** | 🟡 MOYENNE | 1 jour | +5pts Landing |
| **Read receipts (✓✓)** | 🟡 MOYENNE | 4h | +3pts Messages |
| **Typing indicator** | 🟡 MOYENNE | 4h | +2pts Messages |
| **Mobile active state visual** | 🟡 BASSE | 2h | +1.5pts Nav |

#### 5.1 Célébrations à ajouter
```tsx
// SquadDetail - Après RSVP
setSuccessMessage('✅ Tu es inscrit présent !')

// Party - Après connexion
setSuccessMessage('🔴 T\'es live ! Connecté à la party')

// Profile - Score 100%
<Confetti /> + <Award className="animate-bounce" />
```

#### 5.2 Animations à améliorer
- [ ] CountUp animation sur tous les scores (react-countup)
- [ ] Page transitions avec AnimatePresence
- [ ] Stagger animations sur listes (0.1s delay par item)
- [ ] Badge "pop" animation nouveaux messages
- [ ] Skeleton loading states partout

---

### 🔵 Phase 6 : FEATURES V2/V3 (Semaine 7+)

| Tâche | Priorité | Description |
|-------|----------|-------------|
| Stats avancées (graphiques) | V3 | Premium feature |
| Rôles (coach, manager) | V3 | Premium feature |
| Qualité audio HD | V3 | Premium feature |
| Export calendrier | V3 | Google Cal, Apple Cal |
| IA prédictive | V4 | Machine learning |

---

## 📈 PROJECTION SCORES APRÈS CORRECTIONS

| Phase | Score Actuel | Score Cible | Gain |
|-------|--------------|-------------|------|
| **Actuel** | 38.3/50 (77%) | - | - |
| Après Phase 3 | 38.3/50 | 40/50 (80%) | +2 |
| Après Phase 4 | 40/50 | 42/50 (84%) | +2 |
| **Après Phase 5** | 42/50 | **46/50 (92%)** | +4 |
| Après Phase 6 | 46/50 | **48/50 (96%)** | +2 |

---

## ⚠️ PIÈGES CONNUS (LIRE ABSOLUMENT)

1. **Trigger `on_auth_user_created`** — Ne se déclenche PAS quand on crée un user via Admin API. Créer le profil manuellement.

2. **RLS `squad_members`** — Utilise des fonctions SECURITY DEFINER (`is_squad_member()`, `is_squad_owner()`). Ne pas modifier sans comprendre.

3. **Navigation onboarding** — Les boutons utilisent des CSS transitions (pas Framer Motion) pour éviter les bugs de double-clic.

4. **Upload avatar** — Compression côté client obligatoire (400px max, JPEG 80%) sinon trop lent.

5. **Déconnexion** — Utilise `window.location.href = '/auth'` (pas `navigate()`) pour forcer le clear du state.

6. **Party vocale Agora** — Le code est validé mais JAMAIS testé avec 2+ vrais utilisateurs.

7. **Supabase Realtime** — Les subscriptions doivent être cleanup dans `useEffect` return. Sinon memory leaks.

8. **Party.tsx ligne 92** — 🔴 BUG: Username hardcodé `User ${uid}` au lieu du vrai nom.

9. **AppLayout badge messages** — 🔴 BUG: Système de counting faux (TODO non implémenté).

---

## 🛠️ INFORMATIONS TECHNIQUES

### Structure du projet

```
src/
├── components/
│   ├── ui/              # Composants réutilisables (Button, Card, Input, etc.)
│   ├── layout/          # AppLayout, MobileNav, DesktopSidebar
│   └── ...              # Composants métier
├── hooks/
│   ├── useAuth.ts       # Auth + profile (Zustand store)
│   ├── useSquads.ts     # Squads CRUD (Zustand store)
│   ├── useMessages.ts   # Chat realtime (Zustand store)
│   ├── useDirectMessages.ts # DM 1-to-1 (Zustand store)
│   ├── useSessions.ts   # Sessions + RSVP
│   ├── useVoiceChat.ts  # Agora voice (party vocale)
│   ├── useAI.ts         # Planning/Decision/Reliability
│   ├── useSubscription.ts # Stripe integration
│   └── index.ts         # Exports centralisés
├── pages/               # Pages par route
├── lib/
│   ├── supabase.ts      # Client Supabase
│   └── theme.ts         # Tokens design + animations
└── App.tsx              # Routes + providers
```

### Tables Supabase

| Table | Description |
|-------|-------------|
| `profiles` | Profils utilisateurs + `reliability_score`, `total_sessions`, `total_checkins` |
| `squads` | Squads + `is_premium`, `invite_code` |
| `squad_members` | Membres d'une squad |
| `sessions` | Sessions de jeu + `auto_confirm_threshold` |
| `session_rsvps` | Réponses RSVP + `changed_count` tracking |
| `session_checkins` | Check-ins réels (present/late/noshow) |
| `messages` | Messages chat squad + session |
| `direct_messages` | DM 1-to-1 |
| `party_participants` | Participants party vocale |
| `subscriptions` | Stripe sync |
| `ai_insights` | Insights IA générés |

### Edge Functions Supabase

| Function | Description | État |
|----------|-------------|------|
| `ai-planning` | Suggestion créneaux optimaux | ✅ Implémenté |
| `ai-decision` | Aide à la décision squad | ✅ Implémenté |
| `ai-reliability` | Score fiabilité + badges | ✅ Implémenté |
| `agora-token` | Token generation (simplifié) | ✅ Implémenté |
| `stripe-webhook` | Subscription events | ✅ Implémenté |
| `create-checkout` | Stripe checkout | ✅ Implémenté |
| `send-reminders` | Rappels sessions | ✅ Implémenté |

### Commandes

```bash
npm run dev          # Serveur de dev (localhost:5173)
npm run build        # Build production
npm run lint         # Linter
npm run test         # Tests E2E Playwright
```

### Comptes de test

| Email | Password | Rôle |
|-------|----------|------|
| testowner@squadtest.dev | TestPassword123! | Owner de "Test Squad Alpha" |
| testmember@squadtest.dev | TestPassword123! | Membre de "Test Squad Alpha" |

**Squad de test** : Test Squad Alpha (Valorant) - Code invite : **43FC85BC**

---

## Design System

Thème : **Linear Dark**

| Token | Valeur |
|-------|--------|
| bg-base | #08090a |
| bg-elevated | #101012 |
| text-primary | #f7f8f8 |
| color-primary | #5e6dd2 (Violet) |
| color-success | #4ade80 (Vert) |
| color-warning | #f5a623 (Orange) |
| color-error | #ef4444 (Rouge) |

---

## 📦 SERVICES EXTERNES

### Agora (Party vocale + Appels 1-to-1)

| Info | Valeur |
|------|--------|
| Console | https://console.agora.io |
| SDK | `agora-rtc-sdk-ng` (installé) |
| État | ⚠️ Party OK, Appels 1-to-1 NON IMPLÉMENTÉS |

### Stripe (Premium)

| Info | Valeur |
|------|--------|
| Console | https://dashboard.stripe.com |
| État | ✅ Webhooks + Checkout implémentés |
| Gating | ❌ Non actif (features premium accessibles à tous) |

### Push Notifications

| Info | Valeur |
|------|--------|
| Service | Web Push API |
| État | ❌ 10% - Browser API seulement, pas de Service Worker |

---

## Langue

**Toujours répondre en Français.**

## Rôle de l'Agent : CO-FONDATEUR TECHNIQUE

**Tu n'es PAS un simple exécutant. Tu es le co-fondateur technique de Squad Planner.**

### Niveau d'exigence TOP 5 MONDIAL

Avant de considérer une feature comme "terminée", vérifie :

1. **Wording** — Authentique ? Pas de bullshit corporate ?
2. **UI** — Niveau Linear/Notion ? Animations fluides ?
3. **UX** — Parcours logique ? Feedback immédiat ?
4. **Détails** — Loading states ? Messages d'erreur clairs ?
5. **Célébration** — Moment de satisfaction pour l'utilisateur ?

**Si la réponse est NON à l'une de ces questions, la feature n'est pas terminée.**

---

## VISION PRODUIT (NON NÉGOCIABLE)

**Squad Planner EST :**

> L'outil qui transforme une intention molle ("on joue un jour")
> en engagement concret et répété ("on joue mardi 21h et tout le monde est là").

### Les 3 Piliers (BIBLE)

1. **Party vocale persistante** (comme PlayStation App)
2. **Planning avec décision forcée** (RSVP obligatoire)
3. **Mesure de la fiabilité réelle** (check-in, score)

### Règle d'Or

> Si une fonctionnalité n'augmente pas la présence réelle, n'aide pas à décider, ou n'améliore pas la fiabilité — **elle ne doit pas exister**.

---

## 📋 CHECKLIST PRÉ-LANCEMENT

### Fonctionnalités BIBLE (NON NÉGOCIABLE)

- [x] Party vocale (UI validée, test 2+ users à faire)
- [x] Chat squad realtime
- [x] Chat 1-to-1 / DM
- [ ] **Appels 1-to-1** avec notification app fermée
- [x] Création session + RSVP + confirmation auto
- [x] Check-in + score fiabilité
- [ ] **Notifications push fonctionnelles**
- [ ] **Gating Premium actif**

### Qualité

- [ ] 0 erreur console
- [ ] Lighthouse Performance 90+
- [ ] Testé sur Chrome, Safari, Firefox
- [ ] Testé sur mobile (iOS + Android)
- [ ] Tests E2E passent à 100%

### Quick Wins Célébration

- [ ] Toast après RSVP
- [ ] Toast rejoindre Party
- [ ] Confetti score 100%
- [ ] CountUp animations
- [ ] Page transitions

---

**Tu ne construis pas une app. Tu construis une machine à transformer des intentions molles en habitudes concrètes.**
