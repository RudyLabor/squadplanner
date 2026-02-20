# RAPPORT D'AUDIT COMPLET - Squad Planner (squadplanner.fr)

**31 routes auditées | 3 agents de code source | Navigation navigateur complète | 20 février 2026**

---

## 1. ERREURS CRITIQUES - Fonctionnalités incorrectement décrites

C'est le problème le plus grave. **Plusieurs pages disent ou impliquent que Squad Planner n'a PAS de chat ni de party vocale, alors qu'il les a.**

### 1.1 Blog : "Fonctionnalités vocales encore en développement" (FAUX)

- **Fichier :** `blog-posts.ts:50`
- **Texte :** `<li>Fonctionnalités vocales encore en développement</li>`
- C'est listé comme un **inconvénient** de SP alors que la party vocale **fonctionne**.
- **Fix :** Supprimer ou remplacer par `Communauté encore en pleine croissance`

### 1.2 Page Discord Events : positionne SP comme "orga uniquement"

- **Fichier :** `AlternativeDiscordEvents.tsx:33`
- `Squad Planner ne pense qu'à ça : tes sessions. Discord = commu. Nous = organisation.`
- **Aussi lignes 105, 208 :** `Discord, c'est pour parler. Squad Planner, c'est pour organiser.`
- **Fix :** Reformuler pour mentionner chat + party vocale intégrés

### 1.3 Les 3 pages Alternative ne mentionnent NI le chat NI la party vocale

| Page | Chat mentionné | Party Vocale |
|------|----------------|--------------|
| VS Guilded | OUI | OUI |
| Alternative Guilded | NON | NON |
| Alternative GamerLink | NON | NON |
| Alternative Discord Events | NON | NON |

- **Fix :** Ajouter chat + party vocale dans les features de chaque page Alternative

### 1.4 Blog : "SP pour l'organisation, Discord pour la communication"

- **Fichier :** `blog-posts.ts:145`
- **Fix :** `Squad Planner pour l'organisation, le chat et la party vocale gaming` + Discord pour la communauté élargie

### 1.5 Contradiction directe entre pages

- La page VS (ligne 324) dit : `l'orga gaming complète : calendrier, chat, party vocale`
- La page Discord Events dit l'inverse : `Nous = organisation`

---

## 2. ERREURS CRITIQUES - Prix inconsistants

| Page | Prix Premium affiché |
|------|---------------------|
| **Landing page** (PricingSection) | **6,99 EUR/mois** |
| **Page VS Guilded** (ligne 276) | **5,99 EUR/mois** ou 59,99 EUR/an |
| **Blog** (ligne 234, Guilded Premium) | 9,99 EUR/mois (prix inventé pour Guilded) |

Le prix Premium n'est pas le même partout. **A harmoniser d'urgence.**

---

## 3. ERREURS CONSOLE (Bugs techniques)

### 3.1 Erreur React #418 (Hydratation SSR) -- sur plusieurs pages

- **Pages touchées :** Help, Legal, Premium (et probablement toutes les pages prérendues)
- `Uncaught Error: Minified React error #418` = mismatch entre le rendu serveur et client
- **Impact :** Peut causer des bugs visuels et performances dégradées

### 3.2 Erreur CSP (Content Security Policy) -- Google Fonts bloquée

- La font **Plus Jakarta Sans** est bloquée par la CSP :
  - `font-src 'self'` bloque `fonts.gstatic.com`
  - `style-src 'self' 'unsafe-inline'` bloque `fonts.googleapis.com`
- **Fix :** Ajouter `fonts.gstatic.com` et `fonts.googleapis.com` à la CSP, ou héberger la font localement

---

## 4. ERREURS DE FRANÇAIS

### 4.1 Orthographe / Grammaire

| # | Fichier | Texte fautif | Correction |
|---|---------|-------------|------------|
| 1 | `blog-posts.ts:89` | `Apprentissage plus stéger` | `plus complexe` (steger n'existe pas) |
| 2 | `blog-posts.ts:122` | `Respect de la vie privée respecté` | `...garanti` (redondance) |
| 3 | `blog-posts.ts:272` | `comebacképicalement` | `comeback épique` (mots collés) |
| 4 | `blog-posts.ts:273` | `moment mémoriser` | `moment mémorable` |
| 5 | `blog-posts.ts:403` | `du morale` | `le moral` (genre incorrect) |
| 6 | `blog-posts.ts:376` | `une forme léger` | `une forme légère` (accord féminin) |
| 7 | `blog-posts.ts:284` | `Checkoff list` | `Checklist` |
| 8 | `Profile.tsx` (badges) | `Legende` | `Légende` (accent manquant) |
| 9 | `Profile.tsx` | `Toutes les features sont débloquées` | `fonctionnalités` (anglicisme) |
| 10 | `SquadAnalytics.tsx:55` | `Découvrez les statistiques de votre squad` | `Découvre...de ta squad` (vouvoiement inconsistant) |
| 11 | `ClubDashboard.tsx:340` | `Across {squads.length} squad` | `Dans` (anglais dans UI française) |

### 4.2 Anglicismes à corriger

| Fichier | Texte | Correction |
|---------|-------|------------|
| `LandingFooter.tsx:268` | `RGPD compliant` | `Conforme au RGPD` |
| `LandingFooter.tsx:69` | `Tips, updates` | `Astuces, mises à jour` |
| `Referrals.tsx:135` | `gagne des rewards` | `gagne des récompenses` |
| `Settings.tsx` | `Voir la landing page` | `Voir la page d'accueil` |
| Blog multiples lignes | `Prizes`, `sportsmanship`, `peer pressure` | `Lots/récompenses`, `esprit sportif`, `pression sociale` |

### 4.3 Espaces manquantes avant ponctuation (typographie française)

- **Blog :** Des dizaines d'occurrences : `?` `!` `:` sans espace avant
- **Exemples :** `Quel choix faire?`, `gaming complète?`, `qu'il n'y paraît!`, `tes RSVP!`
- **Fix :** Ajouter systématiquement `\u00a0` (espace insécable) avant `?` `!` `:` `;`

### 4.4 Tutoiement / Vouvoiement inconsistant

- **Blog article tournoi :** Alterne entre "je te montrerai" et "Vous validez", "Annoncez"
- **SquadAnalytics :** Vouvoiement alors que tout le reste tutoie
- **Fix :** Tout mettre au tutoiement (cohérent avec le ton de l'app)

### 4.5 Capitalisation des titres (convention anglaise au lieu de française)

- `SquadAnalytics.tsx:68-101` : `Heatmap de Présence`, `Fiabilité des Membres`, `Tendance des Sessions`
- **Fix :** En français, seul le premier mot prend une majuscule : `Heatmap de présence`, etc.

---

## 5. BUGS UX / LIENS MORTS / BOUTONS INACTIFS

| # | Fichier | Problème |
|---|---------|----------|
| 1 | `AlternativeDiscordEvents.tsx` | **Titre dupliqué** : "Des RSVP qui servent à rien" apparaît 2 fois (uid=7_30 et uid=7_33) |
| 2 | `ClubDashboard.tsx:454` | **Dead link potentiel** : `<Link to="/squads/create">` - cette route n'existe probablement pas |
| 3 | `ClubDashboard.tsx:694` | **Bouton désactivé sans explication** : "Choisir un fichier" (logo upload) est `disabled` sans indication |
| 4 | `ClubDashboard.tsx:239` | **Fausse fonctionnalité** : "Export PDF" affiche juste un toast "bientôt disponible" mais le bouton n'est pas grisé |
| 5 | `ClubDashboard.tsx:66-67` | **Branding non persiste** : Le nom du club et la couleur sont en state local uniquement, perdus au rechargement |
| 6 | `NotFound.tsx:40` | **Page 404** : Le bouton "Retour à l'accueil" pointe vers `/home` (route protégée) au lieu de `/` |
| 7 | `SessionDetail.tsx:302` | **Classe CSS cassée** : `bg-success-10` devrait être `bg-success/10` |
| 8 | `Settings.tsx:194`, `CallHistory.tsx:94` | `navigate(-1)` sans fallback -- peut sortir de l'app si accès direct |
| 9 | Page Squads | Le nom "UTE for LIFE" est tronqué en "UTE fo..." dans la carte de squad |

---

## 6. STATISTIQUES POTENTIELLEMENT TROMPEUSES

| Stat | Emplacement | Risque |
|------|-------------|--------|
| `+2 000 gamers inscrits` | Footer, pages SEO | A vérifier si c'est réel |
| `+5 000 sessions planifiées` | Footer | A vérifier |
| `4.9/5 satisfaction` | Footer | Non sourcée, pas de nb de répondants |
| `Wrapped.tsx:89` | Fallback `bestStreak` calcule avec `Math.ceil(sessionCount / 3) + 2` | Invente un chiffre si pas de données réelles |
| `Wrapped.tsx:94` | Fallback `reliabilityScore` entre 85-99 | Fabrique un score bidon |

---

## 7. QUALITÉ CODE (console.log en production)

| Fichier | Lignes | Type |
|---------|--------|------|
| `Home.tsx:270` | `console.error('RSVP error:', error)` | console.error |
| `SquadDetail.tsx:99` | `console.error('RSVP error:', err)` | console.error |
| `Profile.tsx:113` | `console.error('Error claiming XP:', error)` | console.error |
| `ClubDashboard.tsx:201` | `console.error('Error fetching club data:', err)` | console.error |
| `Party.tsx:74,155,198,200` | 4x console.error/warn | multiples |

---

## 8. ACCESSIBILITÉ

| Fichier | Problème |
|---------|----------|
| `Home.tsx` | Pas de `<main>` avec `aria-label` (contrairement aux autres pages) |
| `SquadAnalytics.tsx:51` | Lien retour (icône seule) sans `aria-label` |
| `Home.tsx` useEffect | Deps vide `[]` mais utilise `profile?.username` -- le titre de page ne se met pas à jour |

---

## RÉSUMÉ PAR PRIORITÉ

### CRITIQUE (impact business / image du produit)

1. **7 pages disent que SP n'a pas de chat/vocale** (alors que si)
2. **Prix inconsistants** entre landing (6,99EUR) et page VS (5,99EUR)
3. **Erreur React #418** (hydratation) sur pages prérendues
4. **Erreur CSP** bloquant Google Fonts

### IMPORTANT (crédibilité / qualité perçue)

5. **11 fautes de français** visibles par les utilisateurs
6. **Titre dupliqué** sur page Discord Events
7. **Dead links potentiels** (`/squads/create`)
8. **Page 404** pointe vers route protégée
9. **Anglicismes visibles** (RGPD compliant, rewards, Tips/updates)

### MOYEN (polish / professionnalisme)

10. **Tutoiement/vouvoiement inconsistant** dans blog + SquadAnalytics
11. **Capitalisation anglophone** des titres
12. **Boutons qui ne fonctionnent pas** (Export PDF, Upload logo)
13. **Stats potentiellement trompeuses** dans footer et Wrapped
14. **console.error en production** (7+ occurrences)

### MINEUR (refinement)

15. Espaces insécables manquantes avant ponctuation
16. Imports inutilisés
17. Classes CSS hardcodées hors design system

---

**Total : ~60 problèmes identifiés sur 31 pages auditées.**
