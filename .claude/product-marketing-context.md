# Product Marketing Context

*Last updated: 28 fevrier 2026*
*Source: audit complet des 62 pages de squadplanner.fr + analyse codebase*

---

## Product Overview

**One-liner:** Squad Planner est le Calendly du gaming — l'app qui permet aux gamers de planifier leurs sessions, confirmer les presences et jouer ensemble sans ghosting.

**What it does:** Squad Planner resout le probleme universel des squads gaming : les joueurs qui disent "oui" et ne viennent pas. L'app combine un calendrier de sessions avec confirmation de presence, un score de fiabilite par joueur, un chat integre, et une party vocale 24/7 — le tout dans une interface taille pour les gamers francophones.

**Product category:** Organisation gaming / Coordination d'equipe gaming / LFG (Looking For Group) tool

**Product type:** SaaS web app (PWA + mobile Capacitor) — freemium

**Business model:**
- **Gratuit** : 1 squad, 2 sessions/semaine, historique 7 jours, chat basique, score de fiabilite, notifications push
- **Premium** : 6,99 EUR/mois ou 69,90 EUR/an — 5 squads, sessions illimitees, historique 90 jours, chat complet (GIF, voice, polls), stats avancees, IA Coach, badge Premium violet
- **Squad Leader** : Squads illimites, historique illimite, audio HD, IA Coach avance, dashboard analytics, roles avances (IGL, Coach), export calendrier, sessions recurrentes, badge dore
- **Club** : Forfait B2B pour structures esport — dashboard multi-squads, stats cross-squad, branding personnalise, API webhooks, onboarding assiste, support prioritaire 24h

---

## Target Audience

**Target users:** Gamers francophones (principalement France) ages de 16 a 35 ans qui jouent regulierement en equipe sur PC, console ou mobile.

**Decision-makers:** Le "capitaine de squad" — la personne qui organise les sessions, cree le serveur Discord, et envoie les messages "on joue ce soir ?". C'est le premier a s'inscrire et a inviter les autres.

**Primary use case:** Eliminer le ghosting et les no-shows dans les sessions de jeu en equipe en rendant chaque joueur responsable via un score de fiabilite mesurable.

**Jobs to be done:**
- "Savoir qui vient vraiment ce soir" — Confirmation de presence fiable avec notifications push et rappels
- "Organiser mes sessions sans me prendre la tete chaque semaine" — Planification automatique avec recurrence
- "Retrouver ma squad pour parler et jouer" — Chat + party vocale toujours ouverte

**Use cases specifiques:**
- Squad competitive Valorant/LoL qui joue 3x par semaine et veut tracker la fiabilite
- Groupe d'amis casual Fortnite/Minecraft qui veut juste savoir qui est dispo le vendredi soir
- Communaute Discord 100+ membres qui a besoin d'organiser des tournois
- Streamer qui veut coordonner les sessions avec ses viewers/abonnes
- Structure esport qui gere plusieurs equipes et veut des analytics cross-squad

---

## Personas

| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| **Capitaine de squad** (organizer, 20-28 ans) | Que tout le monde vienne, progression de l'equipe | Il organise tout seul, les gens ghostent, il se lasse | "Plus personne ne ghost. Tu sais qui vient. Ton score de fiabilite les responsabilise." |
| **Joueur regulier** (member, 16-25 ans) | Jouer avec ses potes, pas d'efforts d'orga | Il ne sait jamais quand jouer, rate les sessions | "Tu confirmes en 2 clics. Tu recois un rappel 30 min avant. Tu joues ce soir." |
| **Streamer / Createur** (influencer, 18-35 ans) | Croitre sa communaute, monetiser | Coordonner les sessions avec sa communaute | "Programme ambassadeur : 20% commission, Squad Leader gratuit a vie, badge exclusif." |
| **Manager esport** (B2B, 22-35 ans) | Performance de ses equipes, analytics | Gerer plusieurs squads, tracker l'assiduite | "Dashboard Club multi-squads, export CSV, fiabilite par joueur, branding custom." |

---

## Problems & Pain Points

**Core problem:** Les gamers veulent jouer ensemble mais n'y arrivent jamais. Le message "On joue ce soir ?" dans Discord reste sans reponse. Quand une session est prevue, la moitie des joueurs ghostent. Le capitaine de squad se lasse d'organiser pour rien, et la squad meurt a petit feu.

**Why alternatives fall short:**
- **Discord Events** : Les gens cliquent "interesse" mais ne viennent pas. Zero suivi, zero rappel, zero consequence. Les evenements recurrents n'existent pas — tu dois tout refaire chaque semaine.
- **Guilded** : A ferme en 2024. Les communautes gaming n'ont plus de plateforme dediee a l'organisation.
- **GamerLink** : App de matchmaking, pas d'outil d'organisation. Pas de calendrier, pas de confirmations, pas de fiabilite.
- **Groupes WhatsApp/Messenger** : Les messages se perdent, pas de structure, pas de rappels automatiques.

**What it costs them:**
- Temps perdu a organiser pour rien (heures chaque semaine)
- Frustration : "J'ai reserve ma soiree et personne ne vient"
- La squad se disloque : les joueurs fiables partent car les no-shows les demoralisent
- Stagnation de rank : impossible de progresser sans equipe reguliere

**Emotional tension:**
- "Chaque jour sans session, c'est un soir ou ta squad joue sans toi"
- Frustration du capitaine abandonne : "Tout le monde attend que quelqu'un organise"
- Sentiment d'injustice : tu tiens parole, les autres non — et personne n'est responsable

---

## Competitive Landscape

**Direct competitors:**
- **Guilded** (ferme en 2024) — Etait le plus proche concurrent. Squad Planner se positionne comme le successeur naturel avec migration simple + code GUILDED30 (30% de reduction)
- **GamerLink** — App de matching gamers, pas d'outils d'organisation. Squad Planner est plus complet (calendrier, fiabilite, vocal)

**Secondary competitors (meme probleme, solution differente):**
- **Discord Events** — Fait partie de Discord mais les fonctionnalites sont basiques (pas de recurrence, pas de fiabilite, pas de rappels push). Squad Planner se positionne comme complementaire : "Discord = pour parler. Squad Planner = pour organiser."
- **Google Calendar / Doodle** — Outils generiques non adaptes au gaming

**Indirect competitors:**
- **Sondages Discord ("qui est dispo ?")** — Le status quo. Zero structure, zero suivi
- **Groupes WhatsApp** — Communication informelle sans outils d'organisation

**How each falls short:**
- Discord Events : pas de fiabilite, pas de recurrence, pas d'analytics, confirmations sans valeur
- Guilded : n'existe plus
- GamerLink : matching only, pas d'orga de sessions

---

## Differentiation

**Key differentiators:**
1. **Score de fiabilite** — Chaque joueur a un score base sur sa presence reelle (check-in). Les no-shows chroniques sont visibles. Unique sur le marche.
2. **Confirmation qui tient** — Notification push + rappel 30 min avant + check-in obligatoire. Quand quelqu'un dit "oui", il vient.
3. **Sessions recurrentes** — "Cree une fois, ca repete tout seul" chaque semaine. Set and forget.
4. **Tout-en-un gaming** — Calendrier + chat + party vocale + gamification dans une seule app (pas besoin de Discord + Doodle + WhatsApp)
5. **IA Coach** — Conseils personnalises pour ameliorer la regularite de la squad

**How we solve it differently:** Au lieu de juste creer un evenement et esperer que les gens viennent (Discord), Squad Planner cree un systeme de responsabilisation : confirmation → rappel → check-in → score de fiabilite. Le ghosting a des consequences visibles.

**Why that's better:** Le taux de presence passe de ~50% a 85%+ en quelques semaines. La squad joue ensemble regulierement au lieu de mourir a petit feu.

**Why customers choose us:** "Mes potes ne sont pas flemmards. Ils manquent juste d'un outil pour s'organiser." Squad Planner est le plus simple et le plus adapte au gaming.

---

## Objections & Anti-Personas

| Objection | Response |
|-----------|----------|
| "On a deja Discord pour ca" | Discord, c'est la commu. Squad Planner, c'est l'organisation. Les deux se completent. Les notifs arrivent dans Discord. |
| "C'est un truc de plus a installer" | 30 secondes pour creer ta squad. Tes potes rejoignent via un code. PWA — pas besoin de telecharger. |
| "Ca va pas durer / ca va fermer" | Squad Planner est viable et en croissance. Tu peux exporter tes donnees quand tu veux. Zero piege. |
| "Le gratuit suffit a mon usage" | Le gratuit couvre l'essentiel (calendrier, confirmations, notifs). Premium c'est pour les squads serieuses qui veulent des stats et de l'optimisation. |

**Anti-persona:**
- Joueur solo qui ne joue jamais en equipe
- Gamer ultra-casual qui joue 1x par mois et ne planifie rien
- Communaute qui veut uniquement un forum/chat (pas d'organisation de sessions)

---

## Switching Dynamics

**Push (frustrations avec l'existant):**
- "On joue ce soir ?" — 3 jours plus tard, toujours rien
- 8 personnes confirment, 3 se connectent
- Recreer l'evenement Discord chaque semaine = chiant
- Zero visibilite sur qui est fiable et qui ghost

**Pull (ce qui attire vers Squad Planner):**
- "Tu sais qui vient avant de lancer la session"
- Score de fiabilite qui responsabilise tout le monde
- Sessions recurrentes automatiques
- Party vocale toujours ouverte
- Gratuit pour l'essentiel, 30 secondes pour commencer

**Habit (ce qui les retient sur le status quo):**
- Tout le monde est deja sur Discord
- "Ca a toujours ete comme ca"
- Flemme de changer d'outil
- La squad est deja dans un groupe WhatsApp

**Anxiety (inquietudes sur le switch):**
- "Et si mes potes ne veulent pas s'inscrire sur un truc de plus ?"
- "Ca va mourir comme Guilded ?"
- "Est-ce que c'est vraiment gratuit ou c'est un piege ?"
- "Mes donnees sont-elles en securite ?"

---

## Customer Language

**How they describe the problem (verbatim FR):**
- "On joue ce soir ?" — la question universelle sans reponse
- "Je sais pas, on verra" — le tue-session
- "Session prevue, 2 mecs sur 5 se connectent"
- "Tout le monde attend que quelqu'un organise"
- "Ma squad est morte parce que plus personne n'organisait"

**How they describe us (verbatim FR):**
- "Le Calendly du gaming"
- "Fini le ghosting dans ma squad"
- "On sait enfin qui vient"
- "Le check-in rend tout le monde responsable"
- "Tes potes confirment en 2 clics"

**Words to use:**
- Squad, potes, session, jouer, fiabilite, ghosting, no-show, check-in, confirmer, party vocale, gratuit, 30 secondes, zero prise de tete, tu/ton/ta (tutoiement)

**Words to avoid:**
- Team (prefer "squad"), meeting (prefer "session"), schedule (prefer "planning"), application (prefer "app"), utilisateurs (prefer "joueurs/gamers"), workspace, enterprise, SLA, ROI

**Glossary:**

| Term | Meaning |
|------|---------|
| Squad | Groupe de joueurs (equivalent de "team" mais gaming) |
| Session | Creneau de jeu planifie avec RSVP |
| RSVP | Confirmation de presence (Present / Absent / Peut-etre) |
| Check-in | Validation de presence reelle en debut de session |
| Score de fiabilite | Pourcentage de presence reelle vs confirmations (0-100%) |
| Party vocale | Salon vocal toujours ouvert pour la squad |
| Ghosting | Ne pas venir a une session malgre confirmation |
| No-show | Joueur absent malgre confirmation |
| XP | Points d'experience pour la gamification |
| Streak | Jours consecutifs de connexion/participation |
| Club | Dashboard multi-squads pour managers esport |
| Wrapped | Recap annuel des stats gaming (a la Spotify Wrapped) |

---

## Brand Voice

**Tone:** Casual, direct, gaming-native. Comme un pote gamer qui te parle dans un salon Discord. Jamais corporate, jamais jargon marketing.

**Style:**
- Tutoiement systematique ("tu", "ta squad", "tes potes")
- Phrases courtes et percutantes
- Emojis ponctuels (pas excessifs)
- Tournures negatives → positives ("Fini les excuses", "Plus de ghosting", "Zero prise de tete")
- Probleme → Solution en 1 phrase
- Chiffres concrets ("30 secondes", "2 clics", "+2 000 gamers")

**Personality:** Authentique, gamer, direct, fun mais serieux sur la fiabilite, zero bullshit

**Phrases signatures:**
- "Fini les excuses"
- "Tes potes confirment en 2 clics"
- "Plus personne ne ghost"
- "Tu joues ce soir"
- "Zero prise de tete"
- "Gratuit, sans piege"
- "En 30 secondes"

---

## Proof Points

**Metrics:**
- +2 000 gamers inscrits
- 30 secondes pour creer une squad
- Score de fiabilite qui fait passer le taux de presence de ~50% a 85%+
- Lighthouse Desktop : Performance 100, Accessibilite 100, Best Practices 100, SEO 100

**Social proof (landing page):**
- 6 temoignages couvrant Valorant, LoL, Apex, Fortnite, Overwatch, Rocket League
- Chaque temoignage lie a un pain point specifique (ghosting, no-shows, sessions regulieres, vocal)

**Testimonial snippets:**
> "Avec la confirmation de presence, plus personne ne ghost. Tu dis OUI, tu viens. Ton score de fiabilite parle pour toi."

> "Passe de 'on verra demain' a 3 sessions par semaine. Le score de presence motive tout le monde a se pointer."

> "La party vocale toujours ouverte, c'est le vrai plus. Tu retrouves ta squad meme sans session prevue."

**Value themes:**

| Theme | Proof |
|-------|-------|
| Fiabilite | Score de fiabilite unique, check-in, rappels push — taux de presence 50% → 85%+ |
| Simplicite | 30 secondes pour creer, 2 clics pour confirmer, code invite pour rejoindre |
| Gaming-first | 12 jeux supportes, terminologie gaming, party vocale integree, gamification XP/badges |
| Gratuit | Calendrier illimite, confirmations, notifs push — tout l'essentiel gratuit |
| Securite | Donnees hebergees en France, chiffrement SSL, RGPD, paiement Stripe |

---

## Goals

**Business goal:** Devenir l'app de reference pour l'organisation gaming en France, puis en Europe francophone. Atteindre 10 000 gamers actifs et un MRR de 10K EUR via conversions freemium → Premium/Squad Leader.

**Conversion action:** Inscription gratuite → Creation de squad → Invitation des potes → Premiere session planifiee → Upgrade Premium (apres decouverte de la valeur)

**Current metrics:**
- +2 000 gamers inscrits
- 62 pages deployees (dont 24 pages SEO /games + /lfg, 4 pages alternatives, 3 articles blog)
- 4 langues (FR, EN, DE, ES)
- 4 plans tarifaires (Gratuit, Premium, Squad Leader, Club)
- Programme ambassadeur actif (streamers Twitch/YouTube, 20% commission)
- Programme de parrainage (7 jours Premium + 500 XP par filleul)

---

## Key Pages & Content Architecture

**Landing (/):** Hero problem-focused → Social proof → Problem section → How it works (4 etapes) → 3 piliers (Planning, Vocal, Fiabilite) → Temoignages → Pricing → FAQ → CTA final

**SEO (/games/:game):** "Planifie tes sessions [JEU] avec ta squad" — 12 jeux couverts (Valorant, LoL, Fortnite, Rocket League, CS2, Apex, Minecraft, FIFA, CoD, Overwatch 2, Destiny 2, GTA Online)

**LFG (/lfg/:game):** "Cherche des joueurs [JEU] fiables pour ta squad" — 12 pages miroir

**Alternatives (/alternative/*):** Pages de migration Guilded (avec code GUILDED30), GamerLink, Discord Events — comparaisons detaillees

**Blog (/blog):** 3 articles guides (alternatives Guilded, organiser tournoi, anti-ghosting) — contenu SEO + educatif

**Premium (/premium):** "Passe au niveau superieur" — 4 tiers, comparatif features, essai 7 jours, temoignages, FAQ, trust badges

**Ambassador (/ambassador):** "Monetise ta communaute gaming" — 20% commission, Squad Leader a vie, formulaire de candidature
