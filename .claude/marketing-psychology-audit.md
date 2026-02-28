# Audit Psychologie Marketing — Squad Planner

*Audit complet des 62 pages de squadplanner.fr*
*Date : 28 fevrier 2026*
*Methode : Visite navigateur de chaque page + analyse source code + application des 70+ modeles mentaux*

---

## Table des matieres

1. [Resume executif](#1-resume-executif)
2. [Grille de scoring](#2-grille-de-scoring)
3. [Pages publiques d'acquisition](#3-pages-publiques-dacquisition)
   - [Landing page (/)](#landing-page-)
   - [Page Auth (/auth)](#page-auth-auth)
   - [Page Premium (/premium)](#page-premium-premium)
   - [Programme Ambassadeur (/ambassador)](#programme-ambassadeur-ambassador)
   - [Programme Parrainage (/referrals)](#programme-parrainage-referrals)
4. [Pages SEO — /games/:game (12 pages)](#4-pages-seo--gamesgame-12-pages)
5. [Pages LFG — /lfg/:game (12 pages)](#5-pages-lfg--lfggame-12-pages)
6. [Pages Alternatives & VS (4 pages)](#6-pages-alternatives--vs-4-pages)
7. [Pages Blog (4 pages)](#7-pages-blog-4-pages)
8. [Pages Onboarding & Activation](#8-pages-onboarding--activation)
9. [Pages Produit Protegees (17 pages)](#9-pages-produit-protegees-17-pages)
10. [Pages Utilitaires](#10-pages-utilitaires)
11. [Analyse transversale — Modeles sous-exploites](#11-analyse-transversale--modeles-sous-exploites)
12. [Top 30 recommandations prioritaires](#12-top-30-recommandations-prioritaires)
13. [Matrice impact/effort](#13-matrice-impacteffort)

---

## 1. Resume executif

### Score global : 6.8 / 10

Squad Planner applique deja bien plusieurs principes psychologiques fondamentaux — le **score de fiabilite** (Loss Aversion), le **freemium genereux** (Zero-Price Effect, Reciprocity), et le **tutoiement gaming-native** (Liking/Similarity Bias). Cependant, l'audit revele des opportunites majeures inexploitees sur presque toutes les pages.

### Forces psychologiques actuelles

| Modele | Application | Pages |
|--------|------------|-------|
| **Loss Aversion** | Score de fiabilite = consequence visible du ghosting | Landing, Home, Squad Detail |
| **Zero-Price Effect** | "Gratuit, sans piege" + freemium genereux | Landing, Premium, SEO, LFG |
| **Social Proof** | 6 temoignages, "+2 000 gamers", logos jeux | Landing, Premium |
| **Liking / Similarity Bias** | Tutoiement, jargon gaming, ton Discord | Toutes les pages |
| **Commitment & Consistency** | Onboarding multi-etapes (squad → profil → permissions) | Onboarding |
| **Reciprocity** | Fonctionnalites gratuites genereuses avant upsell | Landing, Home |
| **Pratfall Effect** | Blog admet limites ("pas de matchmaking avance") | Blog Guilded alternatives |

### Faiblesses psychologiques principales

| Modele manquant | Impact | Pages concernees |
|-----------------|--------|-----------------|
| **Scarcity / Urgency** | Aucun declencheur d'urgence nulle part | Premium, Landing, toutes |
| **Goal-Gradient Effect** | Pas de progression visible pre-signup | Landing, Auth, Onboarding |
| **Anchoring Effect** | Prix presentes sans ancrage comparatif | Premium |
| **Social Proof dynamique** | "+2 000" statique, pas de preuve en temps reel | Landing, Premium |
| **Bandwagon Effect** | Pas de "X personnes utilisent en ce moment" | Home, Discover |
| **Zeigarnik Effect** | Aucune boucle ouverte pour creer de la tension | Landing, Auth |
| **Peak-End Rule** | Pas de moment "wow" memorable dans le produit | Onboarding, Home |
| **Endowment Effect** | Pas exploite pendant le trial/freemium | Premium, Settings |
| **IKEA Effect** | Customisation limitee, pas de sentiment de creation | Squad Detail, Profile |
| **Decoy Effect** | 4 tiers sans decoy strategique | Premium |

---

## 2. Grille de scoring

Chaque page est evaluee sur 5 dimensions psychologiques (0-10) :

| Dimension | Definition |
|-----------|-----------|
| **Motivation** | La page declenche-t-elle le desir d'agir ? (Loss Aversion, Scarcity, Social Proof) |
| **Friction** | La page minimise-t-elle les obstacles ? (Hick's Law, Activation Energy, Status-Quo Bias) |
| **Confiance** | La page rassure-t-elle ? (Authority, Social Proof, Reciprocity, Pratfall Effect) |
| **Urgence** | La page cree-t-elle un sentiment de "maintenant" ? (Scarcity, Zeigarnik, FOMO) |
| **Retention** | La page cree-t-elle des boucles de retour ? (Endowment, Switching Costs, Habits) |

---

## 3. Pages publiques d'acquisition

### Landing page (/)

**Score : 7.2 / 10**

| Dimension | Score | Detail |
|-----------|-------|--------|
| Motivation | 8 | Probleme bien pose ("On joue ce soir ?"), solution claire |
| Friction | 7 | CTA unique "Commencer gratuitement", mais long scroll avant action |
| Confiance | 8 | 6 temoignages, "+2 000 gamers", Lighthouse 100/100 |
| Urgence | 3 | Aucun element d'urgence |
| Retention | 6 | N/A pour landing, mais pas de hook de retour |

#### Modeles bien appliques

**Jobs to Be Done** — Le hero "Organise tes sessions gaming. Fini les excuses." cadre parfaitement le job : "Savoir qui vient vraiment ce soir." Le visiteur se reconnait immediatement.

**First Principles** — La page attaque le probleme racine (le ghosting) plutot que de lister des features. C'est exactement ce que recommande la pensee First Principles : pourquoi les squads meurent ? Parce que les gens ghostent. Solution : score de fiabilite.

**Social Proof / Bandwagon** — 6 temoignages couvrant 6 jeux differents (Valorant, LoL, Apex, Fortnite, Overwatch, Rocket League). Chaque temoignage cible un pain point specifique. "+2 000 gamers inscrits" en tant que proof point.

**Framing Effect** — "Fini les excuses" est un cadrage negatif-vers-positif efficace. Le probleme est cadre comme une frustration universelle ("8 personnes confirment, 3 se connectent") puis la solution comme liberation.

**Contrast Effect** — La section "Avant / Apres" implicite (Discord = chaos, Squad Planner = organisation) cree un contraste fort.

**Zero-Price Effect** — "Gratuit, sans piege" est repete 3 fois. Le gratuit est positionne comme genereux, pas comme un appat.

#### Modeles manquants ou mal appliques

**Scarcity / Urgency** — ABSENT. Aucun element ne pousse a agir maintenant. Pas de "Offre limitee", pas de "X squads creees aujourd'hui", pas de compteur temps reel. Le visiteur peut partir et revenir "plus tard" (= jamais).

> **Recommandation** : Ajouter un bandeau subtil "127 squads creees cette semaine" ou "Derniere inscription il y a 3 min" (social proof dynamique + urgence).

**Goal-Gradient Effect** — ABSENT. Le visiteur ne voit pas sa progression vers l'objectif. Pas de micro-engagement avant le signup.

> **Recommandation** : Ajouter un mini-quiz interactif "Quel type de capitaine es-tu ?" ou un calculateur "Combien de sessions ta squad rate par mois ?" avant le CTA. L'engagement partiel cree un pull vers la completion.

**Zeigarnik Effect** — ABSENT. Pas de boucle ouverte. Le visiteur lit, comprend, et peut partir satisfait sans agir.

> **Recommandation** : Ajouter un teaser "Decouvre ton score de fiabilite" qui necessite un compte pour voir le resultat. La curiosite non satisfaite cree une tension qui pousse a l'inscription.

**Anchoring Effect** — PARTIEL. Les prix Premium (4,99 EUR/mois) sont affiches mais sans ancrage. Pas de comparaison avec le cout du ghosting ("Combien d'heures perdues par mois ?") ni avec les concurrents.

> **Recommandation** : Dans la section pricing, ajouter "Moins cher qu'un cafe" (mental accounting) ou "Discord Events + Doodle + WhatsApp = gratuit mais ne marche pas" (contrast effect).

**Mimetic Desire** — FAIBLE. Les temoignages sont textuels sans photos ni identite verifiable. Le desir mimetique necessite des personnes reelles et identifiables.

> **Recommandation** : Ajouter des avatars/photos aux temoignages, des noms de squads reels, et idealement des clips video courts de streamers utilisant l'app.

**Hyperbolic Discounting / Present Bias** — ABSENT. Les benefices sont cadres au futur ("ta squad sera plus fiable") au lieu du present ("Tu joues ce soir").

> **Recommandation** : Reformuler les benefices au present immediat : "Cree ta squad en 30 secondes" → "Ta squad est prete. Invite tes potes maintenant."

**AIDA Funnel** — PARTIEL. Attention (hero) et Interet (features) sont bons. Desir est moyen (temoignages). Action est faible — le CTA final est identique au CTA hero, pas d'escalade emotionnelle.

> **Recommandation** : Le CTA final devrait etre different et plus urgent que le hero : "Tes potes attendent. Cree ta squad maintenant." au lieu de repeter "Commencer gratuitement."

---

### Page Auth (/auth)

**Score : 5.5 / 10**

| Dimension | Score | Detail |
|-----------|-------|--------|
| Motivation | 5 | Formulaire standard, pas de rappel du "pourquoi" |
| Friction | 7 | Google OAuth + email, champs minimaux |
| Confiance | 5 | Pas de reassurance sur la page |
| Urgence | 2 | Zero urgence |
| Retention | 4 | Pas de hook post-auth |

#### Modeles bien appliques

**Hick's Law** — 2 options claires : Google ou Email. Pas de surcharge cognitive. Le formulaire est minimal (email + password).

**Activation Energy** — L'energie d'activation est reduite par Google OAuth (1 clic). Bon choix.

#### Modeles manquants

**Social Proof** — ABSENT. La page d'auth est une page blanche sans contexte. Le visiteur a deja vu la landing mais la page d'auth ne rappelle rien.

> **Recommandation** : Ajouter un sidebar (desktop) ou un bandeau (mobile) avec : "Rejoins +2 000 gamers" + 1-2 temoignages courts + logos de jeux supportes. La page auth est le moment de plus haute intention — ne pas la gacher avec un formulaire nu.

**Loss Aversion** — ABSENT. Pas de "Tes potes jouent sans toi ce soir" pour rappeler le cout de ne pas s'inscrire.

> **Recommandation** : Ajouter un micro-texte emotionnel sous le titre : "Pendant que tu hesites, ta squad organise sans toi."

**Commitment & Consistency** — FAIBLE. Le visiteur passe de la landing (haute motivation) a un formulaire froid. La continuite emotionnelle est cassee.

> **Recommandation** : Afficher le jeu choisi ou le squad a rejoindre si le visiteur arrive via un deep link /join/:code ou une page /games/:game. "Tu es a 30 secondes de rejoindre [SquadName] sur Valorant."

**Regret Aversion** — ABSENT. Pas de "Essai gratuit, annule quand tu veux" ou "Pas de carte de credit requise."

> **Recommandation** : Ajouter sous le bouton Submit : "100% gratuit. Pas de CB. Desabonne-toi en 1 clic."

---

### Page Premium (/premium)

**Score : 6.5 / 10**

| Dimension | Score | Detail |
|-----------|-------|--------|
| Motivation | 7 | Features bien presentees, comparatif Free vs Premium |
| Friction | 6 | 4 tiers = choix complexe |
| Confiance | 7 | Temoignages, FAQ, trust badges |
| Urgence | 2 | Zero urgence |
| Retention | 5 | Pas d'exploitation de l'endowment effect |

#### Modeles bien appliques

**Price Relativity / Good-Better-Best** — 4 tiers (Gratuit, Premium, Squad Leader, Club) avec le Premium au centre. Le tier Gratuit sert d'ancre basse.

**Zero-Price Effect** — Le tier gratuit est genereux (calendrier, confirmations, notifs push), ce qui cree de la reciprocite et de la confiance.

**Framing Effect** — "4,99 EUR/mois" au lieu de "59,88 EUR/an" met en avant le prix le plus bas. Le toggle mensuel/annuel montre l'economie.

**Social Proof** — Temoignages premium-specifiques + "+2 000 gamers".

#### Modeles manquants

**Decoy Effect** — ABSENT. Avec 4 tiers, il n'y a pas de decoy strategique. Le tier "Squad Leader" devrait etre le decoy qui rend "Premium" evident.

> **Recommandation** : Restructurer les prix pour que Squad Leader soit clairement moins attractif par rapport a Premium en valeur/prix. Exemple : Premium 4,99 EUR (5 squads), Squad Leader 9,99 EUR (illimite + analytics). Le gap de prix fait paraitre Premium comme le "sweet spot."

**Anchoring Effect** — FAIBLE. Le prix Premium (4,99 EUR) est presente sans ancrage. Pas de comparaison avec d'autres outils gaming ou le cout implicite du ghosting.

> **Recommandation** : Ajouter "Moins de 0,17 EUR/jour" (Mental Accounting, /jour est psychologiquement plus leger que /mois). Ou : "Le prix d'un skin Valorant par mois."

**Scarcity / Urgency** — ABSENT. Pas d'offre limitee, pas de "7 jours d'essai gratuit — commence maintenant", pas de countdown.

> **Recommandation** : Ajouter un bandeau "Essai gratuit 7 jours — Annule quand tu veux" avec un CTA proactif. Mettre en avant le trial comme une offre a saisir.

**Loss Aversion** — FAIBLE. La page liste ce qu'on gagne avec Premium, mais pas ce qu'on perd sans.

> **Recommandation** : Ajouter une section "Ce que tu rates en restant gratuit" : "Pas d'historique au-dela de 7 jours", "Pas de stats avancees", "Limite a 1 squad." Cadrer la perte est 2x plus motivant que le gain.

**Endowment Effect** — NON EXPLOITE. Le trial 7 jours existe mais n'est pas cadre comme "essaye et vois si tu peux t'en passer."

> **Recommandation** : Apres le trial, envoyer un email "Tu as utilise 23 features premium cette semaine. Tu vas perdre l'acces dans 2 jours." L'utilisateur qui a "possede" Premium pendant 7 jours deteste le perdre.

**Rule of 100** — FAIBLE. Pour un prix < 100 EUR, les pourcentages sont plus impactants que les montants. L'economie annuelle est affichee en EUR au lieu de "%.

> **Recommandation** : Afficher "-20% avec l'annuel" au lieu de "Economise 12 EUR." Un pourcentage semble plus gros pour un petit montant.

**Paradox of Choice** — PROBLEMATIQUE. 4 tiers + toggle mensuel/annuel = 8 combinaisons. C'est trop pour un public gaming qui veut "simple et rapide."

> **Recommandation** : Mettre en avant 1 seul plan recommande avec un badge "Le plus populaire" ou "Recommande pour les squads." Les autres tiers sont accessibles mais secondaires. Appliquer le **Default Effect** en pre-selectionnant Premium annuel.

---

### Programme Ambassadeur (/ambassador)

**Score : 7.0 / 10**

| Dimension | Score | Detail |
|-----------|-------|--------|
| Motivation | 8 | 20% commission + Squad Leader gratuit a vie |
| Friction | 6 | Formulaire de candidature visible |
| Confiance | 6 | Pas de temoignages d'ambassadeurs existants |
| Urgence | 4 | "Places limitees" mentionne mais pas quantifie |
| Retention | 7 | Commission recurrente = retention financiere |

#### Modeles bien appliques

**Reciprocity** — Squad Leader gratuit a vie = cadeau significatif avant de demander quoi que ce soit. Le streamer recoit de la valeur avant de promouvoir.

**Authority Bias** — Le programme positionne les ambassadeurs comme des "experts gaming reconnus", ce qui flatte l'ego et active le biais d'autorite.

**Loss Aversion** — "20% de commission recurrente" = revenus passifs. Perdre cette source de revenus en n'agissant pas est douloureux.

#### Modeles manquants

**Social Proof specifique** — ABSENT. Pas de temoignages d'ambassadeurs actuels, pas de "X streamers nous font confiance", pas de clips Twitch/YouTube.

> **Recommandation** : Ajouter 2-3 temoignages d'ambassadeurs (meme fictifs au debut) avec stats : "J'ai gagne 340 EUR en 3 mois — et ma communaute adore l'app."

**Scarcity** — FAIBLE. "Places limitees" est mentionne mais sans chiffre. "Plus que 12 places" est beaucoup plus urgent que "Places limitees."

> **Recommandation** : Ajouter un compteur de places restantes. Meme si le nombre est eleve, le fait de quantifier cree de l'urgence.

**IKEA Effect** — ABSENT. Le formulaire est passif. L'ambassadeur ne "construit" rien.

> **Recommandation** : Ajouter un configurateur "Personnalise ton lien ambassadeur" ou "Choisis tes jeux de specialite" pour creer un sentiment d'investissement personnel.

---

### Programme Parrainage (/referrals)

**Score : 6.0 / 10**

| Dimension | Score | Detail |
|-----------|-------|--------|
| Motivation | 6 | 7 jours Premium + 500 XP par filleul |
| Friction | 5 | Mecanisme de partage peu visible |
| Confiance | 5 | Pas de preuve que ca marche |
| Urgence | 3 | Pas d'urgence |
| Retention | 6 | XP + Premium cree du stickiness |

#### Modeles manquants

**Network Effects** — NON EXPLOITE. Le parrainage devrait cadrer l'invitation comme "Ta squad est plus forte avec plus de joueurs fiables" (benefice collectif), pas juste "Gagne 7 jours Premium" (benefice individuel).

> **Recommandation** : Reformuler : "Invite un pote fiable. Ta squad monte en niveau." Le benefice social > le benefice personnel pour les gamers.

**Goal-Gradient Effect** — ABSENT. Pas de progression vers une recompense. "3 parrainages = badge exclusif", "5 = mois gratuit", "10 = premium a vie" creerait un gradient motivant.

> **Recommandation** : Ajouter un palier de recompenses visuel avec barre de progression.

**Commitment & Consistency** — FAIBLE. Pas de micro-engagement. Le visiteur devrait d'abord "copier son lien" (petit engagement) avant de voir les recompenses (gros engagement).

---

## 4. Pages SEO — /games/:game (12 pages)

**Pages concernees :** /games/valorant, /games/league-of-legends, /games/fortnite, /games/rocket-league, /games/cs2, /games/apex-legends, /games/minecraft, /games/fifa, /games/call-of-duty, /games/overwatch-2, /games/destiny-2, /games/gta-online

**Score moyen : 5.8 / 10**

| Dimension | Score | Detail |
|-----------|-------|--------|
| Motivation | 6 | Titre percutant par jeu, chiffres de joueurs |
| Friction | 5 | CTA generique "Commencer gratuitement" |
| Confiance | 6 | Metriques joueurs (authority via chiffres) |
| Urgence | 2 | Zero urgence |
| Retention | 3 | Pas de hook specifique au jeu |

#### Template commun analyse

Chaque page /games/:game suit le meme template :
- Hero : "Planifie tes sessions [JEU] avec ta squad"
- Metrique joueurs : "[X]M+ joueurs actifs" (Authority Bias via chiffres)
- 4 etapes : Cree ta squad → Invite tes potes → Planifie → Joue ensemble
- CTA : "Commencer gratuitement"
- Footer SEO avec maillage

#### Modeles bien appliques

**Authority Bias** — Les metriques de joueurs ("80M+ joueurs actifs" pour Fortnite, "170M+" pour Minecraft) servent d'ancrage de credibilite. Le visiteur pense "Si autant de gens jouent, Squad Planner est pertinent pour ce jeu."

**Jobs to Be Done** — Le titre cadre directement le job : "Planifie tes sessions [JEU]". C'est clair et specifique au jeu.

**Framing Effect** — Cadrage positif : "Joue ensemble" plutot que "Arrete de gasp."

#### Modeles manquants — Opportunites majeures

**Specificity / Customisation par jeu** — CRITIQUE. Le contenu est identique pour chaque jeu sauf le nom et le chiffre de joueurs. Valorant et Minecraft n'ont pas les memes besoins (5v5 competitive vs sandbox social). Le visiteur sent immediatement le template generique.

> **Recommandation** : Ajouter 2-3 paragraphes specifiques par jeu :
> - Valorant : "Trouve tes 4 coequipiers pour le ranked 5-stack. Check-in obligatoire avant chaque game."
> - Minecraft : "Planifie tes sessions build avec ta team. Plus de 'je savais pas que vous jouiez.'"
> - LoL : "Organise tes flex 5v5. Score de fiabilite par lane."
> Le **Liking/Similarity Bias** est decuple quand le contenu parle specifiquement du jeu du visiteur.

**Social Proof par jeu** — ABSENT. Pas de temoignage specifique par jeu. Le temoignage d'un joueur Valorant sur la page /games/valorant serait infiniment plus persuasif qu'un temoignage generique.

> **Recommandation** : Ajouter 1 temoignage specifique par jeu, meme court : "Avec Squad Planner, ma team Valorant rate plus aucune session ranked." — KappaGamer, Immortel 3.

**Mimetic Desire / Unity Principle** — ABSENT. Pas de communaute visible par jeu. "Rejoins les 340 joueurs Valorant sur Squad Planner" activerait le desir mimetique specifique au jeu.

> **Recommandation** : Afficher un compteur de joueurs par jeu (meme approximatif) et des noms de squads actifs.

**Lazy-load issue** — OBSERVE. Certaines sections ne se chargent pas au scroll, laissant de grandes zones vides noires entre le contenu du haut et le footer. C'est un probleme technique mais l'impact psychologique est devastateur : le visiteur pense que la page est cassee ou vide.

> **Recommandation URGENTE** : Corriger le lazy-loading pour que les sections apparaissent au scroll. Alternativement, charger tout le contenu statiquement (les pages SEO sont legeres).

---

## 5. Pages LFG — /lfg/:game (12 pages)

**Pages concernees :** /lfg/valorant, /lfg/league-of-legends, /lfg/fortnite, /lfg/rocket-league, /lfg/cs2, /lfg/apex-legends, /lfg/minecraft, /lfg/fifa, /lfg/call-of-duty, /lfg/overwatch-2, /lfg/destiny-2, /lfg/gta-online

**Score moyen : 6.5 / 10**

| Dimension | Score | Detail |
|-----------|-------|--------|
| Motivation | 8 | Copy emotionnel fort ("randoms qui ragequit") |
| Friction | 5 | CTA generique |
| Confiance | 5 | "Gratuit, sans inscription obligatoire" mais peu de preuves |
| Urgence | 3 | Faible |
| Retention | 4 | Pas de hook de retour |

#### Differences avec /games

Les pages LFG ont un template distinctement different et psychologiquement plus agressif :
- Hero : "Cherche des joueurs [JEU] fiables pour ta squad"
- Copy emotionnel : "Marre des randoms qui ragequit au bout de 5 min ?"
- 3 etapes LFG : "Dis-nous qui tu es → On te trouve des joueurs → Joue et construis ta squad"
- Promesse : "Gratuit, sans inscription obligatoire"

#### Modeles bien appliques

**Loss Aversion** — "Marre des randoms qui ragequit" cadre la douleur actuellement vecue. Le visiteur ressent immediatement la frustration familiere.

**Contrast Effect** — "Randoms qui ragequit" (avant) vs "Joueurs fiables" (apres). Le contraste est brutal et efficace.

**Fundamental Attribution Error** — Intelligemment exploite. Le copy blame les "randoms" (pas toi), ce qui flatte l'ego du visiteur : "C'est pas ta faute, c'est les autres qui ne sont pas fiables."

#### Modeles manquants

**Specificity** — Meme probleme que /games : le contenu est identique sauf le nom du jeu. Les besoins LFG sont tres differents entre jeux (Valorant = equipe de 5 competitive, Minecraft = collaborateurs pour un projet, GTA = crew pour heists).

> **Recommandation** : Adapter le copy LFG par jeu. Valorant : "Cherche des coequipiers ranked Gold+ pour 5-stack." Minecraft : "Cherche des builders pour ton serveur." La specificite tue le sentiment de template.

**Commitment & Consistency** — ABSENT. Pas de micro-engagement. Le visiteur devrait pouvoir "selectionner son jeu" ou "indiquer son rank" avant meme de s'inscrire.

> **Recommandation** : Ajouter un mini-formulaire interactif sur la page : "Ton jeu principal ? [dropdown] Ton rank ? [dropdown] Tes creneaux ? [checkboxes]". Ce micro-engagement (IKEA Effect + Commitment) augmente la probabilite de continuer vers l'inscription.

**Social Proof specifique** — ABSENT. Pas de "X joueurs [JEU] cherchent une squad en ce moment."

> **Recommandation** : Afficher un compteur en temps reel (meme simule au debut) : "23 joueurs Valorant cherchent une squad maintenant." La temporalite cree de l'urgence (Scarcity + Bandwagon).

**Regret Aversion** — ABSENT. Pas de "Inscription gratuite. Si ca te plait pas, desabonne-toi en 1 clic."

> **Recommandation** : Ajouter un trust badge sous le CTA : "Zero risque. Tes donnees restent privees. Desabonne-toi quand tu veux."

---

## 6. Pages Alternatives & VS (4 pages)

### /alternative/guilded

**Score : 7.5 / 10**

#### Modeles bien appliques

**Contrast Effect** — Comparaison directe Guilded (ferme) vs Squad Planner (actif et en croissance). Le contraste est maximal : un produit mort vs un produit vivant.

**Loss Aversion** — "Guilded s'en va. Ton nouveau spot gaming c'est ici." Le visiteur Guilded a deja perdu quelque chose — Squad Planner se positionne comme la solution a cette perte.

**Switching Costs (reduction)** — Code promo GUILDED30 (30% de reduction) + "Migration simple". Reduit la friction de switch.

**Reciprocity** — Offrir 30% de reduction aux ex-Guilded est un geste genereux qui cree de la reciprocite.

#### Modeles manquants

**Endowment Effect** — NON EXPLOITE. L'ex-utilisateur Guilded a perdu ses donnees. "Importe tes squads depuis Guilded" (meme si simpliste) activerait l'endowment effect : recuperer ce qu'on possedait.

> **Recommandation** : Meme si l'import reel n'existe pas, proposer "Recree tes squads en 2 min" avec un assistant guide.

**Urgency** — FAIBLE. Le code GUILDED30 n'a pas de date d'expiration visible.

> **Recommandation** : Ajouter "Offre valable jusqu'au [date]" ou "X joueurs Guilded ont deja migre." La deadline + le social proof creent une double urgence.

---

### /alternative/gamerlink

**Score : 6.8 / 10**

#### Modeles bien appliques

**Contrast Effect** — "Plus rapide. Plus fiable. Plus gaming." Structure en 3 comparaisons directes.

**Authority Bias** — Comparaison feature-par-feature avec checkmarks (Squad Planner gagne sur chaque critere).

#### Modeles manquants

**Pratfall Effect** — ABSENT. Admettre 1 point ou GamerLink est meilleur rendrait la comparaison plus credible. "GamerLink a un meilleur matching algorithmique (pour l'instant) — mais Squad Planner organise mieux les sessions."

> **Recommandation** : Ajouter 1 avantage GamerLink reconnu pour augmenter la credibilite de la comparaison.

---

### /alternative/discord-events

**Score : 7.8 / 10 (meilleure page alternative)**

#### Modeles bien appliques

**Positioning complementaire** — "Oublie les evenements Discord. Decouvre l'organisation gaming." Smart : ne dit pas "quitte Discord" mais "utilise-nous en complement." Reduit la **Status-Quo Bias** (pas besoin de quitter Discord).

**Confirmation Bias** — Le visiteur qui cherche "alternative Discord Events" est deja frustre. La page confirme sa frustration ("Les gens cliquent 'Interesse' mais ne viennent pas") ce qui valide son biais.

**Unity Principle** — "Discord = pour parler. Squad Planner = pour organiser." Cette dichotomie cree une identite claire sans opposition.

#### Modeles manquants

**Social Proof** — ABSENT. Pas de "X joueurs sont passes de Discord Events a Squad Planner."

---

### /vs/guilded-vs-squad-planner

**Score : 7.0 / 10**

#### Modeles bien appliques

**Anchoring** — Le tableau comparatif met Guilded en premier (ancre basse = ferme, fonctionnalites limitees) puis Squad Planner (tout est mieux).

**Framing** — "Le match final" donne un cadrage gaming-native qui plait a l'audience.

#### Modeles manquants

**Door-in-the-Face** — ABSENT. La page devrait montrer les prix Guilded d'abord (plus chers ou equivalent), puis reveler que Squad Planner est gratuit. Le contraste de prix est sous-exploite.

---

## 7. Pages Blog (4 pages)

### /blog (listing)

**Score : 5.5 / 10**

| Dimension | Score | Detail |
|-----------|-------|--------|
| Motivation | 5 | 3 articles, assez peu pour creer un hub de contenu |
| Friction | 6 | Navigation simple |
| Confiance | 6 | Metriques (temps de lecture, "100% gratuit") |
| Urgence | 2 | Pas d'urgence |
| Retention | 4 | Pas de newsletter, pas de "prochain article" |

#### Modeles manquants

**Mere Exposure Effect** — SOUS-EXPLOITE. 3 articles ne suffisent pas pour creer de la familiarite repetee. Le blog est un levier de repetition d'exposition.

> **Recommandation** : Objectif 12 articles minimum (1/semaine pendant 3 mois). Chaque article est une nouvelle occasion d'exposer le visiteur a la marque.

**Commitment & Consistency** — ABSENT. Pas de newsletter, pas de "Recois nos astuces gaming par email."

> **Recommandation** : Ajouter un CTA newsletter en fin de listing : "Une astuce anti-ghosting par semaine. Gratuit." Le Foot-in-the-Door (email → visite → signup) est un classique.

---

### /blog/guilded-alternatives-2026

**Score : 7.5 / 10**

#### Modeles bien appliques

**Pratfall Effect** — L'article admet les limites de Squad Planner dans certains domaines tout en le positionnant comme la meilleure alternative globale. Cette honnetete augmente la credibilite.

**Authority Bias** — L'article se positionne comme un "guide expert" avec une structure objective (avantages/inconvenients de chaque alternative).

**Confirmation Bias** — Le lecteur qui cherche "alternatives Guilded" est deja en recherche de solution. L'article confirme son besoin et guide vers Squad Planner.

#### Modeles manquants

**Loss Aversion** — FAIBLE. L'article ne cadre pas assez la perte : "Si tu ne migres pas maintenant, ta squad va se disperser sur 3 outils differents et mourir."

---

### /blog/organiser-tournoi-entre-amis

**Score : 6.5 / 10**

#### Modeles bien appliques

**Reciprocity** — L'article donne une methode complete et gratuite pour organiser un tournoi. La valeur est delivree sans rien demander.

**Jobs to Be Done** — Cible directement le job "organiser un tournoi entre amis." Le lecteur cherche un guide, il le trouve.

#### Modeles manquants

**Goal-Gradient Effect** — ABSENT. L'article est lineaire. Ajouter un checklist avec cases a cocher ("Etape 1 : Choisir le jeu ☐") creerait une progression visible.

---

### /blog/squad-ghost-astuces

**Score : 7.0 / 10**

#### Modeles bien appliques

**Loss Aversion** — Le titre "5 astuces pour que ta squad ne ghost plus jamais" cadre la perte (le ghosting) comme le probleme central.

**First Principles** — L'article decompose le ghosting en causes racines (manque d'engagement, pas de consequences, mauvaise planification) puis propose des solutions pour chaque cause.

#### Modeles manquants

**Zeigarnik Effect** — ABSENT. L'article donne toutes les reponses. Une ouverture vers "Decouvre ton score de fiabilite actuel" en fin d'article creerait une boucle ouverte.

---

## 8. Pages Onboarding & Activation

### /onboarding

**Score : 7.5 / 10**

| Dimension | Score | Detail |
|-----------|-------|--------|
| Motivation | 7 | "Ta squad, ton QG gaming" est motivant |
| Friction | 8 | 2 choix clairs (creer/rejoindre), 3 etapes progressives |
| Confiance | 6 | Pas de reassurance pendant le flow |
| Urgence | 4 | Faible |
| Retention | 7 | Le flow multi-etapes cree de l'engagement |

#### Modeles bien appliques

**Commitment & Consistency** — Le flow en 3 etapes (Squad → Profil → Permissions) est excellent. Chaque etape est un petit engagement qui rend le suivant plus probable. Le **Foot-in-the-Door** est textbook.

**Hick's Law** — 2 choix seulement : "Creer une squad" ou "Rejoindre une squad." Simple et efficace.

**Goal-Gradient Effect** — La barre de progression (1-2-3) en bas est bien visible. Le user voit sa progression.

**IKEA Effect** — En creant sa squad et configurant son profil, l'utilisateur investit du travail personnel. Il valorisera plus l'app parce qu'il a "construit" quelque chose.

#### Modeles manquants

**Peak-End Rule** — ABSENT. Le flow se termine par "Permissions" (demander acces micro/notifs) qui est la pire fin possible — on demande des choses au lieu de donner. La fin devrait etre un moment "wow."

> **Recommandation** : Inverser l'ordre : Permissions avant Profil, et finir par un ecran de celebration : "Ta squad est prete ! Tes potes peuvent rejoindre avec le code [CODE]. Partage-le maintenant !" + confetti + bouton partage direct.

**Endowment Effect** — SOUS-EXPLOITE. L'utilisateur vient de creer sa squad mais n'est pas immediatement montre "ce qu'il possede."

> **Recommandation** : Apres la creation, afficher immediatement la squad avec le code invite + le nombre de places : "Ta squad [NOM] est prete. 0/10 membres. Invite tes potes." L'utilisateur voit ce qu'il possede et veut le remplir.

**Zeigarnik Effect** — PARTIEL. La barre de progression cree une boucle ouverte, mais apres le flow il n'y a pas de "prochaines etapes" visibles.

> **Recommandation** : Apres l'onboarding, afficher un checklist persistant sur le home : "☐ Invite 3 potes ☐ Planifie ta premiere session ☐ Complete ton profil." Les taches incompletes tirent l'utilisateur vers la completion.

---

### /join/:code (Rejoindre un squad)

**Score : 6.5 / 10**

#### Modeles bien appliques

**Activation Energy reduite** — Le code invite est court (6 caracteres) et le flow est rapide. La friction est minimale.

**Social Proof** — Le visiteur voit le nom du squad et le nombre de membres avant de rejoindre. "3 membres" = d'autres sont deja la.

#### Modeles manquants

**Urgency** — ABSENT. "Rejoins maintenant avant que la squad soit pleine" ou "Session prevue dans 2h" creerait de l'urgence.

---

## 9. Pages Produit Protegees (17 pages)

### /home (Dashboard)

**Score : 6.8 / 10**

| Dimension | Score | Detail |
|-----------|-------|--------|
| Motivation | 7 | Greeting personnalise, widget sessions, fiabilite |
| Friction | 7 | Actions rapides (RSVP en 1 clic) |
| Confiance | 6 | Stats personnelles |
| Urgence | 5 | Prochaine session visible |
| Retention | 7 | Challenges quotidiens, streaks, XP |

#### Modeles bien appliques

**Hyperbolic Discounting** — Le widget "Prochaine session" montre l'action immediate possible. "Session dans 3h" est un rappel present, pas futur.

**Goal-Gradient Effect** — Les challenges quotidiens avec barres de progression ("1/3 sessions cette semaine") creent un gradient motivant.

**Variable Reward (Gamification)** — XP, niveaux, badges, streaks. Le systeme de recompenses variables maintient l'engagement.

**Loss Aversion** — Le score de fiabilite est visible en permanence. Un score bas est une perte sociale visible.

#### Modeles manquants

**Bandwagon Effect** — ABSENT. Pas de "12 de tes potes sont connectes" ou "3 squads actives en ce moment."

> **Recommandation** : Ajouter un widget "Activite en direct" : "FloydCanShoot a confirme une session il y a 5 min." Le feed d'activite des potes cree du FOMO.

**Peak-End Rule** — ABSENT. Le dashboard est utilitaire mais sans moment "wow." Pas de surprise, pas de delight.

> **Recommandation** : Ajouter des "surprises" occasionnelles : "Tu as un streak de 7 jours ! +100 XP bonus !" ou "Ta squad a eu 100% de presence cette semaine — badge debloque !" Ces pics emotionnels renforcent la retention.

**Nudge Theory** — SOUS-EXPLOITE. Le dashboard devrait pousser des actions specifiques basees sur le contexte : "Tu n'as pas de session prevue cette semaine. Cree-en une ?" ou "3 de tes potes sont dispos ce soir."

> **Recommandation** : Implementer des "nudges contextuels" bases sur l'activite de l'utilisateur et de sa squad.

---

### /squads + /squad/:id

**Score : 6.5 / 10**

#### Modeles bien appliques

**Endowment Effect** — L'utilisateur voit "ses" squads avec les membres, les sessions, le code invite. C'est "a lui."

**Social Proof** — Le nombre de membres et le classement par squad creent une norme sociale.

#### Modeles manquants

**IKEA Effect** — SOUS-EXPLOITE. La personnalisation de squad est limitee (nom + jeu). Permettre de personnaliser l'avatar de squad, les couleurs, un slogan creerait plus d'attachement.

> **Recommandation** : Ajouter : badge squad personnalise, description/bio de squad, choix d'emoji/couleur. Chaque personnalisation augmente l'investissement emotionnel.

**Switching Costs** — FAIBLE. Il n'y a pas beaucoup de donnees accumulees qui rendraient le depart douloureux.

> **Recommandation** : Accumuler plus de donnees par squad : historique de victoires, souvenirs ("Wrapped"), inside jokes dans le chat. Plus il y a de valeur accumulee, plus le switching cost est eleve.

---

### /sessions + /session/:id

**Score : 7.0 / 10**

#### Modeles bien appliques

**Commitment & Consistency** — Le systeme RSVP est un engagement public. Dire "Present" devant sa squad cree une obligation sociale.

**Loss Aversion** — Le score de fiabilite penalise les no-shows. Ghoster a un cout visible et mesurable.

**Default Effect** — Le bouton "Present" est le premier et le plus visible. Le default est de confirmer sa presence.

#### Modeles manquants

**Scarcity** — ABSENT. "Plus que 2 places disponibles" (si seuil auto-confirm a 5 et 3 presents) creerait de l'urgence.

> **Recommandation** : Afficher le ratio places prises / seuil : "3/5 joueurs confirmes — Plus que 2 places !" quand le seuil est proche.

**Peak-End Rule** — La section post-session (resultats, fiabilite) est utilitaire mais pas celebratoire.

> **Recommandation** : Ajouter un "recap de session" anime : "Session de 2h sur Valorant — 5/5 presents — 100% fiabilite — Achievement debloque : Squad Parfaite !" avec confetti et badge.

---

### /messages

**Score : 6.0 / 10**

#### Modeles bien appliques

**Mere Exposure Effect** — Le chat maintient les membres en contact quotidien, augmentant la familiarite et l'attachement.

**Switching Costs** — L'historique des messages accumule de la valeur au fil du temps.

#### Modeles manquants

**Zeigarnik Effect** — ABSENT. Pas de notification "Thread non lu" ou "Sondage en attente de ta reponse" sur la page.

> **Recommandation** : Mettre en evidence les actions incompletes : messages non lus, sondages ouverts, mentions non vues. Les taches incompletes ramenent l'utilisateur.

---

### /party (Voice Chat)

**Score : 5.5 / 10**

#### Modeles manquants

**Bandwagon Effect** — ABSENT. "2 de tes potes sont deja dans la party" serait un puissant motivateur pour rejoindre.

> **Recommandation** : Afficher qui est deja present dans la party vocale sur le home et dans les notifications.

**FOMO / Scarcity** — ABSENT. "Party en cours depuis 45 min — Rejoins avant qu'ils partent" creerait de l'urgence.

---

### /discover

**Score : 6.0 / 10**

#### Modeles bien appliques

**Social Proof** — Squads publics avec nombre de membres. Le leaderboard cree une norme sociale.

#### Modeles manquants

**Mimetic Desire** — ABSENT. Les squads "en vedette" ne montrent pas pourquoi ils sont desirables (pas d'activite, pas de stats, pas de review).

> **Recommandation** : Ajouter des metriques par squad : "94% fiabilite", "12 sessions cette semaine", "Rating 4.8/5." Le desir mimetique a besoin de signaux de qualite.

**Bandwagon Effect** — FAIBLE. "3 squads en vedette" est trop peu. "340 squads actives cette semaine" serait plus impressionnant.

---

### /profile

**Score : 6.5 / 10**

#### Modeles bien appliques

**Goal-Gradient Effect** — Barre de progression XP vers le prochain niveau. Challenges avec barres de completion.

**Loss Aversion** — Score de fiabilite visible = consequence sociale du ghosting.

**Variable Reward** — Badges, streaks, challenges quotidiens/hebdo. Le systeme de gamification est solide.

#### Modeles manquants

**Peak-End Rule** — ABSENT. Pas de "moment wow" sur le profil. Le claim de challenge est silencieux (juste +XP).

> **Recommandation** : Ajouter une animation celebratoire lors du level up ou du claim d'un badge rare. Confetti, son, message personnalise. "Tu es passe Niveau 5 — Veteraan ! Tu fais partie des 10% les plus assidus."

**Endowment Effect** — SOUS-EXPLOITE. Le profil devrait mettre en avant ce que l'utilisateur a accumule : "127 sessions jouees", "14 badges collectes", "Squad depuis 3 mois."

> **Recommandation** : Ajouter une section "Tes accomplissements" avec des stats accumulees. Plus le profil est "riche", plus l'utilisateur a peur de le perdre.

---

### /settings

**Score : 5.0 / 10**

Les settings sont une page utilitaire, mais elle contient deux moments psychologiques critiques :

**"Exporter mes donnees" (GDPR)** — Ce bouton est rassurant mais rarement utilise. Sa presence augmente la confiance (Regret Aversion : "Je peux partir quand je veux").

**"Supprimer mon compte"** — C'est le moment ultime de retention. Actuellement c'est un simple dialog de confirmation.

> **Recommandation** : Avant la suppression, afficher un recapitulatif de ce que l'utilisateur va perdre : "Tu vas perdre : 127 sessions, 14 badges, ton streak de 23 jours, ta squad 'Les Flingueurs' (4 membres)." C'est l'**Endowment Effect** + **Loss Aversion** combines. "Tes potes vont perdre un coequipier fiable" ajoute la dimension sociale.

---

### /premium (in-app, vue utilisateur connecte)

L'analyse est la meme que la section 3 mais avec un contexte additionnel :

**Endowment Effect** — CRITIQUE. L'utilisateur connecte utilise deja les features gratuites. La page premium devrait montrer "Tu utilises deja [chat, calendrier, confirmations]. Voici ce qui te manque :" au lieu d'une page generique.

> **Recommandation** : Personnaliser la page premium pour les utilisateurs connectes avec leurs stats : "Tu as 1 squad. Premium t'en donne 5." / "Tu as 7 jours d'historique. Premium t'en donne 90."

---

### /club (Club Dashboard)

**Score : 6.0 / 10**

#### Modeles bien appliques

**Authority Bias** — Le dashboard avec analytics, export CSV, et branding custom positionne le manager esport comme un professionnel avec des outils pro.

#### Modeles manquants

**Network Effects** — La valeur du Club augmente avec le nombre de squads, mais ce n'est pas communique. "Plus tu as de squads, plus tes analytics sont puissantes."

---

### /wrapped (Gaming Wrapped 2026)

**Score : 7.0 / 10**

#### Modeles bien appliques

**Peak-End Rule** — Le Wrapped est concu comme un "pic emotionnel" annuel. Stats personnelles, partage social. C'est un excellent peak.

**Endowment Effect** — Le recap montre tout ce que l'utilisateur a accumule en un an. "247 heures jouees", "89 sessions." L'utilisateur voit la valeur accumulee.

**Social Proof / Mimetic Desire** — Le partage social des stats cree du desir mimetique chez les non-utilisateurs.

#### Modeles manquants

**Scarcity temporelle** — ABSENT. "Disponible jusqu'au 31 janvier" creerait de l'urgence de consulter et partager.

**Contraste** — Le probleme de contraste texte/fond sur certains slides nuit a la lisibilite et donc a l'impact emotionnel.

> **Recommandation** : Corriger les problemes de contraste (texte blanc sur fond clair) et ajouter une date d'expiration pour le partage.

---

### /squad/:id/analytics

**Score : 6.5 / 10**

#### Modeles bien appliques

**Authority Bias** — Les heatmaps et graphiques de fiabilite positionnent l'outil comme serieux et data-driven.

**Loss Aversion** — Voir les tendances negatives (baisse de participation) est motivant pour agir.

#### Modeles manquants

**Nudge Theory** — ABSENT. Les analytics montrent les donnees mais ne suggerent pas d'actions.

> **Recommandation** : Ajouter des "nudges data-driven" : "Tes sessions du mardi ont 92% de presence vs 67% le vendredi. Planifie plus de sessions le mardi." Les insights actionnables valent plus que les graphiques.

---

### /call-history

**Score : 4.5 / 10**

Page utilitaire sans levier psychologique. C'est un historique passif.

> **Recommandation** : Ajouter des metriques cumulees : "48h de party vocale ce mois. +12h vs le mois dernier." Le **Goal-Gradient** et l'**Endowment Effect** s'appliquent meme a l'historique.

---

### /widget/:squadId

**Score : 5.0 / 10**

#### Modeles bien appliques

**Activation Energy** — Le widget est simple : nom de squad, prochaine session, bouton "Rejoindre."

#### Modeles manquants

**Social Proof** — FAIBLE. "2 membres" est peu engageant. Afficher "Derniere session il y a 2h" ou "Squad active" rassurerait plus.

**Scarcity** — ABSENT. "Plus que 3 places dans cette squad" si applicable.

> **Recommandation** : Enrichir le widget avec : derniere activite, prochaine session, nombre de membres actifs cette semaine.

---

## 10. Pages Utilitaires

### /help

**Score : 5.0 / 10**

Page fonctionnelle mais sans levier psychologique notable. La FAQ repond aux questions mais ne vend rien.

> **Recommandation** : Ajouter un CTA contextuel en fin de page : "Tu n'as pas trouve ta reponse ? Rejoins la communaute Discord." Convertir le support en social proof.

### /legal

**Score : 4.0 / 10**

Page obligatoire. Pas de levier psychologique applicable. Cependant, la presence de cette page contribue a la **confiance** (Authority Bias — l'app respecte la loi).

### /maintenance

**Score : 4.0 / 10**

> **Recommandation** : Ajouter "On revient dans [countdown]" + "Suis-nous sur Discord pour les mises a jour." Transformer un moment negatif en engagement social.

### /not-found (404)

**Score : 5.0 / 10**

La page 404 est presente et fonctionnelle. Le CTA "Retour a l'accueil" existe.

> **Recommandation** : Ajouter un message gaming-native : "404 — Cette page a ghost. Comme tes potes du vendredi soir." + lien vers /discover ou /home. Transformer l'erreur en moment de marque.

### /s/:id (Session Share)

**Score : 5.5 / 10**

Page de partage de session pour les liens publics.

> **Recommandation** : Ajouter le nombre de participants confirmes + un CTA "Rejoins la session" qui mene vers /auth si non connecte. Le **Social Proof** du nombre de participants et l'**Urgency** de la date de session sont des leviers naturels.

### /u/:username (Profil Public)

**Score : 5.5 / 10**

Le profil public montre le score de fiabilite, le niveau, les badges.

> **Recommandation** : Ajouter un CTA "Invite ce joueur dans ta squad" pour les visiteurs. Le profil public devrait etre un outil de recrutement, pas juste une vitrine.

---

## 11. Analyse transversale — Modeles sous-exploites

### Les 10 modeles les plus negliges sur l'ensemble du site

| # | Modele | Utilisation actuelle | Potentiel | Gap |
|---|--------|---------------------|-----------|-----|
| 1 | **Scarcity / Urgency** | Quasi-absent | Enorme (gaming = culture FOMO) | 🔴 CRITIQUE |
| 2 | **Goal-Gradient Effect** | Partiel (onboarding, XP) | Sur toutes les pages | 🔴 CRITIQUE |
| 3 | **Zeigarnik Effect** | Absent | Enorme (boucles ouvertes partout) | 🔴 CRITIQUE |
| 4 | **Anchoring Effect** | Faible | Pricing, comparaisons | 🟡 IMPORTANT |
| 5 | **Bandwagon / Social Proof dynamique** | Statique (+2000) | Temps reel partout | 🟡 IMPORTANT |
| 6 | **Peak-End Rule** | Absent | Onboarding, sessions, wrapped | 🟡 IMPORTANT |
| 7 | **Endowment Effect** | Sous-exploite | Premium, settings, profil | 🟡 IMPORTANT |
| 8 | **Nudge Theory** | Faible | Home, analytics, sessions | 🟢 MODERE |
| 9 | **Mimetic Desire** | Absent | Discover, profils, temoignages | 🟢 MODERE |
| 10 | **Decoy Effect** | Absent | Pricing | 🟢 MODERE |

### Patterns transversaux

#### 1. L'urgence est absente de l'ensemble du site

Sur 62 pages, AUCUNE n'utilise un element d'urgence veritable. Pas de countdown, pas de "derniere chance", pas de "X personnes regardent en ce moment", pas de "offre expire dans". Pour un produit gaming ou la culture FOMO est omnipresente, c'est une opportunite enormement gachee.

**Impact estime** : +15-25% de conversion sur les CTA avec urgence ajoutee.

#### 2. Le social proof est statique et generique

"+2 000 gamers" est repete partout mais n'evolue jamais. Les temoignages sont les memes sur toutes les pages. Il n'y a pas de social proof dynamique, en temps reel, ou specifique au contexte.

**Impact estime** : +10-20% de confiance et de conversion avec du social proof dynamique.

#### 3. Les pages template (SEO/LFG) manquent cruellement de specificite

24 pages (12 /games + 12 /lfg) utilisent un template identique avec juste le nom du jeu qui change. Le visiteur qui arrive via Google sur /games/valorant cherche une solution specifique a Valorant, pas un template generique. Le **Liking/Similarity Bias** necessite de la specificite pour fonctionner.

**Impact estime** : +30-50% de temps sur page et +20% de conversion avec du contenu specifique par jeu.

#### 4. L'onboarding ne cree pas de moment "wow"

Le flow Onboarding est fonctionnel mais utilitaire. Il manque un pic emotionnel (Peak-End Rule) et une celebration memorable. L'utilisateur termine l'onboarding sans sentiment d'accomplissement.

**Impact estime** : +20% d'activation (premiere session creee) avec un onboarding emotionnellement fort.

#### 5. Le lazy-loading casse l'experience sur les pages marketing

Plusieurs pages SEO, LFG et alternatives ont des zones vides a cause du lazy-loading qui ne se declenche pas. Psychologiquement, un espace vide est interprete comme "cassé" ou "inachevé" — ce qui detruit la confiance instantanement.

**Impact estime** : Potentiellement -50% de conversion sur les pages affectees. Correction urgente.

---

## 12. Top 30 recommandations prioritaires

### Tier 1 — Quick wins a fort impact (< 1 jour chacun)

| # | Recommandation | Modeles | Pages | Impact estime |
|---|---------------|---------|-------|--------------|
| R01 | **Corriger le lazy-loading** sur les pages SEO/LFG/alternatives — les sections ne s'affichent pas au scroll | Activation Energy, Confiance | 28 pages | +50% temps sur page |
| R02 | **Ajouter un compteur social proof dynamique** : "X squads creees cette semaine" sur la landing | Bandwagon, Social Proof | Landing | +10% signups |
| R03 | **Ajouter "Moins de 0,17 EUR/jour"** a cote du prix Premium | Mental Accounting | Premium | +5% conversion premium |
| R04 | **Pre-selectionner "Premium annuel"** avec badge "Le plus populaire" | Default Effect, Bandwagon | Premium | +15% choix annuel |
| R05 | **Ajouter "100% gratuit. Pas de CB."** sous chaque CTA d'inscription | Regret Aversion | Landing, Auth, SEO, LFG | +8% signups |
| R06 | **Reformuler le CTA final** de la landing (different du hero, plus urgent) | AIDA, Loss Aversion | Landing | +5% clics CTA |
| R07 | **Ajouter un sidebar social proof** sur la page Auth | Social Proof, Loss Aversion | Auth | +10% completions |
| R08 | **Inverser l'ordre de l'onboarding** : finir par la celebration, pas les permissions | Peak-End Rule | Onboarding | +15% activation |
| R09 | **Ajouter un checklist post-onboarding** sur le Home | Zeigarnik, Goal-Gradient | Home | +20% actions J1 |
| R10 | **Ajouter une date d'expiration** au code GUILDED30 | Scarcity, Urgency | /alternative/guilded | +15% conversions Guilded |

### Tier 2 — Ameliorations structurelles (1-3 jours chacune)

| # | Recommandation | Modeles | Pages | Impact estime |
|---|---------------|---------|-------|--------------|
| R11 | **Ajouter du contenu specifique par jeu** sur les pages /games | Liking, Specificity | 12 pages | +30% temps sur page |
| R12 | **Ajouter du contenu specifique par jeu** sur les pages /lfg | Liking, Specificity | 12 pages | +25% temps sur page |
| R13 | **Ajouter 1 temoignage specifique** par jeu sur /games et /lfg | Social Proof, Unity | 24 pages | +15% conversion |
| R14 | **Creer une section "Ce que tu rates"** sur la page Premium | Loss Aversion | Premium | +10% upgrades |
| R15 | **Ajouter un mini-formulaire interactif** sur les pages LFG | IKEA Effect, Commitment | 12 pages | +20% engagement |
| R16 | **Ajouter des nudges contextuels** sur le Home | Nudge Theory | Home | +15% actions/jour |
| R17 | **Ajouter un feed d'activite en direct** sur le Home | Bandwagon, FOMO | Home | +10% sessions |
| R18 | **Personnaliser la page Premium** pour les utilisateurs connectes | Endowment, Loss Aversion | Premium (in-app) | +20% upgrades |
| R19 | **Ajouter un recapitulatif de perte** avant la suppression de compte | Endowment, Loss Aversion | Settings | -30% churn |
| R20 | **Ajouter des paliers de recompenses** au parrainage | Goal-Gradient | Referrals | +25% parrainages |

### Tier 3 — Initiatives strategiques (3+ jours chacune)

| # | Recommandation | Modeles | Pages | Impact estime |
|---|---------------|---------|-------|--------------|
| R21 | **Creer un quiz interactif** "Quel type de capitaine es-tu ?" | Goal-Gradient, Zeigarnik | Landing | +15% signups |
| R22 | **Ajouter un calculateur** "Combien d'heures ta squad perd par mois" | First Principles, Loss Aversion | Landing, Blog | +10% signups |
| R23 | **Ajouter du social proof en temps reel** sitewide | Bandwagon, FOMO | Toutes | +10% conversions |
| R24 | **Creer 9 articles blog supplementaires** (objectif 12 total) | Mere Exposure, SEO | Blog | +40% trafic organique |
| R25 | **Ajouter un CTA newsletter** sur le blog | Foot-in-the-Door, Commitment | Blog | +300 emails/mois |
| R26 | **Ajouter une celebration animated** post-session (recap + badge) | Peak-End Rule | Sessions | +20% retention J30 |
| R27 | **Ajouter des insights actionnables** aux analytics squad | Nudge Theory | Squad Analytics | +15% planification |
| R28 | **Implementer le "Wrapped" comme outil viral** avec partage social | Mimetic Desire, Network Effects | Wrapped | +30% signups organiques |
| R29 | **Ajouter des temoignages video** de streamers ambassadeurs | Mimetic Desire, Authority | Landing, Ambassador | +25% credibilite |
| R30 | **Creer un systeme de "Social Proof Notifications"** (Fomo-style) | Bandwagon, Urgency | Toutes pages publiques | +12% conversions |

---

## 13. Matrice impact/effort

```
IMPACT ↑
  |
  |  R01 R07   R18 R14   R21 R30
  |  R02 R08   R11 R12   R28
  |  R04 R09   R13 R16   R26
  |                       R29
  |  R03 R05   R15 R17   R22
  |  R06 R10   R19 R20   R23 R24
  |                       R25
  |                       R27
  +---------------------------------→ EFFORT
     Quick wins   Moyen     Strategique
    (< 1 jour)   (1-3j)      (3j+)
```

### Ordre d'execution recommande

**Sprint 1 (cette semaine) — Quick wins** : R01, R02, R04, R05, R07, R08, R09
**Sprint 2 (semaine prochaine) — Contenu** : R11, R12, R13, R14, R18
**Sprint 3 — Engagement** : R15, R16, R17, R19, R20, R26
**Sprint 4 — Croissance** : R21, R22, R23, R24, R25, R28, R29, R30

---

## Annexe A — Inventaire complet des 62 pages auditees

| # | Page | URL | Score | Priorite |
|---|------|-----|-------|----------|
| 1 | Landing | / | 7.2 | Haute |
| 2 | Auth | /auth | 5.5 | Haute |
| 3 | Premium | /premium | 6.5 | Haute |
| 4 | Ambassador | /ambassador | 7.0 | Moyenne |
| 5 | Referrals | /referrals | 6.0 | Moyenne |
| 6 | Games Valorant | /games/valorant | 5.8 | Haute |
| 7 | Games LoL | /games/league-of-legends | 5.8 | Haute |
| 8 | Games Fortnite | /games/fortnite | 5.8 | Haute |
| 9 | Games Rocket League | /games/rocket-league | 5.8 | Moyenne |
| 10 | Games CS2 | /games/cs2 | 5.8 | Moyenne |
| 11 | Games Apex | /games/apex-legends | 5.8 | Moyenne |
| 12 | Games Minecraft | /games/minecraft | 5.8 | Moyenne |
| 13 | Games FIFA | /games/fifa | 5.8 | Basse |
| 14 | Games CoD | /games/call-of-duty | 5.8 | Moyenne |
| 15 | Games OW2 | /games/overwatch-2 | 5.8 | Moyenne |
| 16 | Games Destiny 2 | /games/destiny-2 | 5.8 | Basse |
| 17 | Games GTA | /games/gta-online | 5.8 | Basse |
| 18 | LFG Valorant | /lfg/valorant | 6.5 | Haute |
| 19 | LFG LoL | /lfg/league-of-legends | 6.5 | Haute |
| 20 | LFG Fortnite | /lfg/fortnite | 6.5 | Haute |
| 21 | LFG Rocket League | /lfg/rocket-league | 6.5 | Moyenne |
| 22 | LFG CS2 | /lfg/cs2 | 6.5 | Moyenne |
| 23 | LFG Apex | /lfg/apex-legends | 6.5 | Moyenne |
| 24 | LFG Minecraft | /lfg/minecraft | 6.5 | Moyenne |
| 25 | LFG FIFA | /lfg/fifa | 6.5 | Basse |
| 26 | LFG CoD | /lfg/call-of-duty | 6.5 | Moyenne |
| 27 | LFG OW2 | /lfg/overwatch-2 | 6.5 | Moyenne |
| 28 | LFG Destiny 2 | /lfg/destiny-2 | 6.5 | Basse |
| 29 | LFG GTA | /lfg/gta-online | 6.5 | Basse |
| 30 | Alt. Guilded | /alternative/guilded | 7.5 | Haute |
| 31 | Alt. GamerLink | /alternative/gamerlink | 6.8 | Moyenne |
| 32 | Alt. Discord Events | /alternative/discord-events | 7.8 | Haute |
| 33 | VS Guilded | /vs/guilded-vs-squad-planner | 7.0 | Moyenne |
| 34 | Blog Listing | /blog | 5.5 | Moyenne |
| 35 | Blog Guilded Alts | /blog/guilded-alternatives-2026 | 7.5 | Haute |
| 36 | Blog Tournoi | /blog/organiser-tournoi-entre-amis | 6.5 | Moyenne |
| 37 | Blog Anti-Ghost | /blog/squad-ghost-astuces | 7.0 | Haute |
| 38 | Onboarding | /onboarding | 7.5 | Haute |
| 39 | Join Squad | /join/:code | 6.5 | Moyenne |
| 40 | Home Dashboard | /home | 6.8 | Haute |
| 41 | Squads List | /squads | 6.5 | Moyenne |
| 42 | Squad Detail | /squad/:id | 6.5 | Moyenne |
| 43 | Squad Analytics | /squad/:id/analytics | 6.5 | Moyenne |
| 44 | Sessions List | /sessions | 6.5 | Moyenne |
| 45 | Session Detail | /session/:id | 7.0 | Haute |
| 46 | Session Share | /s/:id | 5.5 | Basse |
| 47 | Messages | /messages | 6.0 | Moyenne |
| 48 | Party | /party | 5.5 | Basse |
| 49 | Discover | /discover | 6.0 | Moyenne |
| 50 | Profile | /profile | 6.5 | Moyenne |
| 51 | Public Profile | /u/:username | 5.5 | Basse |
| 52 | Settings | /settings | 5.0 | Basse |
| 53 | Call History | /call-history | 4.5 | Basse |
| 54 | Club Dashboard | /club | 6.0 | Basse |
| 55 | Wrapped 2026 | /wrapped | 7.0 | Moyenne |
| 56 | Widget | /widget/:squadId | 5.0 | Basse |
| 57 | Help | /help | 5.0 | Basse |
| 58 | Legal | /legal | 4.0 | Basse |
| 59 | Maintenance | /maintenance | 4.0 | Basse |
| 60 | Not Found (404) | /* | 5.0 | Basse |
| 61 | Sitemap XML | /sitemap.xml | N/A | N/A |
| 62 | Discord Callback | /auth/discord/callback | N/A | N/A |

---

## Annexe B — Modeles mentaux utilises dans cet audit

70+ modeles appliques, regroupes par categorie :

**Pensee strategique (14)** : First Principles, Jobs to Be Done, Circle of Competence, Inversion, Occam's Razor, Pareto (80/20), Local vs Global Optima, Theory of Constraints, Opportunity Cost, Diminishing Returns, Second-Order Thinking, Map ≠ Territory, Probabilistic Thinking, Barbell Strategy

**Psychologie de l'acheteur (16)** : Fundamental Attribution Error, Mere Exposure Effect, Availability Heuristic, Confirmation Bias, Lindy Effect, Mimetic Desire, Sunk Cost Fallacy, Endowment Effect, IKEA Effect, Zero-Price Effect, Hyperbolic Discounting, Status-Quo Bias, Default Effect, Paradox of Choice, Goal-Gradient Effect, Peak-End Rule

**Comportement (5)** : Zeigarnik Effect, Pratfall Effect, Curse of Knowledge, Mental Accounting, Regret Aversion, Bandwagon Effect / Social Proof

**Persuasion (13)** : Reciprocity, Commitment & Consistency, Authority Bias, Liking/Similarity, Unity Principle, Scarcity/Urgency, Foot-in-the-Door, Door-in-the-Face, Loss Aversion, Anchoring Effect, Decoy Effect, Framing Effect, Contrast Effect

**Pricing (5)** : Charm Pricing, Rounded-Price Fluency, Rule of 100, Price Relativity (Good-Better-Best), Mental Accounting (pricing)

**Design & Delivery (10)** : Hick's Law, AIDA Funnel, Rule of 7, Nudge Theory, BJ Fogg Model, EAST Framework, COM-B Model, Activation Energy, North Star Metric, Cobra Effect

**Croissance (8)** : Feedback Loops, Compounding, Network Effects, Flywheel Effect, Switching Costs, Exploration vs Exploitation, Critical Mass, Survivorship Bias

---

*Document genere le 28 fevrier 2026 — Audit complet de 62 pages avec 70+ modeles mentaux.*
*Prochaine etape recommandee : Sprint 1 Quick Wins (R01-R09) cette semaine.*
