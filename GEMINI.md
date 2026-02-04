# Squad Planner - Mémoire Projet 🧠

> Ce fichier est lu par chaque nouvel agent au début de chaque conversation.
> Dernière mise à jour: 2026-02-04

---

## 🔥 VISION PRODUIT (NON NÉGOCIABLE)

**Squad Planner n'est PAS :**

- un réseau social gaming
- un feed
- une app communautaire vague

**Squad Planner EST :**

> L'outil qui transforme une intention molle ("on joue un jour")
> en engagement concret et répété ("on joue mardi 21h et tout le monde est là").

### Règle d'Or Finale

> Si une fonctionnalité n'augmente pas la présence réelle, n'aide pas à décider, ou n'améliore pas la fiabilité — **elle ne doit pas exister**.

---

## 🎯 PROBLÈME À RÉSOUDRE

Les joueurs ont :

- des amis
- Discord
- des jeux

Mais ils ne jouent pas ensemble régulièrement parce que :

- personne ne tranche
- tout le monde dit "on verra"
- les no-shows tuent la motivation
- aucun outil ne crée du commitment réel

**Squad Planner doit faire mieux que Discord + Google Calendar combinés.**

---

## 🧩 FONCTIONNALITÉS CORE (BASE PRODUIT)

### 1️⃣ Squads

- Créer une squad (Nom, jeu principal, fuseau horaire)
- Invitations par lien / pseudo
- Rôles simples (owner / membre)

### 2️⃣ Sessions

- Proposer un créneau : date, heure, durée, jeu, commentaire optionnel
- **RSVP obligatoire** :
  - ✅ Présent
  - ❌ Absent
  - ⏳ Peut-être (pénalisé)
- Clôture automatique quand X% ont répondu
- Statut clair : proposée / confirmée / annulée

### 3️⃣ Engagement réel

- **Check-in au moment de la session** :
  - "Je suis là"
  - "Je suis en retard"
  - "Je ne viens pas"
- Historique réel (pas déclaratif)
- Calcul de fiabilité par joueur

---

## 🤖 IA NATIVE — CŒUR DU PRODUIT (OBLIGATOIRE)

L'IA n'est PAS un chatbot gadget. Elle est le moteur de l'engagement et de la monétisation.

### 🧠 IA #1 — PLANIFICATION INTELLIGENTE

L'IA analyse :

- historique des sessions
- taux de présence réel
- horaires/jours qui fonctionnent
- comportements individuels (retards, no-shows)

**Fonctions :**

- suggestion automatique de créneaux
- score de fiabilité par créneau
- avertissement quand un créneau est risqué

> Exemple : "Jeudi 21h = 92% de présence historique. Vendredi 22h = 54% (risque élevé)"

### 🧠 IA #2 — IA DE DÉCISION (ANTI "ON VERRA")

Quand une squad hésite trop :

- l'IA recommande un choix final
- explique pourquoi (données factuelles)
- pousse à l'action

**Objectif : forcer la décision quand les humains procrastinent**

### 🧠 IA #3 — IA DE FIABILITÉ SOCIALE

Par joueur :

- % présence
- % no-show
- retards
- régularité

**Utilisation :**

- score de fiabilité
- badges crédibles (pas gamifiés idiots)
- détection des membres toxiques (silencieuse, factuelle)

### 🧠 IA #4 — IA DE COMMUNICATION CONTEXTUELLE

**Dans le chat :**

- suggestions de messages utiles
- rappels intelligents
- résumés post-session automatiques

**Pendant une session :**

- rappels vocaux
- check-in facilité

### 🧠 IA #5 — IA COACH (DISCRÈTE)

L'IA agit comme un coach silencieux :

- explique les conséquences
- propose des améliorations
- jamais intrusive
- jamais moralisatrice

> Exemples :
>
> - "Vos sessions fonctionnent mieux quand elles sont planifiées 48h à l'avance."
> - "Les sessions après 22h ont +35% de no-show."

---

## 💬 CHAT & VOCAL IN-APP

### Chat messages

- 1-to-1
- chat de squad
- chat de session
- moderne, rapide, fiable (niveau Discord / PlayStation App)

### Chat vocal

- vocal in-app via Agora
- rejoindre un vocal de session
- qualité haute, latence faible
- UX simple, sans friction

**Discord pourra être ajouté plus tard, mais l'app doit être autonome.**

---

## 💰 MONÉTISATION

### Gratuit

- 1–2 squads
- planning basique
- rappels simples
- IA limitée

### Premium Squad (15–25€/mois/squad)

- abonnement mensuel renouvelable
- résiliable à tout moment
- réduction annuelle (–20%)

**Inclus :**

- IA avancée
- stats complètes
- historique long terme
- automatisations
- exports calendrier
- rôles avancés

> Le user doit se dire : "Sans le premium, mon squad est moins fiable."

---

## 🎨 UX & DESIGN (PRINCIPES)

- Mobile-first, mais parfaitement utilisable sur desktop
- Pas de feed inutile
- Pas de surcharge visuelle
- Lisibilité > effets
- Animations utiles, jamais décoratives
- Chaque écran doit répondre à une question claire : **"Qu'est-ce qu'on fait maintenant ?"**

### L'IA doit être :

- intégrée dans les blocs existants
- jamais en plein écran
- jamais envahissante

### Thème : Linear Dark

| Token         | Valeur           |
| ------------- | ---------------- |
| bg-base       | #08090a          |
| bg-elevated   | #101012          |
| text-primary  | #f7f8f8          |
| color-primary | #5e6dd2 (Violet) |
| color-success | #4ade80 (Vert)   |
| color-warning | #f5a623 (Orange) |

---

## 🧱 ARCHITECTURE TECH

| Couche   | Technologie                           |
| -------- | ------------------------------------- |
| Frontend | React + Vite (Web + Mobile ready)     |
| Styling  | TailwindCSS + Framer Motion           |
| Backend  | Supabase (PostgreSQL, Auth, Realtime) |
| Vocal    | Agora SDK (prévu)                     |
| IA       | Supabase Edge Functions + LLM API     |

---

## 📁 Structure Projet

```
Squadplannerlast/
├── .agent/workflows/     # Workflows automatisés
├── skills/               # Skills spécialisés (12 skills)
├── src/
│   ├── App.tsx           # Routes et auth init
│   ├── components/
│   │   ├── layout/       # AppLayout (sidebar + bottom bar)
│   │   └── ui/           # Button, Card, Input, Badge
│   ├── hooks/            # useAuth, useSquads, useSessions
│   ├── lib/              # supabase, theme
│   ├── pages/            # Toutes les pages
│   └── types/            # database.ts
├── supabase/migrations/  # Migrations database
└── docs/                 # Documentation technique
```

---

## 🧨 OBJECTIF FINAL

Squad Planner doit devenir :

- le Calendly du gaming
- le standard de planification sur Discord
- une référence mondiale de coordination sociale gaming

**Tu ne construis pas une app. Tu construis une machine à transformer des intentions molles en habitudes concrètes.**

---

## 📋 État Actuel - Phase 7 Complétée

### ✅ Fait

- [x] Projet Vite React TypeScript initialisé
- [x] Design System Linear Dark implémenté
- [x] Auth (signUp/signIn/signOut) avec Zustand
- [x] Squads CRUD (créer, rejoindre par code, quitter, supprimer)
- [x] Sessions (créer, RSVP, check-in)
- [x] Navigation responsive (sidebar + bottom bar)
- [x] Landing page avec proposition de valeur
- [x] User guidance sur chaque page
- [x] Build réussi

### 📄 Pages implémentées

- **Landing** : Value proposition, features, how it works
- **Home** : Dashboard avec stats et squads récentes
- **Auth** : Login/Register avec validation
- **Squads** : Liste, création, join par code
- **SquadDetail** : Membres, sessions, actions owner
- **SessionDetail** : RSVP, check-in, participants
- **Sessions** : Liste avec AI suggestion
- **Profile** : Score fiabilité, stats, premium upsell
- **Messages** : Coming soon avec preview

### 🔜 Prochaines étapes

- [ ] Chat & Messages (realtime)
- [ ] IA #1 - Planification intelligente
- [ ] IA #2 - Anti "on verra"
- [ ] IA #3 - Score fiabilité
- [ ] Vocal Agora
- [ ] Monétisation Premium

---

## 📚 Skills Disponibles

Consulter `skills/` pour les 12 skills :

- `supabase-expert` - Backend Supabase/RLS
- `react-expert` - Composants React
- `front-end-design` - Design System Linear Dark
- `typescript-pro` - Typage strict
- `api-designer` - Architecture API
- `postgres-pro` - Optimisation DB
- `debugging-wizard` - Debug méthodique
- `devops-engineer` - CI/CD & Deploy
- `playwright-expert` - Tests E2E
- `code-reviewer` - Revue qualité
- `security-reviewer` - Audit sécurité
- `test-master` - Stratégie de test

---

## 🚀 Commandes

```bash
# Dev server
npm run dev

# Build
npm run build

# Lancer sur http://localhost:5175/
```
