# PLAN WORLD-CLASS 10/10
## Objectif : Dépasser Discord, Slack, WhatsApp & PlayStation App

**Date de création** : 6 Février 2026
**Score actuel** : 6.9/10
**Score cible** : 10/10
**Deadline** : 2 semaines

---

## PHILOSOPHIE

### Ce qui fait un 10/10
1. **Zéro friction** - Chaque action en 1 clic maximum
2. **Feedback émotionnel** - Chaque action récompensée visuellement
3. **Anticipation** - L'app sait ce que tu veux avant que tu le demandes
4. **Polish extrême** - Micro-interactions partout, 0 bug visible
5. **Gamification native** - Chaque interaction donne envie de revenir

### Benchmark Concurrents

| App | Force Principale | À Voler |
|-----|------------------|---------|
| **Discord** | Voice + Chat fusionnés | Threads, Status, Slash commands |
| **Slack** | Productivité | Shortcuts, Bookmarks, Workflows |
| **WhatsApp** | Simplicité absolue | Starred messages, Disappearing |
| **PlayStation App** | Gaming-first UX | Party links, "Friends playing", 3D audio |

---

## PHASES D'IMPLÉMENTATION

---

# PHASE 1 : CORE FIXES (P0)
## Deadline : 3 jours
## Impact : 6.9 → 8.5/10

### 1.1 RSVP Inline sur Home
**Fichier** : `src/pages/Home.tsx` + `src/components/NextSessionCard.tsx`

**Problème** : RSVP demande 2-3 clics
**Solution** : Boutons RSVP directement sur la card

```tsx
// NextSessionCard.tsx - Ajouter
<div className="flex gap-2 mt-3">
  <Button
    onClick={() => handleRsvp('present')}
    className="flex-1 bg-green-500/20 hover:bg-green-500/40 border-green-500/50"
  >
    <Check className="w-4 h-4 mr-1" /> Présent
  </Button>
  <Button
    onClick={() => handleRsvp('maybe')}
    className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/40 border-yellow-500/50"
  >
    <HelpCircle className="w-4 h-4 mr-1" /> Peut-être
  </Button>
  <Button
    onClick={() => handleRsvp('absent')}
    className="flex-1 bg-red-500/20 hover:bg-red-500/40 border-red-500/50"
  >
    <X className="w-4 h-4 mr-1" /> Absent
  </Button>
</div>
```

**Célébration** : Confetti + toast au RSVP "Présent"
**Temps estimé** : 1h

---

### 1.2 Célébration Achievements
**Fichier** : `src/pages/Profile.tsx` + `src/hooks/useAchievements.ts`

**Problème** : Aucun feedback au unlock
**Solution** :
1. Confetti explosion
2. Toast émotionnel avec nom de l'achievement
3. Animation scale + rotate sur le badge
4. Sound effect (optionnel)

```tsx
// Quand achievement unlock
const celebrateAchievement = (achievement: Achievement) => {
  confetti({
    particleCount: 200,
    spread: 120,
    origin: { y: 0.6 },
    colors: ['#4ade80', '#22d3ee', '#a855f7']
  })

  toast.success(`🏆 Achievement Unlocked: ${achievement.name}!`, {
    duration: 5000,
    icon: '⭐',
    style: {
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      border: '1px solid #4ade80',
      color: '#fff'
    }
  })
}
```

**Temps estimé** : 45min

---

### 1.3 Page Settings Complète
**Fichier** : `src/pages/Settings.tsx` (NOUVEAU)

**Sections requises** :
1. **Profil** - Avatar, username, bio
2. **Notifications** - Toggle par type (sessions, messages, party)
3. **Audio** - Input/output device selection
4. **Apparence** - Theme (dark only pour gaming)
5. **Confidentialité** - Qui peut voir mon profil
6. **Timezone** - Override manuel
7. **Langue** - FR/EN
8. **Données** - Export, supprimer compte

**UI Pattern** : Sections collapsibles avec toggles

**Temps estimé** : 2h

---

### 1.4 Page Premium Complète
**Fichier** : `src/pages/Premium.tsx`

**Structure** :
```
┌─────────────────────────────────────────────────┐
│  🎮 PASSE AU NIVEAU SUPÉRIEUR                   │
│                                                 │
│  ┌─────────────┐      ┌─────────────┐          │
│  │   GRATUIT   │      │  PREMIUM ⭐  │          │
│  │             │      │              │          │
│  │ 3 squads    │      │ ∞ squads     │          │
│  │ 5 membres   │      │ 15 membres   │          │
│  │ Stats basic │      │ Stats AI     │          │
│  │ 720p audio  │      │ HD audio     │          │
│  │             │      │              │          │
│  │   ACTUEL    │      │ 4.99€/mois   │          │
│  └─────────────┘      └─────────────┘          │
│                                                 │
│  ✓ 30 jours satisfait ou remboursé             │
│  ✓ Annule quand tu veux                        │
└─────────────────────────────────────────────────┘
```

**Temps estimé** : 1.5h

---

### 1.5 Progress Bar Tier Profile
**Fichier** : `src/pages/Profile.tsx`

**Problème** : User ne sait pas combien de check-ins pour rank up
**Solution** : Barre de progression animée

```tsx
<div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
  <motion.div
    className="absolute h-full bg-gradient-to-r from-green-500 to-emerald-400"
    initial={{ width: 0 }}
    animate={{ width: `${(currentCheckIns / nextTierThreshold) * 100}%` }}
    transition={{ duration: 1, ease: "easeOut" }}
  />
</div>
<p className="text-xs text-white/60 mt-1">
  {nextTierThreshold - currentCheckIns} check-ins pour devenir {nextTierName}
</p>
```

**Temps estimé** : 30min

---

# PHASE 2 : NAVIGATION & CLARITY
## Deadline : 2 jours
## Impact : 8.5 → 9.0/10

### 2.1 Breadcrumbs Desktop
**Fichier** : `src/components/layout/Breadcrumbs.tsx` (NOUVEAU)

```tsx
// Home > Squads > Ma Squad > Session du 15 Fév
<nav className="flex items-center gap-2 text-sm text-white/60 mb-4">
  <Link to="/home" className="hover:text-white">Home</Link>
  <ChevronRight className="w-4 h-4" />
  <Link to="/squads" className="hover:text-white">Squads</Link>
  <ChevronRight className="w-4 h-4" />
  <span className="text-white">{squadName}</span>
</nav>
```

**Temps estimé** : 45min

---

### 2.2 Sidebar Collapsible Desktop
**Fichier** : `src/components/layout/AppLayout.tsx`

**Comportement** :
- Défaut : Collapsed (icons only, 64px)
- Hover : Expand avec labels
- Click pin : Stay expanded

```tsx
const [sidebarExpanded, setSidebarExpanded] = useState(false)
const [sidebarPinned, setSidebarPinned] = useState(false)

<aside
  className={cn(
    "transition-all duration-300",
    sidebarExpanded || sidebarPinned ? "w-64" : "w-16"
  )}
  onMouseEnter={() => setSidebarExpanded(true)}
  onMouseLeave={() => !sidebarPinned && setSidebarExpanded(false)}
>
```

**Temps estimé** : 1h

---

### 2.3 Command Palette (Cmd+K)
**Fichier** : `src/components/CommandPalette.tsx` (NOUVEAU)

**Actions disponibles** :
- Rechercher squad
- Rechercher session
- Aller à page
- Créer session rapide
- Inviter ami

**Pattern** : Modal avec fuzzy search (comme Raycast/Spotlight)

**Temps estimé** : 2h

---

### 2.4 Recherche Globale
**Fichier** : `src/components/GlobalSearch.tsx` (NOUVEAU)

**Recherche dans** :
- Noms de squads
- Sessions (par titre, date)
- Messages (contenu)
- Membres (par username)

**UI** : Input dans header avec dropdown résultats

**Temps estimé** : 1.5h

---

### 2.5 Page Help/FAQ
**Fichier** : `src/pages/Help.tsx` (NOUVEAU)

**Sections** :
1. Getting Started (vidéo 2min)
2. Créer une squad
3. Planifier une session
4. Utiliser Party Vocale
5. Comprendre le Reliability Score
6. Contacter le support

**Pattern** : Accordion avec recherche

**Temps estimé** : 1h

---

# PHASE 3 : MESSAGING WORLD-CLASS
## Deadline : 3 jours
## Impact : 9.0 → 9.4/10

### 3.1 Emoji Reactions
**Fichier** : `src/pages/Messages.tsx` + `src/components/MessageBubble.tsx`

**Reactions disponibles** : 👍 ❤️ 😂 😮 😢 🔥

**UI** :
- Long press sur mobile → reaction picker
- Hover sur desktop → reaction bar

**Database** : Ajouter colonne `reactions` JSONB

```sql
ALTER TABLE messages ADD COLUMN reactions JSONB DEFAULT '[]';
-- Format: [{ emoji: "👍", user_ids: ["uuid1", "uuid2"] }]
```

**Temps estimé** : 2h

---

### 3.2 Pin Messages
**Fichier** : `src/pages/Messages.tsx`

**Comportement** :
- Right-click/long-press → "Pin message"
- Pinned messages section en haut du chat
- Max 5 pinned par conversation

**Database** :
```sql
ALTER TABLE messages ADD COLUMN pinned_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN pinned_by UUID;
```

**Temps estimé** : 1.5h

---

### 3.3 Reply/Quote Message
**Fichier** : `src/components/MessageBubble.tsx`

**UI** :
- Swipe right sur mobile → reply mode
- Click reply icon sur desktop
- Message original affiché en preview au-dessus

**Database** :
```sql
ALTER TABLE messages ADD COLUMN reply_to_id UUID REFERENCES messages(id);
```

**Temps estimé** : 1.5h

---

### 3.4 Edit & Delete Messages
**Fichier** : `src/components/MessageBubble.tsx`

**Comportement** :
- Edit : Propres messages seulement, shows "(modifié)"
- Delete : Propres messages, shows "Message supprimé"

**Database** :
```sql
ALTER TABLE messages ADD COLUMN edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMPTZ;
```

**Temps estimé** : 1h

---

### 3.5 Typing Indicator Amélioré
**Fichier** : `src/components/TypingIndicator.tsx`

**Actuel** : Texte "X is typing..."
**Nouveau** : Animation 3 dots pulsing + avatar

```tsx
<div className="flex items-center gap-2">
  <Avatar src={user.avatar} className="w-6 h-6" />
  <div className="flex gap-1">
    <motion.div
      className="w-2 h-2 bg-white/60 rounded-full"
      animate={{ y: [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: 0.6 }}
    />
    <motion.div
      className="w-2 h-2 bg-white/60 rounded-full"
      animate={{ y: [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
    />
    <motion.div
      className="w-2 h-2 bg-white/60 rounded-full"
      animate={{ y: [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
    />
  </div>
</div>
```

**Temps estimé** : 30min

---

# PHASE 4 : PARTY VOCALE NEXT-LEVEL
## Deadline : 2 jours
## Impact : 9.4 → 9.6/10

### 4.1 Shareable Party Links (comme PlayStation)
**Fichier** : `src/pages/Party.tsx` + `src/pages/SquadDetail.tsx`

**Problème** : Code 6 caractères à taper
**Solution** : Lien cliquable `squadplanner.fr/join/ABC123`

```tsx
const partyLink = `${window.location.origin}/join/${squadCode}`

<Button onClick={() => {
  navigator.clipboard.writeText(partyLink)
  toast.success("Lien copié ! Envoie-le à tes potes")
}}>
  <Link2 className="w-4 h-4 mr-2" />
  Copier le lien d'invitation
</Button>
```

**Route** : `/join/:code` → Auto-join squad + redirect to party

**Temps estimé** : 1h

---

### 4.2 "Friends Playing" Section (comme PlayStation)
**Fichier** : `src/pages/Home.tsx`

**Nouvelle section** :
```
┌─────────────────────────────────────────┐
│ 🎮 Tes potes jouent maintenant          │
│                                         │
│ [Avatar] Alex → Valorant (Party: 3/5)   │
│          [Rejoindre]                    │
│                                         │
│ [Avatar] Marie → Fortnite (Solo)        │
│          [Inviter]                      │
└─────────────────────────────────────────┘
```

**Database** : Ajouter `current_game` et `last_seen_at` à profiles

**Temps estimé** : 2h

---

### 4.3 Volume Control Per Participant
**Fichier** : `src/components/PartyParticipant.tsx`

**UI** : Slider individuel pour chaque participant

```tsx
<Slider
  value={participantVolume[participantId]}
  onValueChange={(v) => setParticipantVolume(participantId, v)}
  max={200}
  step={1}
  className="w-24"
/>
```

**Temps estimé** : 1h

---

### 4.4 Push-to-Talk Mode
**Fichier** : `src/pages/Party.tsx` + `src/pages/Settings.tsx`

**Comportement** :
- Spacebar held = mic active
- Release = mute
- Toggle in settings

```tsx
useEffect(() => {
  if (!pushToTalkEnabled) return

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !e.repeat) setMicActive(true)
  }
  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') setMicActive(false)
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  return () => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  }
}, [pushToTalkEnabled])
```

**Temps estimé** : 45min

---

### 4.5 Voice Waveform Visualizer
**Fichier** : `src/components/VoiceWaveform.tsx` (NOUVEAU)

**Actuel** : Pulse animation simple
**Nouveau** : Waveform réelle basée sur audio input

```tsx
// Utiliser Web Audio API
const analyser = audioContext.createAnalyser()
analyser.fftSize = 32
const dataArray = new Uint8Array(analyser.frequencyBinCount)

// Render bars
{Array.from({ length: 5 }).map((_, i) => (
  <motion.div
    key={i}
    className="w-1 bg-green-400 rounded-full"
    animate={{ height: `${dataArray[i] / 255 * 24}px` }}
  />
))}
```

**Temps estimé** : 1.5h

---

# PHASE 5 : GAMIFICATION HARDCORE
## Deadline : 2 jours
## Impact : 9.6 → 9.8/10

### 5.1 XP System Visible
**Fichier** : `src/pages/Profile.tsx` + `src/components/XPBar.tsx`

**Actions qui donnent XP** :
- RSVP "Présent" : +10 XP
- Check-in confirmé : +25 XP
- Créer session : +15 XP
- Premier du mois à RSVP : +50 XP
- 7 jours streak : +100 XP

**UI** : Barre XP avec level up animation

**Temps estimé** : 2h

---

### 5.2 Daily/Weekly Challenges
**Fichier** : `src/components/Challenges.tsx` (NOUVEAU)

**Exemples** :
- "RSVP à 3 sessions aujourd'hui" → +50 XP
- "Fais 5 check-ins cette semaine" → Badge exclusif
- "Invite un ami" → +100 XP

**UI** : Section sur Home avec progress bars

**Temps estimé** : 2h

---

### 5.3 Leaderboard Squad
**Fichier** : `src/pages/SquadDetail.tsx`

**Classement par** :
- Reliability score
- XP gagné ce mois
- Sessions participées

**UI** : Podium avec 1er/2ème/3ème + animation

**Temps estimé** : 1.5h

---

### 5.4 Seasonal Badges
**Fichier** : `src/components/SeasonalBadges.tsx`

**Concept** : Badges qui reset chaque mois
- "MVP Janvier 2026"
- "Most Reliable February"
- "Party Animal Winter 2026"

**Temps estimé** : 1h

---

### 5.5 Streak Counter
**Fichier** : `src/pages/Home.tsx` + `src/pages/Profile.tsx`

**Affichage** :
```
🔥 7 jours de suite !
   Prochain milestone : 14 jours
```

**Célébration** :
- 7 jours : Toast + confetti
- 30 jours : Badge spécial
- 100 jours : Achievement légendaire

**Temps estimé** : 1h

---

# PHASE 6 : POLISH FINAL
## Deadline : 2 jours
## Impact : 9.8 → 10/10

### 6.1 Page Transitions Fluides
**Fichier** : `src/App.tsx`

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
  >
    <Routes>...</Routes>
  </motion.div>
</AnimatePresence>
```

**Temps estimé** : 30min

---

### 6.2 Skeleton Loaders Partout
**Fichiers** : Toutes les pages

**Pattern standardisé** :
```tsx
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
    <div className="h-4 bg-white/10 rounded w-1/2" />
  </div>
)
```

**Temps estimé** : 1h

---

### 6.3 Error States Élégants
**Fichier** : `src/components/ErrorState.tsx` (NOUVEAU)

**Types** :
- Network error : "Connexion perdue. Reconnexion..."
- Not found : "Oups, cette page n'existe pas"
- Permission : "T'as pas accès à ça, désolé"

**UI** : Illustration + CTA retry

**Temps estimé** : 1h

---

### 6.4 Empty States Animés
**Fichier** : `src/components/EmptyState.tsx`

**Animations** :
- Icône qui bounce légèrement
- Text fade-in séquentiel
- CTA avec glow pulse

**Temps estimé** : 45min

---

### 6.5 Sound Effects (Optionnel)
**Fichiers** : Composants clés

**Sons** :
- RSVP confirmé : Petit "ding" satisfaisant
- Achievement unlock : Fanfare courte
- Message reçu : Notification subtile
- Party join : "Connected" voice

**Volume** : Contrôlable dans Settings

**Temps estimé** : 1h

---

### 6.6 Haptic Feedback Mobile
**Fichier** : `src/utils/haptics.ts`

```tsx
export const haptic = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(25),
  heavy: () => navigator.vibrate?.(50),
  success: () => navigator.vibrate?.([10, 50, 10]),
  error: () => navigator.vibrate?.([50, 100, 50])
}
```

**Utilisation** : Boutons importants, toggle switches

**Temps estimé** : 30min

---

### 6.7 Glow Effects Systématiques
**Fichier** : `src/index.css`

**Classes utilitaires** :
```css
.glow-green { box-shadow: 0 0 20px rgba(74, 222, 128, 0.3); }
.glow-blue { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
.glow-purple { box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); }
.glow-hover:hover { box-shadow: 0 0 30px rgba(74, 222, 128, 0.5); }
```

**Temps estimé** : 20min

---

### 6.8 Micro-interactions Finales
**Fichiers** : Tous les boutons/cards

**Checklist** :
- [ ] Hover scale 1.02 sur cards
- [ ] Active scale 0.98 sur boutons
- [ ] Focus ring visible (accessibility)
- [ ] Transition 150ms sur tout
- [ ] Icons animate on state change

**Temps estimé** : 1h

---

# RÉCAPITULATIF

## Timeline

| Phase | Durée | Score |
|-------|-------|-------|
| Phase 1 : Core Fixes | 3 jours | 6.9 → 8.5 |
| Phase 2 : Navigation | 2 jours | 8.5 → 9.0 |
| Phase 3 : Messaging | 3 jours | 9.0 → 9.4 |
| Phase 4 : Party | 2 jours | 9.4 → 9.6 |
| Phase 5 : Gamification | 2 jours | 9.6 → 9.8 |
| Phase 6 : Polish | 2 jours | 9.8 → 10.0 |
| **TOTAL** | **14 jours** | **10/10** |

## Fichiers à Créer
1. `src/pages/Settings.tsx`
2. `src/pages/Help.tsx`
3. `src/components/layout/Breadcrumbs.tsx`
4. `src/components/CommandPalette.tsx`
5. `src/components/GlobalSearch.tsx`
6. `src/components/VoiceWaveform.tsx`
7. `src/components/Challenges.tsx`
8. `src/components/SeasonalBadges.tsx`
9. `src/components/ErrorState.tsx`
10. `src/utils/haptics.ts`

## Migrations Database

### ✅ Phase 3 - Messaging (CRÉÉE)
**Fichier** : `supabase/migrations/20260206000001_phase3_messaging.sql`

```sql
-- Nouveaux champs messages & direct_messages
ALTER TABLE messages ADD COLUMN reply_to_id UUID REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN edited_at TIMESTAMPTZ;
ALTER TABLE direct_messages ADD COLUMN reply_to_id UUID REFERENCES direct_messages(id);
ALTER TABLE direct_messages ADD COLUMN edited_at TIMESTAMPTZ;

-- Table reactions (avec RLS)
CREATE TABLE message_reactions (message_id, user_id, emoji, UNIQUE);
CREATE TABLE dm_reactions (message_id, user_id, emoji, UNIQUE);

-- Table messages épinglés (max 25 par squad, trigger)
CREATE TABLE pinned_messages (message_id, squad_id, pinned_by);

-- Fonctions helper
get_message_reactions(msg_id) → emoji, count, users, user_reacted
get_pinned_messages(squad_id) → pin details with sender info

-- Realtime activé pour toutes les tables
```

### ⏳ Phase 4 - Party (À CRÉER)
```sql
ALTER TABLE profiles ADD COLUMN current_game TEXT;
ALTER TABLE profiles ADD COLUMN last_seen_at TIMESTAMPTZ;
```

### ⏳ Phase 5 - Gamification (À CRÉER)
```sql
ALTER TABLE profiles ADD COLUMN xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN streak_days INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN streak_last_date DATE;

CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 0,
  type TEXT CHECK (type IN ('daily', 'weekly', 'seasonal')),
  requirements JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_challenges (
  user_id UUID REFERENCES profiles(id),
  challenge_id UUID REFERENCES challenges(id),
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, challenge_id)
);
```

## Métriques de Succès

| Métrique | Avant | Après | Objectif |
|----------|-------|-------|----------|
| RSVP rate | ~40% | ~80% | 85%+ |
| Daily active users | - | - | +50% |
| Session completion | ~60% | ~90% | 95%+ |
| Party usage | ~20% | ~60% | 70%+ |
| Premium conversion | ~2% | ~8% | 10%+ |

---

## COMMANDES D'EXÉCUTION

Pour lancer chaque phase :
```
Phase 1 : claude "Implémente Phase 1 du PLAN_WORLD_CLASS.md"
Phase 2 : claude "Implémente Phase 2 du PLAN_WORLD_CLASS.md"
...
```

---

**Ce plan te rendra MEILLEUR que Discord, Slack, WhatsApp et PlayStation App combinés pour le use case gaming squad coordination.**

🎯 **LET'S GO !**
