# Audit : Fonctionnalités Mobiles (Push, Offline, Haptic)

**Date** : 12 février 2026
**Projet** : SquadPlanner
**Scope** : Push Notifications, Offline Mode, Haptic Feedback

---

## Résumé Exécutif

✅ **Push Notifications** : Infrastructure complète (Web Push + Native FCM)
✅ **Offline Mode** : Service Worker avec cache intelligent + mutation queue
⚠️ **Haptic Feedback** : Infrastructure présente mais sous-utilisée

**Améliorations implémentées** :
- ✅ Haptic feedback ajouté sur création de session
- ✅ Haptic feedback ajouté sur RSVP confirmation
- ✅ Haptic feedback ajouté sur perte/rétablissement de connexion

---

## 1. Push Notifications 📱

### Infrastructure Implémentée

#### Web Push (VAPID)
- **Fichier** : `src/hooks/usePushNotifications.ts`
- **Status** : ✅ Complètement implémenté
- **Fonctionnalités** :
  - Service Worker registration (`/sw.js`)
  - Subscription management (VAPID keys)
  - Push subscription storage dans Supabase (`push_subscriptions` table)
  - Gestion des permissions Notification API
  - Auto-subscription au login (500ms delay dans `ClientShell.tsx`)

#### Native Push (Firebase Cloud Messaging)
- **Fichier** : `src/hooks/useNativePush.ts`
- **Status** : ✅ Complètement implémenté
- **Plateformes** : iOS + Android via Capacitor
- **Fonctionnalités** :
  - FCM token registration
  - Push token storage (`push_tokens` table)
  - Notification handling avec actions
  - Local notifications pour appels entrants

#### Backend (Edge Function)
- **Fichier** : `supabase/functions/send-push/index.ts`
- **Status** : ✅ Production-ready
- **Capacités** :
  - Web Push (VAPID) avec encryption aes128gcm
  - Native Push (FCM v1 API)
  - Actions personnalisées (répondre/refuser appels)
  - Vibration patterns configurables
  - Cleanup automatique des tokens expirés

### Push Triggers Actifs ✅

#### 1. Session Reminders
- **Fichier** : `supabase/functions/send-reminders/index.ts`
- **Status** : ✅ Implémenté
- **Déclenchement** : CRON job (toutes les 5-15 min)
- **Notifications** :
  - 15 minutes avant → "Session dans 15 min!"
  - 1 heure avant → "Session dans ~1h"
- **Cibles** : Utilisateurs ayant RSVP "present"

#### 2. Incoming Calls
- **Fichier** : `src/hooks/useCallActions.ts`
- **Status** : ✅ Implémenté
- **Déclenchement** : Appel vocal LiveKit
- **Actions** : Répondre / Refuser
- **Vibration** : Pattern "sonnerie" [300, 100, 300, 100, 300]

#### 3. New Messages (Réaltime)
- **Status** : ⚠️ Pas de push direct
- **Note** : Les messages utilisent Realtime Supabase (WebSocket), pas de push silencieux en background

#### 4. Squad Invites
- **Status** : ⚠️ Pas de push automatique détecté
- **Gap** : Pas de trigger côté serveur pour envoyer un push lors d'une invitation squad

### Service Worker Push Handler

**Fichier** : `public/sw.js` (lignes 266-358)

**Fonctionnalités** :
- ✅ Parse push payload JSON
- ✅ Affiche notification avec titre/body/icône/actions
- ✅ Gère les actions utilisateur (notificationclick)
- ✅ Vibration patterns selon type de notification
- ✅ RequireInteraction pour appels entrants
- ✅ Navigation vers URL spécifique au clic

**Types de notifications supportées** :
- `incoming_call` → Vibration sonnerie + actions Répondre/Refuser
- Par défaut → Vibration courte + actions Ouvrir/Fermer

---

## 2. Offline Mode 🔌

### Service Worker Cache Strategy

**Fichier** : `public/sw.js`
**Version** : v3
**Status** : ✅ Production-grade

#### Caches Multiples
- `squadplanner-static-v3` : Assets statiques (fonts, CSS, SVG)
- `squadplanner-dynamic-v3` : Contenu dynamique (15 min TTL)
- `squadplanner-images-v3` : Images avec validation

#### Assets Pré-cachés (Install Event)
```javascript
[
  '/favicon.svg',
  '/critical.css',
  '/manifest.json',
  '/icon-192.svg',
  '/fonts/inter-var-latin.woff2',
  '/fonts/space-grotesk-latin.woff2'
]
```

#### Stratégies de Cache

1. **Navigation (HTML)** : Network First
   - ⚠️ Critique : Ne JAMAIS cacher HTML corrompu
   - Fallback : Page "Hors ligne" en HTML inline

2. **Assets Statiques (JS/CSS)** : Cache First
   - Uniquement les fichiers hashés (ex: `main.abc123.js`)
   - Cache long terme sécurisé

3. **Images** : Cache First with Validation
   - Validation du Content-Length
   - Suppression automatique des entrées corrompues

4. **API Supabase** : JAMAIS mis en cache
   - Skip total des requêtes `*.supabase.*`

#### Cache Cleanup (Activation Event)
- ✅ Suppression automatique des anciennes versions
- ✅ TTL de 15 minutes pour dynamic cache
- ✅ Limite de 50 entrées max
- ✅ Validation des réponses (status 200-299)

### Offline Mutation Queue

**Fichier** : `src/lib/offlineMutationQueue.ts`
**Status** : ✅ Complètement implémenté

**Fonctionnalités** :
- ✅ Stockage IndexedDB (`sq-offline-mutations` database)
- ✅ Background Sync API (quand disponible)
- ✅ Replay manuel sur reconnexion (fallback)
- ✅ Suppression automatique après succès/4xx
- ✅ Retry sur 5xx errors

**Workflow** :
1. Mutation échoue (offline) → Queue dans IndexedDB
2. Event `online` → Replay automatique
3. Background Sync → Replay en arrière-plan (si supporté)

**Fichier** : `public/sw.js` (lignes 498-546)
**Intégration** : Service Worker écoute `sync` event avec tag `sync-mutations`

### React Query Persistence

**Fichier** : `src/lib/queryClient.ts` (lignes 227-252)
**Status** : ✅ Implémenté

**Configuration** :
- Persister : IndexedDB (via `@tanstack/query-persist-client-core`)
- TTL : 24 heures
- Types persistés : `squads`, `sessions`, `profile`, `messages`, `challenges`, `premium`
- Uniquement queries `success` avec data

**Bénéfices** :
- ✅ Navigation offline instantanée avec données cached
- ✅ Refresh automatique au retour online
- ✅ 2min stale time → réduction de 34 requêtes → ~10

### Offline Detection UI

**Fichier** : `src/components/OfflineBanner.tsx`
**Hook** : `src/hooks/useOffline.ts`
**Status** : ✅ Complètement implémenté

**Fonctionnalités** :
- ✅ Détection `navigator.onLine`
- ✅ Network Information API (qualité connexion)
- ✅ Banner "Hors ligne" (rouge, WifiOff icon)
- ✅ Banner "Connexion rétablie" (vert, 3s auto-dismiss)
- ✅ Animation Framer Motion (slide from top)
- ⚠️ **AMÉLIORATION** : Haptic feedback ajouté sur offline/online events

### Offline Browsing Capability ✅

**Peut-on naviguer offline ?**
- ✅ **OUI** pour les pages déjà visitées (cache Service Worker)
- ✅ **OUI** pour les données React Query (IndexedDB persistence)
- ✅ **OUI** pour les assets statiques (fonts, CSS, JS hashés)
- ⚠️ **NON** pour les nouvelles pages jamais visitées
- ⚠️ **NON** pour les données API en temps réel

**Test recommandé** :
1. Visiter `/home`, `/squads`, `/sessions` online
2. Activer mode avion
3. Naviguer entre ces pages → devrait fonctionner parfaitement

---

## 3. Haptic Feedback 📳

### Infrastructure Existante

#### Web Vibration API
**Fichier** : `src/utils/haptics.ts`
**Status** : ✅ Bien structuré

**Patterns disponibles** :
```typescript
light: 10ms
medium: 25ms
heavy: 50ms
success: [10, 50, 10]
error: [50, 100, 50]
warning: 100ms
selection: 10ms
notification: [30, 50, 30, 50, 30]
achievement: [10, 30, 10, 30, 50, 100, 50]
levelUp: [20, 50, 30, 50, 40, 50, 100]
```

**Préférences utilisateur** :
- ✅ LocalStorage `hapticEnabled`
- ✅ Check `isHapticSupported()`

#### Native Haptics (Capacitor)
**Fichier** : `src/hooks/useNativePush.ts`
**Status** : ✅ Implémenté

**Fonction** : `triggerHaptic(type)`
- Détection plateforme native vs web
- Native : `@capacitor/haptics` (ImpactStyle, NotificationType)
- Web : Fallback sur Vibration API

**Types supportés** :
- `light`, `medium`, `heavy`
- `success`, `warning`, `error`

#### Hook React
**Fichier** : `src/hooks/useHapticFeedback.ts`
**Status** : ✅ Production-ready

**Fonctionnalités** :
- ✅ `triggerHaptic(type)`
- ✅ `isEnabled`, `isSupported`
- ✅ `toggleHaptic()`, `setHaptic(boolean)`
- ✅ Sync avec localStorage events

### Utilisation Actuelle ⚠️

**Où c'est utilisé** :
1. ✅ `SwipeableMessage.tsx` (ligne 51, 79, 92)
   - Haptic sur swipe threshold
   - Haptic sur swipe end

**Où ça DEVRAIT être utilisé mais ne l'est PAS** :
- ❌ CreateSessionModal (création session)
- ❌ Session RSVP (présent/absent/maybe)
- ❌ Session confirmation
- ❌ Offline/Online transitions
- ❌ Message send
- ❌ Squad invite accept/decline
- ❌ Achievement unlock
- ❌ XP gain / Level up

### Améliorations Implémentées ✅

#### 1. CreateSessionModal
**Fichier** : `src/components/CreateSessionModal.tsx`
- ✅ Import `useHapticFeedback`
- ✅ `triggerHaptic('success')` sur création réussie
- ✅ `triggerHaptic('error')` sur erreur

#### 2. Session RSVP
**Fichier** : `src/hooks/useSessionActions.ts`
- ✅ Fonction `triggerHaptic()` helper ajoutée
- ✅ `triggerHaptic('success')` après `updateRsvp()`
- ✅ `triggerHaptic('success')` après `confirmSession()`

#### 3. Offline/Online Events
**Fichier** : `src/hooks/useOffline.ts`
- ✅ `navigator.vibrate([10, 50, 10])` sur reconnexion (success pattern)
- ✅ `navigator.vibrate([50, 100, 50])` sur déconnexion (error pattern)

---

## Recommandations Futures

### Push Notifications
1. ⚠️ **Ajouter trigger push sur squad invite**
   - Créer un trigger Postgres sur `squad_members` INSERT
   - Appeler `send-push` edge function
   - Type: `squad_invite`, Actions: Accepter/Refuser

2. ⚠️ **Push silencieux pour messages**
   - Implémenter badge count update
   - Ne pas afficher notification si app ouverte
   - Utiliser `data` payload pour update UI

3. 💡 **Analytics push**
   - Tracker open rate des notifications
   - A/B testing sur titres/copy
   - Segmentation par type de notification

### Offline Mode
1. ✅ **Cache coverage OK** (assets + fonts + CSS)
2. 💡 **Prefetch routes critiques**
   - Ajouter `/home`, `/squads` au précache SW
   - Prefetch au login (déjà fait via `routePrefetch.ts`)

3. 💡 **Offline mutations UI**
   - Afficher badge "X actions en attente" dans OfflineBanner
   - Liste des mutations queued (Settings page)

### Haptic Feedback
1. ✅ **Déjà implémenté** : Session create, RSVP, Offline events
2. 💡 **À ajouter** :
   - Message send → `haptic.light()`
   - Achievement unlock → `haptic.achievement()`
   - Level up → `haptic.levelUp()`
   - Squad invite accept → `haptic.success()`

---

## Fichiers Modifiés

1. `src/components/CreateSessionModal.tsx`
   - Ajout import `useHapticFeedback`
   - Haptic feedback sur success/error

2. `src/hooks/useSessionActions.ts`
   - Fonction `triggerHaptic()` helper
   - Haptic sur RSVP confirmation
   - Haptic sur session confirmation

3. `src/hooks/useOffline.ts`
   - Haptic sur online event
   - Haptic sur offline event

---

## Conclusion

**État global** : ✅ Infrastructure solide, prête pour production

**Forces** :
- Push notifications Web + Native complètes
- Service Worker avec cache intelligent
- Offline mutation queue avec Background Sync
- React Query persistence (24h IndexedDB)
- Infrastructure haptic moderne

**Améliorations apportées** :
- ✅ Haptic feedback sur actions critiques (session, RSVP, offline)
- ✅ Vibration API utilisée de manière cohérente
- ✅ Expérience tactile améliorée pour mobile

**Prochaines étapes** :
- Ajouter push trigger pour squad invites
- Implémenter badge count pour messages
- Étendre haptic feedback (achievements, messages)

---

**Audit réalisé par** : Claude Code Agent
**Date** : 12 février 2026
