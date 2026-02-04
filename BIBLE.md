# SQUAD PLANNER — DOCUMENT FONDATEUR COMPLET

**Version 1.0** — "Planning + Party + Engagement réel"
*(sans Discord, sans bullshit, orienté cash & rétention)*

---

## 1. POSITIONNEMENT STRATÉGIQUE (LA VÉRITÉ)

### Ce que Squad Planner N'EST PAS

- ❌ Un réseau social gaming
- ❌ Un LFG
- ❌ Un Discord alternatif
- ❌ Une app "fun"

### Ce que Squad Planner EST

**Un système d'engagement collectif** qui transforme une intention molle en action planifiée + présence réelle + habitude répétée.

> 👉 Si Discord + Google Calendar suffisent, ton app est morte.
> 👉 Si Squad Planner crée plus de présence réelle, elle gagne.

---

## 2. PROBLÈME MARCHÉ (BRUT)

Les joueurs :
- ont des amis
- ont des squads
- ont Discord
- ont des jeux

**Mais :**
- personne ne tranche
- tout le monde dit "on verra"
- les no-shows ruinent la motivation
- aucune sanction sociale douce
- aucune habitude ne se crée

> 👉 Le vrai ennemi n'est pas le manque d'amis. C'est le manque de commitment.

---

## 3. CONCEPT CENTRAL (À NE JAMAIS TRAHIR)

### Équation cœur

```
Coordination + Pression sociale douce + Communication temps réel = Habitude de jeu
```

### Les 3 piliers

1. **Party vocale persistante** (comme PlayStation App)
2. **Planning avec décision forcée**
3. **Mesure de la fiabilité réelle**

**Tout le reste est secondaire.**

---

## 4. ARCHITECTURE PRODUIT (MENTALE)

### 4.1 Les 3 couches fonctionnelles

#### 🟢 Communication (rétention)
- Chat texte (WhatsApp-like)
- Party vocale de squad (PS App-like)
- Appels 1-to-1 (même app fermée)

#### 🟡 Coordination (valeur)
- Proposer une session
- RSVP
- Confirmation automatique
- Rappels intelligents

#### 🔵 Engagement (monétisation)
- Check-in présence
- Score de fiabilité
- Historique
- Nudges IA

---

## 5. ÉCRANS OBLIGATOIRES (MAP GLOBALE)

### Navigation principale (tabs)

| Tab | Description |
|-----|-------------|
| Accueil | Dashboard personnel |
| Squads | Liste des squads |
| **Party** ⭐ | Party vocale |
| Messages | Chat |
| Profil | Settings & stats |

> ⚠️ **La Party DOIT avoir son onglet.**
> Sinon personne ne l'utilise → app morte.

---

## 6. PARCOURS UTILISATEURS COMPLETS (BIBLE UX)

### PARCOURS A — ONBOARDING

**Objectif :**
- rejoindre/créer une squad
- entrer en party
- comprendre la promesse

**Étapes :**

1. **Splash** → proposition de valeur claire
   > "Arrêtez de dire 'on verra'. Jouez vraiment ensemble."

2. **Auth** (Apple / Google / Email)

3. **Choix :**
   - Créer une squad
   - Rejoindre une squad

4. **Permissions** (dans cet ordre) :
   - Notifications (obligatoire)
   - Micro (expliqué, "plus tard" possible)

5. **Profil minimal :**
   - pseudo
   - avatar
   - fuseau horaire auto

6. **Redirection** → Squad / Party

**KPI :**
- 1re action < 90 secondes
- 1re entrée en party < 24h

---

### PARCOURS B — CRÉER UNE SQUAD

**Objectif :** créer un espace vivant immédiatement

**Champs :**
- Nom
- Jeu principal
- Fuseau horaire
- Taille idéale
- Règles :
  - jours préférés
  - heure habituelle
  - durée moyenne

**Après création :**

Message système :
> "Squad créée. Propose une session ou démarre une party."

**CTA visibles :**
- Inviter
- Démarrer une party
- Proposer une session

---

### PARCOURS C — PARTY VOCALE (CŒUR DE L'APP)

**Définition :**
- 1 squad = 1 party vocale persistante
- Pas liée à une session
- Peut durer des heures

**Écran Party :**
- Nom squad
- Participants live (avatars + speaking)
- Boutons :
  - Rejoindre
  - Mute
  - Quitter
  - Inviter

**États :**
- `inactive`
- `active`
- `connecting`
- `reconnecting`
- `failed` (fallback)

**Règles UX :**
- rejoindre en 1 tap
- latence minimale
- downgrade qualité > crash

---

### PARCOURS D — APPELS 1-TO-1

**Cas d'usage :**
- "t'es en retard"
- "viens party"
- urgence

**Exigences :**
- notification appel même app fermée
- accepter / refuser
- appel manqué si refus

---

### PARCOURS E — CHAT TEXTE

**Types :**
- Chat squad (obligatoire)
- DM 1-to-1

**Fonctionnalités v1 :**
- temps réel
- messages système
- optimistic UI
- retry automatique
- scroll stable

---

### PARCOURS F — PLANNING & RSVP

**Proposer une session :**
- date
- heure
- durée
- note

**RSVP :**
- ✅ prêt
- ❌ absent

**Confirmation automatique :**
- seuil paramétrable
- message système
- notifications

---

### PARCOURS G — CHECK-IN (ENGAGEMENT)

**Au moment T :**
- "Je suis là"
- "Je suis en retard"
- "Je ne viens pas"

**Impact :**
- score fiabilité
- stats squad

---

## 7. IA — UTILITÉ RÉELLE (PAS GADGET)

### Rôles IA

- suggestion créneau optimal
- relance RSVP
- résumé de squad
- détection no-show chronique

### Règles

- IA ne spam pas
- IA propose → humain valide
- IA agit sur engagement uniquement

---

## 8. MONÉTISATION (CE QUI FAIT RENTRER DE L'ARGENT)

### Modèle recommandé

> 👉 **Par squad, pas par utilisateur.**

### Gratuit

- 1–2 squads
- party vocale basique
- planning + RSVP
- rappels simples

### Premium

- **19,99€/mois / squad**
- **199€/an**
- Annulable à tout moment.

### Premium débloque

- historique illimité
- stats fiabilité
- rappels avancés
- règles anti no-show
- qualité audio supérieure
- rôles (coach, manager)
- export calendrier

---

## 9. PROJECTIONS RÉALISTES

| Année | Squads | Premium | Revenue |
|-------|--------|---------|---------|
| 1 | 5 000 | 20% | ~240k€/an |
| 3 | 150k | 30% | ~12M€/an |
| 5 | 1M | 20% | ~60M€/an |

B2B possible en plus (99–499€/mois).

---

## 10. DONNÉES (LOGIQUE MÉTIER)

### Objets clés

- `user`
- `squad`
- `squad_member`
- `message`
- `party`
- `party_participant`
- `session`
- `rsvp`
- `checkin`
- `call`
- `notification_log`

*(indépendant de Supabase, mappable facilement)*

---

## 11. KPI DE SURVIE

### Activation
- % entrée en party
- % RSVP

### Rétention
- minutes party / semaine
- sessions confirmées

### Engagement
- taux présence
- no-show rate

### Business
- conversion premium
- churn squad

---

## 12. ROADMAP OFFICIELLE

### V1 — MVP SOLIDE
- squads
- chat
- party vocale
- planning + RSVP
- notifications

### V2 — ENGAGEMENT
- check-in
- score fiabilité
- appels 1-to-1
- IA nudges

### V3 — PREMIUM
- stats avancées
- historique
- rôles
- audio boost

### V4 — RÉFÉRENCE MONDIALE
- IA prédictive
- B2B
- dashboards org

---

## 13. CONDITIONS DE MORT (À RELIRE SOUVENT)

**Ton produit échoue si :**

1. La party vocale est instable
2. Les notifications ratent
3. Le RSVP est flou
4. Tu ajoutes du social inutile
5. L'app n'est pas ouverte chaque jour

---

## 14. VÉRITÉ FINALE

> **Tu ne construis pas une app.**
>
> Tu construis :
> **Une machine à transformer des intentions sociales faibles en habitudes collectives répétées.**
>
> C'est rare.
> C'est dur.
> C'est monétisable.
