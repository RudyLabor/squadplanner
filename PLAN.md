# Plan d'implémentation — Phase 4

## Phase 4 : Surpasser WhatsApp

### 4.1 — DM Niveau WhatsApp

#### 4.1.1 Messages vocaux dans les DMs
- **Fichiers** : `src/pages/Messages.tsx` (section DM input)
- Le composant `VoiceRecorder.tsx` existe déjà pour le chat squad
- Intégrer le même composant dans la zone de saisie DM
- Les messages vocaux seront stockés comme contenu base64 avec préfixe `[voice:]` dans `direct_messages.content`
- Affichage : waveform + bouton play dans les DM (réutiliser le rendu existant de MessageContent)

#### 4.1.2 Sondages (Polls) dans le chat squad
- **Nouveaux fichiers** : `src/components/ChatPoll.tsx`, `src/components/CreatePollModal.tsx`
- Les sondages sont des messages spéciaux avec `content` au format JSON : `{"type":"poll","question":"...","options":[...],"votes":{}}`
- UI : question + options avec barres de progression + bouton voter
- Création via bouton dans la barre d'outils du chat (à côté de GIF, emoji, etc.)
- Votes stockés en temps réel via update du message

#### 4.1.3 Transfert de messages (Forward)
- **Nouveaux fichiers** : `src/components/ForwardMessageModal.tsx`
- Ajouter action "Transférer" dans le menu contextuel des messages (ContextMenu existant)
- Modal : sélection de la squad cible → envoie le message avec préfixe `[forwarded]`
- Fonctionne pour messages squad et DMs

#### 4.1.4 Partage de localisation
- **Nouveaux fichiers** : `src/components/LocationShare.tsx`
- Bouton "📍 Je suis là" dans la barre d'outils DM
- Utilise `navigator.geolocation.getCurrentPosition()`
- Stocke comme message avec contenu `[location:lat,lng]`
- Affichage : lien cliquable vers Google Maps + mini-carte statique

### 4.2 — Statut & Présence

#### 4.2.1 Système de présence globale
- **Nouveaux fichiers** : `src/hooks/useGlobalPresence.ts`
- Canal Supabase Presence global (pas lié à une squad)
- Chaque utilisateur connecté broadcast : `{ userId, status, gameStatus, customStatus, customEmoji }`
- Auto-update `last_seen_at` dans le profil toutes les 60s via `updateProfile`
- Cleanup automatique à la déconnexion

#### 4.2.2 Disponibilité (4 états)
- **Modifier** : `src/hooks/useGlobalPresence.ts` + `src/components/StatusSelector.tsx` (nouveau)
- États : `online` | `busy` | `dnd` | `invisible`
- Sélecteur dans le header/sidebar (dropdown sur l'avatar)
- Couleurs : vert / orange / rouge / gris
- Persisté en localStorage + broadcast via Presence
- `invisible` = ne pas apparaître dans les listes online mais rester connecté

#### 4.2.3 Statut personnalisé (emoji + texte + durée)
- **Nouveaux fichiers** : `src/components/CustomStatusModal.tsx`
- Modal : choix emoji + texte libre (max 80 chars) + durée (1h, 4h, aujourd'hui, ne pas effacer)
- Stocké en localStorage + broadcast via Presence
- Auto-clear via setTimeout basé sur la durée
- Affiché sous le username dans les listes de membres et profils

#### 4.2.4 Game Status
- **Modifier** : `CustomStatusModal.tsx` ajout d'un champ "Jeu en cours"
- Saisie manuelle : "Valorant", "League of Legends", etc.
- Autocomplete basé sur les jeux des squads de l'utilisateur
- Affiché comme badge sous l'avatar : "🎮 Joue à Valorant"

#### 4.2.5 "Dernière connexion"
- **Nouveaux fichiers** : `src/utils/formatLastSeen.ts`
- Formats : "En ligne", "Il y a 5 min", "Il y a 2h", "Hier", "Il y a 3 jours"
- Affiché dans : liste de conversations DM, profil utilisateur, membres squad
- Basé sur `last_seen_at` du profil (mis à jour par la présence)

#### 4.2.6 Indicateur d'activité live sur l'avatar
- **Modifier** : `src/components/ui/AnimatedAvatar.tsx`
- États additionnels : `in-party` (🎙️), `in-session` (📅), `in-call` (📞)
- Info venant de Presence : `{ activity: 'party' | 'session' | 'call' | null }`
- Ring animé violet pour party, bleu pour session, vert pour call

---

## Ordre d'implémentation

1. **4.2.1 + 4.2.2** — Présence globale + Disponibilité (fondation pour tout le reste)
2. **4.2.5** — Dernière connexion (rapide, utile partout)
3. **4.2.3 + 4.2.4** — Statut personnalisé + Game Status
4. **4.2.6** — Indicateurs live sur avatar
5. **4.1.1** — Messages vocaux DMs
6. **4.1.2** — Sondages chat
7. **4.1.3** — Forward messages
8. **4.1.4** — Localisation

## Fichiers à créer (~9)

| Fichier | Description |
|---------|-------------|
| `src/hooks/useGlobalPresence.ts` | Présence globale Supabase |
| `src/hooks/useUserStatus.ts` | Store Zustand status/availability |
| `src/components/StatusSelector.tsx` | Dropdown disponibilité |
| `src/components/CustomStatusModal.tsx` | Modal statut personnalisé |
| `src/components/ChatPoll.tsx` | Affichage + vote sondage |
| `src/components/CreatePollModal.tsx` | Création sondage |
| `src/components/ForwardMessageModal.tsx` | Forward message |
| `src/components/LocationShare.tsx` | Partage localisation |
| `src/utils/formatLastSeen.ts` | Formatage "il y a X" |

## Fichiers à modifier (~6)

| Fichier | Modification |
|---------|-------------|
| `src/hooks/index.ts` | Exports des nouveaux hooks |
| `src/pages/Messages.tsx` | Voice recorder dans DMs + forwarding + polls |
| `src/components/ui/AnimatedAvatar.tsx` | Activity indicators |
| `src/components/layout/AppLayout.tsx` | StatusSelector dans sidebar |
| `src/components/MessageContent.tsx` | Rendu polls, location, forwarded, voice dans DMs |
| `src/types/database.ts` | Types étendus pour status |
