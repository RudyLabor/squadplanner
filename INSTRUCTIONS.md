# Squad Planner — Instructions Agent

> Ce fichier est lu automatiquement par l'agent Claude au début de chaque session.
> Dernière mise à jour : 13 février 2026

---

## 🚨 RÈGLES CRITIQUES (LIRE EN PREMIER)

### INTERDICTIONS ABSOLUES

- ❌ **NE JAMAIS exécuter `git add .`** — Ça stage des milliers de fichiers inutiles
- ❌ **NE JAMAIS créer de fichiers nommés `nul`, `con`, `aux`, `prn`** — Ce sont des noms réservés Windows
- ❌ **NE JAMAIS chercher dans `app/routes/`** — Ce dossier N'EXISTE PAS
- ❌ **NE JAMAIS exécuter `rm -rf`** — On est sur Windows, utiliser `Remove-Item`
- ❌ **NE JAMAIS exécuter `ls -la`** — Utiliser `Get-ChildItem` ou `dir` (PowerShell)
- ❌ **NE JAMAIS dire "terminé" sans avoir testé**
- ❌ **NE JAMAIS ignorer les erreurs console**
- ❌ **NE JAMAIS modifier du code sans comprendre les foreign keys associées**

### ENVIRONNEMENT

- **OS** : Windows 11
- **Shell** : PowerShell (PAS bash)
- **Commandes Unix interdites** : `ls`, `cat`, `rm`, `cp`, `mv`, `touch`, `grep`
- **Utiliser à la place** : `Get-ChildItem`, `Get-Content`, `Remove-Item`, `Copy-Item`, `Move-Item`, `New-Item`, `Select-String`

### LANGUE

**Toujours répondre en Français.**

---

## 📁 STRUCTURE DU PROJET

Ce projet est un **React + Vite + TypeScript**. Les pages sont dans `src/pages/`, PAS dans `app/routes/`.

```
C:\Users\RudyL\Documents\Squadplannerlast\
├── src/
│   ├── App.tsx              # Routes principales + Auth init
│   ├── components/
│   │   ├── ui/              # Button, Card, Input, Badge, Toast
│   │   ├── layout/          # AppLayout (sidebar desktop + bottom bar mobile)
│   │   ├── CallModal.tsx     # Modal appel en cours
│   │   ├── IncomingCallModal.tsx # Modal appel entrant
│   │   ├── MessageStatus.tsx # Read receipts (✓✓)
│   │   ├── TypingIndicator.tsx # "Pierre écrit..."
│   │   ├── NetworkQualityIndicator.tsx # Qualité réseau Agora
│   │   ├── PremiumGate.tsx   # Gating features premium
│   │   ├── PremiumUpgradeModal.tsx # Modal upgrade premium
│   │   ├── CallHistory.tsx   # Historique appels
│   │   └── LazyComponents.tsx # Lazy loading
│   ├── hooks/
│   │   ├── useAuth.ts        # Auth + profile (Zustand store)
│   │   ├── useSquads.ts      # Squads CRUD (Zustand store)
│   │   ├── useMessages.ts    # Chat realtime + read receipts
│   │   ├── useDirectMessages.ts # DM 1-to-1 (Zustand store)
│   │   ├── useSessions.ts    # Sessions + RSVP + auto-confirm
│   │   ├── useVoiceChat.ts   # Agora party vocale + reconnect
│   │   ├── useVoiceCall.ts   # Agora appels 1-to-1 + push
│   │   ├── useCallHistory.ts # Historique appels
│   │   ├── useNetworkQuality.ts # Audio adaptatif Agora
│   │   ├── useTypingIndicator.ts # "Pierre écrit..."
│   │   ├── usePushNotifications.ts # Web Push + Service Worker
│   │   ├── useAI.ts          # Planning/Decision/Coach/RSVP (toutes les IA)
│   │   ├── useSubscription.ts # Stripe integration
│   │   ├── usePremium.ts     # Gating premium features
│   │   └── index.ts          # Exports centralisés
│   ├── pages/                # ⚠️ TOUTES les pages sont ICI
│   │   ├── Home.tsx          # Dashboard + stats + squads récentes
│   │   ├── Auth.tsx          # Login/Register + mot de passe oublié
│   │   ├── Squads.tsx        # Liste des squads + création + join
│   │   ├── SquadDetail.tsx   # Détail squad: membres, sessions, settings
│   │   ├── SessionDetail.tsx # Détail session: RSVP, check-in, participants
│   │   ├── Sessions.tsx      # Liste sessions + suggestion IA
│   │   ├── Messages.tsx      # Chat squad + DM
│   │   ├── Profile.tsx       # Score fiabilité, stats, premium upsell
│   │   ├── Settings.tsx      # Paramètres utilisateur
│   │   ├── Party.tsx         # Party vocale Agora
│   │   ├── Landing.tsx       # Landing page publique
│   │   ├── Onboarding.tsx    # Onboarding nouvel utilisateur
│   │   └── index.ts          # Exports
│   ├── lib/
│   │   ├── supabase.ts       # Client Supabase initialisé
│   │   ├── theme.ts          # Tokens design + animations
│   │   └── systemMessages.ts # Messages système automatiques
│   └── types/
│       └── database.ts       # Types TypeScript générés depuis Supabase
├── supabase/
│   ├── functions/            # Edge Functions (12 actives)
│   │   ├── ai-planning/      # Suggestion créneaux optimaux (Claude)
│   │   ├── ai-decision/      # Aide à la décision squad (Claude)
│   │   ├── ai-reliability/   # Score fiabilité + badges
│   │   ├── ai-coach/         # Tips IA personnalisés (Claude)
│   │   ├── ai-rsvp-reminder/ # Relance RSVP auto (Claude)
│   │   ├── agora-token/      # Génération tokens Agora AccessToken2
│   │   ├── stripe-webhook/   # Événements Stripe
│   │   ├── create-checkout/  # Stripe checkout session
│   │   ├── create-portal/    # Stripe customer portal
│   │   ├── cancel-subscription/ # Annulation abonnement
│   │   ├── send-reminders/   # Rappels sessions (+ CRON)
│   │   └── send-push/        # Push notifications Web Push
│   └── migrations/           # Migrations SQL
├── public/
│   └── sw.js                 # Service Worker pour push notifications
├── docs/
│   └── STRIPE_LIVE_SETUP.md  # Guide migration Stripe Live
├── GEMINI.md                 # Mémoire projet complète (LIRE POUR CONTEXTE)
├── BIBLE.md                  # Document fondateur produit
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 🛠️ STACK TECHNIQUE

| Couche   | Techno                                                |
| -------- | ----------------------------------------------------- |
| Frontend | React 18 + Vite + TypeScript                          |
| Styling  | TailwindCSS + Framer Motion                           |
| State    | Zustand (stores dans hooks/)                          |
| Backend  | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| Vocal    | Agora SDK (`agora-rtc-sdk-ng`)                        |
| Paiement | Stripe (mode test)                                    |
| Push     | Web Push API + Service Worker                         |
| IA       | Claude 3 Haiku via Edge Functions                     |

### Commandes

```powershell
npm run dev          # Serveur de dev → localhost:5173
npm run build        # Build production
npm run lint         # Linter ESLint
```

---

## 🎨 DESIGN SYSTEM — Linear Dark

| Token         | Valeur    | Usage                   |
| ------------- | --------- | ----------------------- |
| bg-base       | `#08090a` | Fond principal          |
| bg-elevated   | `#101012` | Cards, modals           |
| text-primary  | `#f7f8f8` | Texte principal         |
| color-primary | `#5e6dd2` | Actions, liens (Violet) |
| color-success | `#4ade80` | Confirmations (Vert)    |
| color-warning | `#f5a623` | Alertes (Orange)        |
| color-error   | `#ef4444` | Erreurs (Rouge)         |

---

## 🗄️ BASE DE DONNÉES SUPABASE

### Tables

| Table                | Description                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| `profiles`           | Profils users + `reliability_score`, `total_sessions`, `total_checkins` |
| `squads`             | Squads + `is_premium`, `invite_code`                                    |
| `squad_members`      | Membres d'une squad (rôles: owner/member)                               |
| `sessions`           | Sessions de jeu + `auto_confirm_threshold`                              |
| `session_rsvps`      | Réponses RSVP (present/absent/maybe) + `changed_count`                  |
| `session_checkins`   | Check-ins réels (present/late/noshow)                                   |
| `messages`           | Messages chat squad + session                                           |
| `direct_messages`    | DM 1-to-1                                                               |
| `party_participants` | Participants party vocale                                               |
| `subscriptions`      | Sync Stripe                                                             |
| `ai_insights`        | Insights IA générés                                                     |
| `calls`              | Historique appels vocaux 1-to-1                                         |
| `push_subscriptions` | Abonnements Web Push                                                    |
| `reminder_logs`      | Logs des rappels (anti-doublon)                                         |

### Comptes de test

| Email                    | Password         | Rôle                         |
| ------------------------ | ---------------- | ---------------------------- |
| testowner@squadtest.dev  | TestPassword123! | Owner de "Test Squad Alpha"  |
| testmember@squadtest.dev | TestPassword123! | Membre de "Test Squad Alpha" |

---

## ⚠️ PIÈGES CONNUS (À LIRE ABSOLUMENT)

1. **Trigger `on_auth_user_created`** — Ne se déclenche PAS via Admin API. Créer le profil manuellement.
2. **RLS `squad_members`** — Utilise `is_squad_member()` / `is_squad_owner()` en SECURITY DEFINER. Ne PAS modifier sans comprendre.
3. **Navigation onboarding** — Boutons avec CSS transitions (pas Framer Motion) pour éviter bugs double-clic.
4. **Upload avatar** — Compression côté client obligatoire (400px max, JPEG 80%).
5. **Déconnexion** — Utilise `window.location.href = '/auth'` (pas `navigate()`) pour clear le state.
6. **Supabase Realtime** — TOUJOURS cleanup les subscriptions dans `useEffect` return. Sinon memory leaks.
7. **Agora UID** — Les UUID Supabase sont trop longs. Utiliser `uuidToNumericUid()` pour convertir en entier 32-bit.
8. **Agora tokens** — `AGORA_APP_CERTIFICATE` doit être dans Supabase secrets. Edge Function `agora-token` génère AccessToken2.
9. **Framer Motion mobile** — `motion.button` avec `whileHover`/`whileTap` ne marchent pas sur tactile. Utiliser `button` natif + `onPointerDown`.
10. **RLS squad_members INSERT** — Par défaut, seul l'utilisateur peut s'ajouter. Pour inviter directement, la policy doit autoriser les owners.
11. **pg_cron** — Doit être activé via Dashboard (Database > Extensions) AVANT d'appliquer la migration.

---

## 🎯 VISION PRODUIT

**Squad Planner** = L'outil qui transforme "on joue un jour" en "on joue mardi 21h et tout le monde est là".

### Les 3 Piliers

1. **Party vocale persistante** (comme PlayStation App)
2. **Planning avec décision forcée** (RSVP obligatoire)
3. **Mesure de la fiabilité réelle** (check-in, score)

### Règle d'Or

> Si une fonctionnalité n'augmente pas la présence réelle, n'aide pas à décider, ou n'améliore pas la fiabilité — **elle ne doit pas exister**.

---

## 📋 MÉTHODOLOGIE DE TRAVAIL

```
1. Lire le code concerné
2. Identifier TOUTES les dépendances (DB, hooks, stores)
3. Coder la modification
4. Tester localement
5. Vérifier la console (0 erreur)
6. Valider le résultat
```

### Checklist qualité

- **Wording** — Authentique ? Pas de bullshit corporate ?
- **UI** — Niveau Linear/Notion ? Animations fluides ?
- **UX** — Parcours logique ? Feedback immédiat ?
- **Détails** — Loading states ? Messages d'erreur clairs ?
- **Célébration** — Moment de satisfaction pour l'utilisateur ?

---

## 📦 ÉTAT ACTUEL (Février 2026)

Score global : **48.5/50 (97%)**

Toutes les features core sont implémentées :

- ✅ Party vocale + Reconnect + Audio Adaptatif
- ✅ Chat squad realtime + Read Receipts + Typing
- ✅ Chat DM + Messages système
- ✅ Appels 1-to-1 + Historique + Push
- ✅ Sessions + RSVP + Auto-confirm
- ✅ Check-in + Score fiabilité
- ✅ Notifications Push (SW + VAPID)
- ✅ Premium Gating (Stripe)
- ✅ IA intégrée (Claude API)
- ✅ Cron jobs (pg_cron)

### Tests restants

- [ ] Party vocale avec 2+ vrais utilisateurs
- [ ] Appels 1-to-1 avec 2 vrais utilisateurs
- [ ] Push notifications sur mobile réel
- [ ] Passer Stripe en mode Live
