# Audit QA Complet — Squad Planner

> **Date :** 20 février 2026
> **Auditeur :** Claude (Cowork)
> **Scope :** Code source + Site live (squad-planner-app.vercel.app)
> **Compte testé :** FloydCanShoot (Premium)

---

## Résumé exécutif

| Catégorie | Critique | Haute | Moyenne | Basse | Total |
|-----------|----------|-------|---------|-------|-------|
| Sécurité | 2 | 4 | 2 | 2 | **10** |
| Bugs logiques / Code | 0 | 3 | 5 | 3 | **11** |
| UX / UI | 0 | 1 | 3 | 3 | **7** |
| Performance | 0 | 0 | 1 | 1 | **2** |
| **TOTAL** | **2** | **8** | **11** | **9** | **30** |

### Performance live (mesurée sur /home)

| Métrique | Valeur | Verdict |
|----------|--------|---------|
| First Contentful Paint | 532ms | ✅ Excellent |
| DOM Content Loaded | 168ms | ✅ Excellent |
| Page Load | 179ms | ✅ Excellent |
| Transfer Size (SSR) | 21 KB | ✅ Excellent |
| DOM Nodes | 512 | ✅ Bon |
| Erreurs console | 0 | ✅ Aucune |
| Images cassées | 0 | ✅ Aucune |
| Liens vides | 0 | ✅ Aucun |

---

## CRITIQUE — Action immédiate requise

### SEC-1 : Secrets exposés dans l'historique Git

- **Fichier :** `.git/` (commits historiques)
- **Impact :** SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, VITE_SENTRY_DSN ont été commités
- **Statut actuel :** `.env` correctement exclu maintenant, mais l'historique contient les clés
- **Fix :**
  1. Révoquer TOUS les secrets exposés dans Supabase, DB, Sentry
  2. `bfg --delete-files .env` pour purger l'historique
  3. `git push --force` après nettoyage
  4. Monitorer les logs Supabase pour accès non autorisés

### SEC-2 : Comparaison de tokens vulnérable aux timing attacks

- **Fichier :** `supabase/functions/send-reminders/index.ts`
- **Impact :** La comparaison `===` entre `cronHeader` et `cronSecret` est vulnérable aux timing attacks. Si `CRON_SECRET` n'est pas défini, n'importe qui peut déclencher des floods de rappels.
- **Fix :** Utiliser `crypto.timingSafeEqual()` et vérifier que `CRON_SECRET` est défini au démarrage

---

## HAUTE — À corriger avant production

### SEC-3 : send-welcome-email sans authentification

- **Fichier :** `supabase/functions/send-welcome-email/index.ts` (lignes 176-226)
- **Impact :** Accepte `email` + `username` directement sans vérifier que l'appelant est autorisé → spam d'emails possible
- **Fix :** Exiger un header d'authentification, rate-limiter par user_id (max 5/h)

### SEC-4 : Pas de rate limiting sur les proxies publics

- **Fichiers :** `giphy-proxy`, `tenor-proxy`
- **Impact :** N'importe qui peut flooder les APIs tierces → DDoS amplification
- **Fix :** Rate limit 10 req/min par user authentifié, cache des recherches populaires

### SEC-5 : Race condition Discord OAuth

- **Fichier :** `supabase/functions/discord-oauth/index.ts` (lignes 179-194)
- **Impact :** 2 users peuvent lier le même compte Discord simultanément
- **Fix :** Contrainte UNIQUE en DB sur `discord_user_id` + gestion de l'erreur

### SEC-6 : Tier Stripe non vérifié côté serveur

- **Fichier :** `supabase/functions/create-checkout/index.ts`
- **Impact :** Le client peut envoyer `tier=club` avec un `price_id` de tier premium
- **Fix :** Mapping server-side `price_id → tier`, rejeter les paires incohérentes

### BUG-1 : Memory leak — useGlobalPresence

- **Fichier :** `src/hooks/useGlobalPresence.ts` (lignes 114-196)
- **Impact :** `setInterval` pour `last_seen_at` non nettoyé si `userId` change rapidement. Channels Supabase orphelins possibles.
- **Fix :** Vérifier que le cleanup de l'effet nettoie bien `clearInterval` + `supabase.removeChannel` dans tous les cas

### BUG-2 : Memory leak — useCallActions channel jamais retiré

- **Fichier :** `src/hooks/useCallActions.ts` (lignes 147-219)
- **Impact :** `subscribeToIncomingCalls` retourne une cleanup function mais rien ne garantit qu'elle est appelée si le composant unmount avant
- **Fix :** S'assurer que l'appel est dans un `useEffect` avec `return unsubscribe`

### BUG-3 : Crash possible — SessionDetail rsvps undefined

- **Fichier :** `src/pages/SessionDetail.tsx` (lignes 316, 323)
- **Impact :** `rsvps` est optionnel dans le type mais casté `as ParticipantsListProps_rsvps`. Si `undefined`, `PostSessionResults` crash.
- **Fix :** `rsvps={currentSession.rsvps || []}` au lieu du cast

### UX-1 : MobileBottomNav — mutation directe de Supabase auth internals

- **Fichier :** `src/components/layout/MobileBottomNav.tsx` (lignes 20-54)
- **Impact :** `handleStuckNavClick` accède directement à `auth.lockAcquired` et `auth.pendingInLock` → code fragile qui cassera si Supabase change son implémentation interne
- **Fix :** Implémenter un timeout/retry propre, ou signaler le bug à Supabase

---

## MOYENNE — À corriger dans le prochain sprint

### BUG-4 : Race condition messages — double-fetch

- **Fichier :** `src/hooks/useMessages.ts` (lignes 167-187)
- **Impact :** Switch rapide de conversations → 2 fetch simultanés, pas de garantie sur lequel gagne. Messages stales possibles.
- **Fix :** Ajouter un `AbortController` pour annuler le fetch précédent

### BUG-5 : Typing indicator bloqué si connexion perdue

- **Fichier :** `src/hooks/useTypingIndicator.ts` (lignes 119-154)
- **Impact :** Si la connexion coupe avant le `stop_typing` (3s timeout), l'indicateur "écrit..." reste affiché indéfiniment
- **Fix :** Envoyer `stop_typing` dans le cleanup du useEffect + réduire l'intervalle de nettoyage

### BUG-6 : Crash si profile.username est null

- **Fichier :** `src/hooks/useMessages.ts` (lignes 224-230)
- **Impact :** Si `profile.username` est null, le sender affiche `undefined`
- **Fix :** `username: profile.username || 'Utilisateur'`

### BUG-7 : Messages.tsx — skeleton timeout inutile

- **Fichier :** `src/pages/Messages.tsx` (lignes 111-116)
- **Impact :** Le flag `loadingTimedOut` est défini après 2s mais le skeleton ne disparaît jamais si le chargement est toujours en cours
- **Fix :** Afficher un message "Le chargement prend plus de temps..." après le timeout

### BUG-8 : handleConfirm sans gestion d'erreur

- **Fichier :** `src/pages/SessionDetail.tsx` (lignes 137-140)
- **Impact :** `handleConfirm` n'a ni try/catch ni toast (contrairement à `handleRsvp`)
- **Fix :** Ajouter try/catch + toast de succès/erreur

### SEC-7 : Error responses leaking internal details

- **Fichiers :** giphy-proxy, tenor-proxy, error-report (Edge Functions)
- **Impact :** Les réponses d'erreur exposent `errorText` des APIs tierces, potentiellement des détails internes
- **Fix :** Logger côté serveur, retourner "Service unavailable" au client

### SEC-8 : Webhook Stripe silencieux si secret manquant

- **Fichier :** `supabase/functions/stripe-webhook/index.ts` (lignes 84-96)
- **Impact :** Si `STRIPE_WEBHOOK_SECRET` n'est pas configuré, la fonction retourne 400 au lieu de 503
- **Fix :** Retourner 503 + alerter l'équipe ops si le secret est absent

### UX-2 : Touch targets trop petits

- **Pages affectées :** Toutes (sidebar, nav)
- **Éléments concernés :**
  - Liens sidebar : 48x21px (minimum recommandé : 44x44px en hauteur)
  - Bouton notification bell : 36x36px
  - Certains liens : 20x20px
  - Bouton "Copier" : 68x36px
  - Lien "Ajouter au calendrier" : 156x30px
- **Fix :** Augmenter le `min-height` des liens sidebar à 44px et le padding des petits boutons

### UX-3 : Incohérence — "CETTE SEMAINE" vs "SEMAINE" (mobile)

- **Page :** Home
- **Desktop :** "0 CETTE SEMAINE"
- **Mobile :** "0 SEMAINE"
- **Fix :** Utiliser le même label ou un responsive text cohérent

---

## BASSE — Nice to have

### BUG-9 : useVoiceCall interval non nettoyé si WebRTC throw

- **Fichier :** `src/hooks/useVoiceCall.ts` (lignes 139-147)
- **Impact :** Si `initializeNativeWebRTC` throw, `resetCall()` n'est pas appelé, laissant le `ringTimeout` actif
- **Fix :** Ajouter `get().resetCall()` dans le catch

### BUG-10 : Premium status flicker au login

- **Fichier :** `src/hooks/useAuth.ts` (lignes 62, 82, 90)
- **Impact :** `fetchPremiumStatus()` est fire-and-forget → le badge premium peut clignoter
- **Fix :** Await le fetch ou mettre un loading state

### BUG-11 : Typing indicator cleanup interval lag

- **Fichier :** `src/hooks/useTypingIndicator.ts` (lignes 70-77)
- **Impact :** L'intervalle tourne toutes les 1s avec un timeout de 3s → un user déconnecté peut persister 1-4s
- **Fix :** Réduire l'intervalle à 500ms

### UX-4 : Preview message tronqué montre le username comme contenu

- **Page :** Messages
- **Observation :** Le preview affiche "FloydCanShoot: FloydCanShoot ..." — le dernier message semble être juste le username répété
- **Fix :** Vérifier la logique de preview des messages, possible que le message contienne le username comme texte

### UX-5 : Party — avatars "A B" au lieu des vrais avatars

- **Page :** Party
- **Observation :** Les 2 membres de la squad sont affichés comme "A B" (initiales) au lieu de leurs vraies photos de profil
- **Fix :** Vérifier le composant avatar dans la card Party — probablement un fallback par défaut quand l'avatar n'est pas chargé

### UX-6 : Discover — empty state sur toutes les recherches

- **Page :** Discover
- **Observation :** "Aucune squad publique trouvée" — il semble que la squad "UTE for LIFE" ne soit pas publique
- **Impact :** Un nouvel utilisateur qui arrive sur Discover ne voit rien → mauvaise first impression
- **Fix :** Rendre au moins une squad publique pour la démo, ou afficher des suggestions/tips

### SEC-9 : Verbose logging en production

- **Fichier :** `supabase/functions/send-reminders/index.ts`
- **Impact :** Les logs contiennent des détails de notifications potentiellement sensibles
- **Fix :** Anonymiser les logs, ne logger que les counts

### SEC-10 : Pas de rate limiting par IP sur les fonctions publiques

- **Fichiers :** giphy-proxy, tenor-proxy, error-report
- **Impact :** Appels non authentifiés non limités par IP
- **Fix :** Rate limit 30 req/min par IP via X-Forwarded-For

---

## Points positifs

L'app est globalement très bien construite. Voici ce qui est remarquable :

- ✅ **0 erreur console** sur toutes les pages testées (home, squads, sessions, messages, party, discover, profile, settings, referrals, help, call-history, 404)
- ✅ **0 image cassée**, 0 lien mort, 0 bouton sans accessible name
- ✅ **Performance excellente** : FCP 532ms, 21KB initial transfer, 512 DOM nodes
- ✅ **SSR fonctionnel** : pages servies en HTML côté serveur
- ✅ **Page 404 propre** avec suggestions de pages populaires
- ✅ **Skip link** présent pour l'accessibilité clavier
- ✅ **lang="fr"** sur le `<html>`
- ✅ **Pas de XSS** : aucun `dangerouslySetInnerHTML` avec user input
- ✅ **SQL injection impossible** : toutes les queries passent par Supabase SDK (paramétré)
- ✅ **RLS en place** : Row Level Security configuré sur les tables
- ✅ **Stripe webhook signature** correctement vérifiée
- ✅ **Routes protégées** avec clientLoader auth check
- ✅ **Mobile responsive** : navigation bottom nav propre, layout adaptatif
- ✅ **États vides** gérés (Discover, Messages, Call History)
- ✅ **Breadcrumbs** présents sur toutes les pages
- ✅ **Input validation** framework robuste dans `_shared/schemas.ts`

---

## Corrections déjà appliquées dans cette session

| Commit | Description |
|--------|-------------|
| `cf25bb6` | fix: thème par défaut dark au lieu de system |
| `9efd991` | fix: corriger sources de hydration mismatch React #418 (script canonical supprimé, double-set thème supprimé, Sheet.tsx SSR-safe, canonical referrals ajouté) |

**⚠️ Ces commits sont locaux — pas encore pushés.** Exécuter `git push origin main` depuis le PC local.

---

## Priorités recommandées

### Sprint immédiat (cette semaine)

1. **Révoquer les secrets exposés** (SEC-1) — CRITIQUE
2. **Fix timing-safe comparison** (SEC-2) — CRITIQUE
3. **Fix SessionDetail rsvps crash** (BUG-3) — simple, 1 ligne
4. **Fix useMessages double-fetch** (BUG-4) — AbortController
5. **Push les 2 commits** existants (thème + hydration)

### Sprint suivant

6. Auth send-welcome-email (SEC-3)
7. Rate limiting proxies (SEC-4)
8. Discord OAuth UNIQUE constraint (SEC-5)
9. Stripe tier validation (SEC-6)
10. Memory leaks hooks (BUG-1, BUG-2)
11. Touch targets accessibility (UX-2)

### Backlog

12-30. Bugs moyens et bas selon disponibilité

---

*Rapport généré automatiquement par audit Cowork. Pour questions : relancer l'audit avec des scénarios spécifiques.*
