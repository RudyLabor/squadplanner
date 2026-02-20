# AUDIT MARKETING COMPLET — SQUAD PLANNER

**Date :** 11 février 2026
**Score global : 6.2/10**
**Statut :** Fondations solides, problèmes critiques de crédibilité, lacunes majeures en analytics/growth/contenu

---

## TABLE DES MATIÈRES

1. [Forces](#-forces)
2. [Problèmes Critiques](#-problèmes-critiques-à-corriger-immédiatement)
3. [Audit SEO](#-audit-seo--710)
4. [Audit CRO Landing Page](#-audit-cro-landing-page--6510)
5. [Audit Onboarding](#-audit-onboarding--510)
6. [Audit Pricing & Paywall](#-audit-pricing--paywall--510)
7. [Audit Copywriting](#-audit-copywriting--6510)
8. [Audit Growth & Marketing](#-audit-growth--marketing--310)
9. [Plan d'Action en 4 Phases](#-plan-daction-en-4-phases)
10. [Stratégie Marketing 2026](#-stratégie-marketing-2026)
11. [Programme de Parrainage](#-programme-de-parrainage-squad-legends)
12. [Stratégie Content Marketing](#-stratégie-content-marketing)
13. [Stratégie Community Building](#-stratégie-community-building)
14. [Stratégie Paid Acquisition](#-stratégie-paid-acquisition)
15. [Growth Loops](#-growth-loops)
16. [Projections 2026](#-projections-2026)

---

## ✅ FORCES

| Domaine | Score | Points forts |
|---------|-------|-------------|
| **Positionnement** | 9/10 | "Le Calendly du gaming" — brillant, ancrage mental immédiat |
| **Copy émotionnel** | 8/10 | "Transforme « on verra » en « on y est »" — percutant, langage gamer |
| **Section Problème** | 9/10 | 4 pain points ultra-reconnaissables par tout gamer |
| **SEO technique** | 7/10 | Meta tags, schema WebApplication, SSR, sitemap, robots.txt |
| **RGPD/Legal** | 8/10 | Complet, hébergé France, cookie consent, privacy policy |
| **Auth flow** | 8/10 | Google OAuth + Email, "T'as manqué à ta squad!" — excellent |
| **PWA** | 7/10 | Installable, shortcuts, manifest complet |

---

## 🔴 PROBLÈMES CRITIQUES (À corriger immédiatement)

### 1. INCOHÉRENCE SQUADS — Fausse publicité

- **Landing page** dit "Squads illimitées" en gratuit
- **Page Premium** dit "2 max" en gratuit, illimité en Premium
- **Code** confirme `FREE_SQUAD_LIMIT = 2`

**Impact :** Détruit la confiance. Risque juridique (publicité mensongère).
**Correction :** Remplacer "Squads illimitées" par "2 squads gratuites" sur la landing.
**Fichier :** `src/components/landing/PricingSection.tsx`

### 2. Social proof MENSONGÈRE

"Déjà adopté par des milliers de gamers" + "Lancement 2026" = crédibilité zéro.

**Impact :** Les visiteurs pensent immédiatement "ils mentent".
**Correction :** Remplacer par "Lancement 2026 — Rejoins les premiers gamers" ou "Bêta privée en cours".
**Fichier :** `src/components/landing/LandingHero.tsx`

### 3. Témoignages FABRIQUÉS

6 témoignages avec noms génériques (Alexandre, Sarah, Lucas...), pas de photos, pas de preuve.

**Impact :** Renforce le sentiment de fake.
**Correction :** Soit retirer la section, soit remplacer par :
- Des quotes de vrais bêta-testeurs
- Des "citations de Discord" reconnaissables ("« On joue ce soir ? » — 3 jours plus tard, toujours rien")

**Fichier :** `src/components/landing/TestimonialCarousel.tsx`

### 4. Permission push BLOQUANTE dans l'onboarding

L'étape 5 exige l'autorisation push pour continuer.

**Impact :** Drop-off estimé **40-60%** à cette étape seule.
**Correction :** Rendre non-bloquant. Demander la permission push **après** la création de la première session (moment contextuel).
**Fichier :** `src/pages/Onboarding.tsx`

### 5. Pilier 2 description INCOHÉRENTE

- **Titre :** "Planning avec décision"
- **Description :** parle du **chat**, pas du planning

**Impact :** Confuse les utilisateurs sur le core feature.
**Correction :** Réécrire : "Propose un créneau. Chaque pote répond **OUI ou NON**. Pas de « peut-être ». La session se confirme quand vous êtes assez."
**Fichier :** `src/components/landing/FeaturesSection.tsx`

---

## 🔍 AUDIT SEO — 7/10

### Points forts
- ✅ Meta tags complets (title, description, OG, Twitter cards)
- ✅ Schema WebApplication en SSR
- ✅ Sitemap.xml + robots.txt correct
- ✅ SSR + prerendering pages publiques
- ✅ Core Web Vitals monitoring actif
- ✅ HTTPS + headers sécurité exemplaires
- ✅ URLs propres et logiques

### Corrections requises

| Priorité | Problème | Impact | Effort | Fichier |
|----------|----------|--------|--------|---------|
| 🔴 CRITIQUE | FAQ Schema injecté client-side (useEffect) → pas crawlé SSR | Rich snippets perdus | 30 min | `src/routes/_index.tsx` |
| 🔴 CRITIQUE | Canonicals statiques → toutes pages pointent vers `/` | Dilution autorité | 20 min | `src/root.tsx` |
| 🟡 HAUTE | `/discover` absente du sitemap.xml | Page non indexée | 15 min | `public/sitemap.xml` |
| 🟡 HAUTE | Pas de schema Organization | Manque signaux E-A-T | 30 min | `src/root.tsx` |
| 🟡 HAUTE | Meta descriptions trop courtes (Premium: 53 car, Help: 53 car) | CTR faible | 15 min | Routes respectives |
| 🟡 HAUTE | Zéro contenu marketing (pas de blog) | 0 trafic organique | 8h+ | Nouveau |
| 🟢 MOYENNE | Pas de page /about (E-A-T) | Manque trust | 2h | Nouveau |
| 🟢 MOYENNE | PWA start_url = /home (redirige non-auth) | Mauvaise UX | 5 min | `public/manifest.json` |

### Corrections SEO détaillées

#### Canonicals dynamiques (root.tsx)
```tsx
// AVANT (hardcodé)
<link rel="canonical" href="https://squadplanner.fr/" />

// APRÈS (dynamique)
const location = useLocation()
const canonicalUrl = `https://squadplanner.fr${location.pathname}`
<link rel="canonical" href={canonicalUrl} />
<meta property="og:url" content={canonicalUrl} />
```

#### FAQ Schema en SSR (routes/_index.tsx)
```tsx
export function meta() {
  return [
    { title: "Squad Planner - Le Calendly du gaming" },
    {
      tagName: "script",
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(f => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a }
        }))
      })
    }
  ]
}
```

#### Organization Schema (root.tsx)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Squad Planner",
  "url": "https://squadplanner.fr",
  "logo": "https://squadplanner.fr/favicon.svg",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "contact@squadplanner.fr",
    "contactType": "customer support",
    "availableLanguage": "French"
  }
}
```

#### Metas Premium et Help améliorées
```
Premium: "Débloquez les fonctionnalités Premium de Squad Planner : squads illimitées, analyses avancées, customisation totale. À partir de 4,99€/mois."

Help: "Centre d'aide Squad Planner : trouvez des réponses à vos questions sur la création de squads, planification de sessions, RSVP et fonctionnalités Premium."
```

---

## 🎯 AUDIT CRO LANDING PAGE — 6.5/10

### Points forts
- ✅ Headline H1 percutant et mémorable
- ✅ Section problème excellente (pain points reconnaissables)
- ✅ Comparaison Discord bien articulée
- ✅ Structure de page logique et complète
- ✅ Animations subtiles et efficaces

### Corrections requises

| Priorité | Problème | Impact estimé | Fichier |
|----------|----------|---------------|---------|
| 🔴 CRITIQUE | CTA navbar invisible mobile (`hidden md:inline-flex`) | -25% conversions mobile | `LandingNavbar.tsx` |
| 🔴 CRITIQUE | Aucun sticky CTA mobile | Friction au scroll | Nouveau composant |
| 🔴 CRITIQUE | Social proof mensongère | Confiance détruite | `LandingHero.tsx` |
| 🟡 HAUTE | Pas de CTA intermédiaire (9 sections entre Hero et Pricing) | Intention perdue | `Landing.tsx` |
| 🟡 HAUTE | Pas d'analytics tracking (data-track non connectés) | Optimisation impossible | Global |
| 🟡 HAUTE | Cookie banner peut bloquer le hero mobile | CTA couvert | `CookieConsent.tsx` |
| 🟢 MOYENNE | Stats hero trop petites visuellement | Manque d'impact | `LandingHero.tsx` |
| 🟢 MOYENNE | Steps interactifs pas évidents (HowItWorks) | Engagement réduit | `HowItWorksSection.tsx` |

### Sticky CTA Mobile (nouveau composant)

```tsx
// src/components/landing/MobileStickyCTA.tsx
export function MobileStickyCTA() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 500)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4
                          bg-bg-base/95 backdrop-blur-xl border-t border-border-subtle">
          <Link to="/auth?mode=register&redirect=onboarding"
                className="flex items-center justify-center gap-2 w-full h-14
                           rounded-xl bg-primary text-white font-semibold">
            Créer ma squad <ArrowRight className="w-4 h-4" />
          </Link>
        </m.div>
      )}
    </AnimatePresence>
  )
}
```

### Tests A/B Prioritaires

| Test | Variantes | Impact estimé |
|------|-----------|---------------|
| Sticky CTA Mobile | Pas de sticky vs sticky après 500px | +20-30% conversions mobile |
| Headline Hero | "on verra → on y est" vs "Fini les « on verra »" vs "Et si ta squad jouait vraiment chaque semaine?" | +10-15% |
| Social Proof | "Rejoins les premiers gamers" vs compteur live "247 squads actives" | +15-20% |
| CTA Copy | "Créer ma squad gratuitement" vs "C'est parti - Gratuit" vs "Lancer ma première session" | +5-10% |
| Ordre sections | Actuel vs Hero→Problem→Comparison→HowItWorks→Features | +10% |

### Conversion Rate Cibles

| Métrique | Actuel estimé | Objectif 30j | Objectif 90j |
|----------|---------------|-------------|-------------|
| Visiteur → Signup | 2-3% | 5-8% | 8-12% |
| Scroll depth (jusqu'au pricing) | ~40% | ~60% | ~70% |
| CTA click-through rate | ~10% | ~20% | ~25% |

---

## 🚀 AUDIT ONBOARDING — 5/10

### Points forts
- ✅ Onboarding guidé avec progression visuelle
- ✅ OAuth pré-remplit le pseudo (réduit friction)
- ✅ Confetti animation à la complétion (dopamine hit)
- ✅ Tour guide (TourGuide.tsx) post-onboarding existe

### Corrections requises

| Priorité | Problème | Impact estimé | Action |
|----------|----------|---------------|--------|
| 🔴 CRITIQUE | Permission push BLOQUANTE | -40-60% | Rendre non-bloquant |
| 🔴 CRITIQUE | Pas d'étape "Créer première session" | -20% activation | Ajouter étape guidée |
| 🟡 HAUTE | Étape Splash inutile | -10-15% | Supprimer |
| 🟡 HAUTE | 7 étapes = trop long | -5-10% cumulatif | Réduire à 4 |
| 🟢 MOYENNE | Avatar upload lent/complexe | -5-10% | Rendre optionnel |
| 🟢 MOYENNE | Pas de séquence email post-onboarding | -15% récupérable | Créer 5 emails |

### Onboarding Optimisé (4 étapes au lieu de 7)

```
AVANT (7 étapes) :
Splash → Squad Choice → Create/Join → Profile → Permissions (BLOCKING!) → Complete
Taux activation estimé : ~28%

APRÈS (4 étapes) :
Squad Choice → Create/Join → Profile Express → Créer Première Session → Success
Taux activation estimé : ~65-70%
```

**Étape 1 - Squad Choice** (fusionner avec Splash)
- "Bienvenue ! Pour commencer :"
- [ Créer une squad ] [ Rejoindre une squad ]

**Étape 2 - Create/Join Squad** (inchangé)
- Nom de la squad + Jeu (si création)
- Code d'invitation (si rejoint)

**Étape 3 - Profile Express** (simplifié)
- Pseudo (pré-rempli OAuth) — seul champ requis
- Avatar auto-généré (initiales colorées)
- Timezone détecté silencieusement

**Étape 4 - Créer Première Session** (NOUVEAU — moment "aha")
- Jeu (pré-rempli depuis la squad)
- Date & Heure
- Durée (1h, 2h, 3h, 4h+)

**Success**
- Confetti + récap session
- Code d'invitation pour les potes
- → Redirect vers /squad/:id avec session visible

**Permission push** : Demandée plus tard, **après** création de la 1ère session
- "Reçois un rappel 1h avant ta session ?"
- Contexte = l'utilisateur comprend POURQUOI

### Séquence Email Post-Onboarding

| Email | Trigger | Sujet | CTA |
|-------|---------|-------|-----|
| 1 | Onboarding incomplet (J+1) | "Tu es presque dans la squad ! 🎮" | Lien vers étape d'arrêt |
| 2 | Complet mais 0 session (J+2) | "Ta squad attend sa première session ! 🗓️" | Créer une session |
| 3 | Session créée (H-2) | "C'est bientôt l'heure ! ⏰" | Rejoindre le vocal |
| 4 | 1ère session passée (J+7) | "Comment s'est passée ta session ? 🎯" | Planifier la prochaine |
| 5 | Inactif 2 semaines (J+14) | "Ta squad te manque ! 😢" | Re-engagement |

---

## 💰 AUDIT PRICING & PAYWALL — 5/10

### Points forts
- ✅ Essai 7j sans carte bancaire
- ✅ Garantie satisfait ou remboursé 30j
- ✅ Toggle mensuel/annuel (annuel pré-sélectionné)
- ✅ PremiumGate avec 5 modes de fallback (lock, blur, badge, hide, custom)

### Corrections requises

| Priorité | Problème | Impact | Action |
|----------|----------|--------|--------|
| 🔴 CRITIQUE | Incohérence squads illimitées | Trust brisé | Corriger landing + premium |
| 🟡 HAUTE | Pricing annuel incohérent (47.88€ code vs 49.99€ UI) | Confusion | Aligner sur 48€/an |
| 🟡 HAUTE | Pas de Stripe trust badges | Doute paiement | Ajouter logos |
| 🟡 HAUTE | Premium value prop floue | Conversion basse | Rewrite JTBD |
| 🟢 MOYENNE | Abonnement perso + bénéfices squad = confusion | Misalignement | Clarifier |
| 🟢 BASSE | Essai sans CB = 2-10% conversion | Revenue | Tester avec CB |

### Proposition de Valeur Premium Améliorée (JTBD Framing)

| Feature | Actuel | Nouveau (Job-to-be-Done) |
|---------|--------|--------------------------|
| Squads illimités | "Illimité" | "Gère tous tes groupes de jeu sans limites" |
| IA Coach | "Prédictions + Personnalisé" | "Découvre quel jour ta squad est la plus clutch" |
| Audio HD | "Audio HD Premium" | "Élimine les lags audio en ranked serré" |
| Stats avancées | "Avancées + Tendances" | "Prouve qui carry vraiment la squad" |
| Historique illimité | "Illimité" | "Retrouve n'importe quelle session, même il y a 6 mois" |
| Rôles custom | "Coach, Manager, Personnalisé" | "Assigne des rôles clairs : shotcaller, IGL, coach" |

### Feature Gating : Timing Optimal

| Trigger actuel | Problème | Trigger recommandé |
|----------------|----------|--------------------|
| Création 3ème squad | OK mais limite basse | Garder |
| Accès stats avancées | Pas de "aha moment" avant | Après 5 sessions avec 80%+ participation |
| Rôles custom | Niche | Quand squad > 5 membres |
| Export calendrier | Feature faible | Après 10 sessions créées |
| Historique > 30j | Trop tard | Quand l'user cherche une session passée |

### Stratégie Long Terme : Squad-Level Pricing

```
GRATUIT (personnel)          — 0€
├─ 2 squads max
├─ Membre dans squads illimitées
└─ Historique 30j

PRO (personnel)              — 3,99€/mois
├─ Créer 5 squads
├─ Features personnelles (stats, export)
└─ Badge Pro

SQUAD PREMIUM (squad-level)  — 9,99€/mois (partagé entre 3-10 membres)
├─ IA Coach squad-level
├─ Audio HD pour toute la squad
├─ Stats avancées partagées
└─ Rôles custom illimités
```

**Avantage :** 9,99€ partagé entre 5 = 2€/personne = très compétitif.

---

## ✏️ AUDIT COPYWRITING — 6.5/10

### Notes par section

| Section | Score | Commentaire |
|---------|-------|-------------|
| Hero | 8/10 | H1 excellent, subtitle et social proof à corriger |
| Problem | 9/10 | Meilleure section du site — ne rien changer |
| How It Works | 7/10 | Steps clairs mais trop feature-focused |
| Features (3 Piliers) | 5/10 | Pilier 2 incohérent (critique) |
| Comparison | 6/10 | Bien mais peut être plus punchy |
| Testimonials | 3/10 | Fabricated = détruit la confiance |
| Pricing | 4/10 | Incohérence critique + pitch vague |
| FAQ | 7/10 | Bonnes réponses, 3 questions manquantes |
| Final CTA | 5/10 | Badge = titre (redondant), manque urgence |
| Auth Pages | 8/10 | Login copy excellent |
| Premium Page | 6/10 | Trial messaging fort, subtitle à compléter |

### Corrections Copy Critiques

#### Hero — Social proof
```
AVANT : "Lancement 2026 — Déjà adopté par des milliers de gamers"
APRÈS : "Lancement 2026 — Rejoins les premiers gamers qui testent Squad Planner"
  ou   : "Lancement 2026 — Bêta privée en cours. Inscris-toi pour l'accès anticipé."
```

#### Pilier 2 — Description
```
AVANT : "Discute avec ta squad en temps réel. Chat de groupe et conversations privées..."
APRÈS : "Propose un créneau. Chaque pote répond OUI ou NON. Pas de « peut-être ».
         La session se confirme quand vous êtes assez. Plus de ghosting."
```

#### Pricing — Plan gratuit
```
AVANT : "Squads illimitées"
APRÈS : "2 squads gratuites" ou "Crée ta première squad gratuitement"
```

#### CTAs améliorés
```
Pricing Free  : "Commencer gratuitement" → "C'est parti - Gratuit"
Pricing Premium : "Essayer Premium" → "Débloquer Premium"
Final CTA     : "Rejoindre l'aventure" → "Créer ma squad maintenant"
Badge Final   : "✨ Ta squad t'attend" → "Prêt à jouer vraiment?"
```

#### FAQ — 3 questions à ajouter
1. **"Pourquoi pas juste un Google Calendar ou Doodle?"**
   → "Parce que Google Calendar, c'est fait pour des meetings de boulot. Squad Planner est conçu pour le gaming : vocal intégré, score de présence, confirmation auto."

2. **"Mes potes vont vraiment l'utiliser?"**
   → "Oui, parce qu'ils n'ont qu'à cliquer OUI ou NON. Pas d'app à installer (version web). S'ils veulent les notifs, l'app mobile existe."

3. **"C'est vraiment 100% gratuit?"**
   → "Oui. Tout le core est gratuit. Premium ajoute le coach IA et des stats avancées, mais tu n'en as pas besoin pour jouer."

### Recommandations Tone of Voice

- **Pousser le gaming slang** : ghosting, AFK, tryhard, grind, main, clutch
- **Ajouter des références gaming** : "Moins cher qu'un skin Fortnite", "Le MMR de ta fiabilité"
- **Remplacer "fiabilité"** (trop corporate) par **"score de présence"** ou **"qui se pointe vraiment?"**
- **Assumer le pré-lancement** : "On construit Squad Planner avec des vrais gamers. Toi le prochain?"

---

## 📈 AUDIT GROWTH & MARKETING — 3/10

### Ce qui existe
- ✅ Invite codes (viral loop natif)
- ✅ Page `/discover` (matchmaking squads)
- ✅ Reliability score (pression sociale)
- ✅ Web Vitals monitoring

### Ce qui manque totalement
- ❌ Aucune analytics produit (pas de GA4, Plausible, PostHog)
- ❌ Aucun programme de parrainage
- ❌ Aucune présence social media
- ❌ Aucun content marketing / blog
- ❌ Aucune stratégie d'email marketing
- ❌ Aucune campagne paid ads
- ❌ Aucune présence App Store (Capacitor prêt mais non publié)
- ❌ Aucune communauté Discord officielle
- ❌ Aucun Discord bot
- ❌ Pas de programme affiliés
- ❌ Pas de newsletter

---

## 📋 PLAN D'ACTION EN 4 PHASES

### Phase 1 : CORRECTIONS CRITIQUES (Cette semaine, ~8h)

| # | Action | Fichier | Temps |
|---|--------|---------|-------|
| 1 | Corriger "Squads illimitées" → "2 squads gratuites" | `src/components/landing/PricingSection.tsx` | 15 min |
| 2 | Remplacer "milliers de gamers" → "Rejoins les premiers" | `src/components/landing/LandingHero.tsx` | 15 min |
| 3 | Réécrire Pilier 2 (planning, pas chat) | `src/components/landing/FeaturesSection.tsx` | 30 min |
| 4 | Rendre permission push NON-bloquante | `src/pages/Onboarding.tsx` | 1h |
| 5 | Ajouter sticky CTA mobile | Nouveau `MobileStickyCTA.tsx` | 1h |
| 6 | Rendre navbar CTA visible mobile | `src/components/landing/LandingNavbar.tsx` | 15 min |
| 7 | Déplacer FAQ schema en SSR | `src/routes/_index.tsx` | 30 min |
| 8 | Fixer canonicals dynamiques | `src/root.tsx` | 20 min |
| 9 | Ajouter `/discover` au sitemap | `public/sitemap.xml` | 5 min |
| 10 | Corriger pricing annuel (cohérence code/UI) | `src/hooks/usePremium.ts` + `PremiumData.tsx` | 30 min |

**Impact estimé : +50% crédibilité, +30% conversion mobile, +30% SEO**

### Phase 2 : QUICK WINS (Semaine 2-3, ~20h)

| # | Action | Effort |
|---|--------|--------|
| 11 | Supprimer étape Splash onboarding | 1h |
| 12 | Ajouter étape "Créer première session" | 3h |
| 13 | Ajouter Organization schema | 30 min |
| 14 | Ajouter Stripe trust badges | 1h |
| 15 | Remplacer testimonials | 2h |
| 16 | Ajouter CTA intermédiaire après Problem section | 30 min |
| 17 | Améliorer copy CTAs | 1h |
| 18 | Setup Plausible Analytics (RGPD-friendly) | 2h |
| 19 | Connecter attributs `data-track` au tracking | 3h |
| 20 | Rendre avatar optionnel (initiales auto-générées) | 2h |
| 21 | Ajouter barre de progression onboarding | 1h |
| 22 | Optimiser cookie banner mobile | 1h |
| 23 | Ajouter badges de confiance (RGPD, SSL) | 30 min |

**Impact estimé : +150% activation, +25% conversion landing**

### Phase 3 : GROWTH ENGINE (Mois 1-2, ~60h)

| # | Action | Effort |
|---|--------|--------|
| 24 | Créer programme de parrainage "Squad Legends" | 2 sem dev |
| 25 | Créer 10 premiers guides SEO par jeu | 20h rédaction |
| 26 | Setup présence social media (Twitter/X, TikTok, Discord) | 1 jour |
| 27 | Développer Discord Bot "Squad Planner Sync" | 2 sem dev |
| 28 | Créer séquence email onboarding (5 emails) | 1 jour |
| 29 | Créer page de comparaison SEO "Squad Planner vs Discord" | 1 jour |
| 30 | Publier app sur les stores (Capacitor prêt) | 2 sem |
| 31 | Créer newsletter "Les Coulisses du Gaming Organisé" | 3h/sem |
| 32 | Contacter 20 micro-streamers Twitch FR | 1 jour |
| 33 | Créer page /about (E-A-T) | 2h |

**Impact estimé : K-factor >1.2, 500+ visiteurs organiques/mois**

### Phase 4 : SCALE (Mois 3-6)

| # | Action | Budget |
|---|--------|--------|
| 34 | Content marketing : 40 guides SEO (10K visiteurs/mois) | 80h |
| 35 | Programme affiliation streamers Twitch FR (30% commission) | 1000€/mois |
| 36 | Tests paid ads : Reddit, TikTok, Google Search | 2K€/mois |
| 37 | Lancement officiel Product Hunt | 1 mois prep |
| 38 | Outreach presse gaming FR (Gamekult, JeuxActu, Millenium) | 30h |
| 39 | Événement "Nuit du Squad Planning" | 1500€ |
| 40 | Série YouTube "Guide du Squad Parfait" (8 épisodes) | 40h + 200€ |
| 41 | Challenges communautaires mensuels "Squad Goals" | 200€/mois |
| 42 | SEO programmatique (landing pages par jeu) | 16h |
| 43 | Partenariats guildes e-sport amateurs (20 guildes) | 500€/mois |

---

## 🗓️ STRATÉGIE MARKETING 2026

### Timeline en 5 Phases

```
JAN-FEV          MAR-AVR          MAI-JUIL         AOÛ-SEP          OCT-DÉC
Internal Alpha   Closed Beta      Open Beta         Full Launch       Scale
10 squads        100 squads       1,000 squads      5,000 squads      15,000 squads
0€ marketing     500€/mois        2K€/mois          10K€/mois         15K€/mois
                 Socials          Referral           PH Launch         Paid ads scale
                 Discord          Affiliés           PR push           Full funnel
                 Content SEO      Discord Bot        App Stores        optimization
```

### Phase 1 : Internal Alpha (Jan-Fév) ✅ ACTUEL
- ✅ 10 squads amis en test
- ✅ Itération bugs/UX
- Critère passage Phase 2 : 8/10 squads actifs, NPS > 40

### Phase 2 : Closed Beta (Mars-Avril)
- Landing page "Coming Soon" optimisée
- Création présence social media
- Discord communautaire
- Outreach 50 micro-streamers
- **Jour J :** Email alpha users + Thread Twitter + Posts Reddit
- Invitations par batch : 10 squads/jour
- **Objectif :** 100 squads actifs, 500+ waitlist

### Phase 3 : Open Beta (Mai-Juillet)
- Retirer waitlist → Signup ouvert
- Activer programme parrainage
- Lancer Discord Bot public
- Tests paid ads (500€ Reddit)
- Feature drops mensuels (Voice Party 2.0, AI Coach v1, Intégrations)
- **Activer Premium :** Trial 7j pour nouveaux signups (Juin)
- **Objectif :** 1,000 squads actifs, MRR 2,000€

### Phase 4 : Full Launch (Août-Septembre)
- **Lundi :** Product Hunt Day (Top 3 Product of the Day)
- **Mardi :** Press Day (communiqué presse médias gaming)
- **Mercredi :** AMA Reddit + Stream Twitch "Launch Party"
- **Jeudi :** App Stores (iOS/Android via Capacitor)
- **Vendredi :** Recap métriques transparentes
- **Objectif :** 5,000 squads actifs, MRR 10K€

### Phase 5 : Scale (Oct-Déc)
- SEO Content Machine (40 guides, 10K visiteurs/mois)
- Paid Acquisition optimisé (8K€/mois, CPA 4€)
- 100+ affiliés streamers actifs
- 20 guildes e-sport partenaires
- **Décembre :** "Wrapped 2026" (stats annuelles squad, partageables)
- **Objectif :** 15,000 squads actifs, MRR 15K€

---

## 🎁 PROGRAMME DE PARRAINAGE "SQUAD LEGENDS"

### Structure à Double Face

#### Pour le Parrain (Squad qui invite)

| Niveau | Condition | Récompense |
|--------|-----------|------------|
| **Recruteur** (Bronze) | 1 squad invité actif | 1 mois Premium + badge bronze |
| **Capitaine** (Argent) | 3 squads invités actifs | 6 mois Premium + badge argent + early access |
| **Légende** (Or) | 10+ squads invités actifs | Premium à vie + badge or animé + Hall of Fame |

**Bonus :**
- Squad Complet (+5 membres actifs même squad) : +2 semaines Premium
- Streak Bonus (1 nouveau squad/mois × 3) : ×1.5 récompenses

#### Pour le Filleul (Nouveau squad invité)
- 2 semaines Premium gratuit (au lieu de 7 jours trial)
- Badge "Nouvelle Recrue" (30 jours)
- Templates pré-configurés par jeu

### Validation "Squad Actif" (anti-abus)
- ✅ 3+ membres inscrits via le lien parrain
- ✅ 1+ session créée
- ✅ 5+ RSVPs au total
- ✅ Actif 7 jours minimum

### Mécanique de Partage
```
Écran Squad Settings → Onglet "Inviter d'autres Squads"
┌─────────────────────────────────────────┐
│ 🚀 Invitez des squads, gagnez du Premium│
│                                         │
│ Votre lien: squadplanner.gg/join/ALPHA7 │
│ [Copier] [Partager Discord] [QR Code]   │
│                                         │
│ Squads invités: 2/3 pour Niveau Capitaine│
│ ▓▓▓▓▓▓▓░░░░░                            │
└─────────────────────────────────────────┘
```

### Leaderboard Public (`/leaderboard`)
```
🏆 TOP RECRUTEURS SQUAD PLANNER

Cette semaine:
1. 🥇 [SquadAlpha] - 8 squads invités
2. 🥈 [RaidMasters] - 6 squads invités
3. 🥉 [TeamVortex] - 4 squads invités
```

### KPIs Programme
- **Viral Coefficient (K)** : Cible > 1.2
- **Referral Conversion Rate** : Cible 20%
- **Active Referrer Rate** : Cible 15%
- **Time to First Referral** : Cible < 7 jours

---

## 📝 STRATÉGIE CONTENT MARKETING

### 3 Piliers de Contenu

#### 1. "Gaming Organization Mastery" (SEO + Éducation)
- **Format :** 40 guides pratiques (1 par jeu populaire)
- **Exemples :**
  - "Comment organiser un raid Destiny 2 sans drama"
  - "Planifier ses sessions Valorant avec sa squad"
  - "Les 7 erreurs qui tuent les squads gaming"
  - "Squad Planner vs Discord : quelle différence?"
- **Fréquence :** 2 articles/semaine
- **Objectif :** 10K visiteurs organiques/mois fin 2026

#### 2. "Squad Stories" (Social Proof + Émotion)
- **Format :** Interviews vidéo de vrais squads (5min)
- **Distribution :** YouTube + TikTok clips + Landing page
- **Fréquence :** 1 interview/semaine
- **Objectif :** 100K vues cumulées YouTube

#### 3. "Behind the Build" (Transparence + Communauté)
- **Format :** Threads Twitter/LinkedIn transparents
- **Contenu :** Métriques, challenges, décisions product
- **Fréquence :** 2 posts/semaine
- **Objectif :** 10K followers Twitter/X fin 2026

### Calendrier Éditorial Type (1 Semaine)

| Jour | Contenu | Canal |
|------|---------|-------|
| Lundi | Guide SEO publié | Blog + Twitter, LinkedIn |
| Mardi | TikTok sketch gaming | TikTok, Reels |
| Mercredi | Interview squad vidéo | YouTube |
| Jeudi | Guide SEO publié | Blog + Twitter |
| Vendredi | Changelog + Newsletter | Blog, Discord, Email |
| Samedi | User-generated repost | Instagram, Twitter |
| Dimanche | TikTok demo feature | TikTok, Reels |

### Repurposing : 1 Asset → 12 Pièces de Contenu

```
1 Interview YouTube (5min)
├─ 3 clips TikTok/Reels (60s)
├─ 1 article blog case study
├─ 5 quotes graphics Instagram
├─ 1 thread Twitter highlights
├─ 1 section landing page testimonial
└─ 1 email newsletter feature
```

---

## 👥 STRATÉGIE COMMUNITY BUILDING

### Discord "Squad Planner Lounge"

#### Structure Serveur
- **📢 Annonces** : Updates officiels, changelog
- **🎮 Gaming** : `#trouve-ton-squad` (LFG), channels par jeu
- **💡 Product** : `#feature-requests` (vote), `#bug-reports`, `#showcase`
- **🏆 Communauté** : `#squad-stories`, `#leaderboard`, `#general`
- **🎤 Events** : Voice channel Office Hours + Community Nights

#### Events Récurrents
- **Lundi 20h** : "Office Hours" (30min Q&A founders)
- **Vendredi 21h** : "Community Nights" (gaming sessions publiques)
- **1er du mois** : Nouveau challenge communautaire
- **Dernier vendredi** : Tournoi communautaire

**Objectif :** 5,000 membres, 40% actifs

### Reddit : Présence Active
- Subreddits cibles : r/jeuxvideo, r/FranceGaming, subs jeux spécifiques
- Règle d'or : 10:1 ratio (10 contributions value pour 1 mention produit)
- AMAs trimestriels : "On a construit Squad Planner, AMA"

### Twitter/X : Founder-Led
- Contenu : 40% transparence, 30% gaming insights, 20% product, 10% perso
- 2 posts/jour (matin + soir)
- **Objectif :** 10K followers fin 2026

### TikTok/Reels : Viral Gaming
- Sketchs relatables ("POV: T'attends ton squad qui arrive 30min en retard")
- Features demos (15-30s)
- 1 vidéo/jour pendant 30 jours au lancement
- **Objectif :** 50K followers cumulés, 1 vidéo virale/trimestre

---

## 💰 STRATÉGIE PAID ACQUISITION

### Timing : Quand lancer les ads?
Critères requis :
- ✅ NPS > 50
- ✅ Retention M1 > 50%
- ✅ Free → Premium conversion > 15%
- ✅ LTV calculé (cible > 60€)
- ✅ Budget ≥ 2000€/mois

**Estimation :** Juin 2026 (après Phase 3)

### Budget & Channel Mix

#### Phase Test (Mois 1-3) — 2K€/mois
| Canal | Budget | CPA Cible |
|-------|--------|-----------|
| Reddit Ads | 800€ | 3€ |
| TikTok Ads | 600€ | 4€ |
| Google Search | 400€ | 5€ |
| YouTube Pre-roll | 200€ | 6€ |

#### Phase Scale (Mois 4-6) — 5K€/mois
Doubler budget sur best performers.

#### Phase Blitz (Mois 7-12) — 10-15K€/mois
Tous canaux optimisés simultanément.

### Landing Pages par Canal
- **`/lp/reddit`** : Social proof Reddit, focus anti no-show
- **`/lp/tiktok`** : Vidéo hero, mobile-first, CTA "Télécharger"
- **`/lp/search`** : Trust badges, comparaison, FAQ extensive
- **`/lp/youtube`** : Vidéo demo embed, testimonials vidéo

### Retargeting
- **Visiteurs LP** : "Tu as oublié de créer ton squad?" + 7j trial bonus
- **Signups inactifs** : "Ton squad t'attend sur Squad Planner"
- **Users Free** : "Débloque Voice Party + AI Coach" + 20% off

### ROI Projection
```
1000 signups paid = 4,000€ dépensés
× 20% conversion Premium = 200 Premium subs
× 60€ LTV = 12,000€ revenus
ROI = 200% | Payback = 4 mois
```

---

## 🔄 GROWTH LOOPS

### Loop #1 : Viral Squad Invite (K-factor 1.3) — PRIORITÉ 1
```
Squad A utilise SP → Invite Squad B pour event inter-squad →
Squad B découvre l'interface → S'inscrit → Invite Squad C → BOUCLE
```
**Levier :** Programme parrainage + features inter-squads

### Loop #2 : Reliability Score Social Pressure (K-factor 1.1) — PRIORITÉ 1
```
User A mauvais score → Squad le taquine → User A améliore →
User A flex son score à d'autres squads → Ils veulent aussi → BOUCLE
```
**Levier :** Score partageable (image sociale), achievements, leaderboard

### Loop #3 : Content-Driven SEO — PRIORITÉ 2
```
Guide SEO "Comment organiser [JEU]" → Gamer cherche Google →
Trouve guide → S'inscrit → Devient case study → Nouveau contenu → BOUCLE
```
**Levier :** 40 guides, internal linking, templates

### Loop #4 : Voice Party Stickiness — PRIORITÉ 3
```
Squad utilise Voice Party warm-up → Qualité audio > Discord →
Squad reste dans SP → Moins friction = plus d'invites → BOUCLE
```
**Levier :** Investir qualité audio, spatial audio

### Loop #5 : Public Squads Discovery — PRIORITÉ 2
```
Squad rend profil public → Gamers cherchent squad pour [JEU] →
Rejoignent via SP → Nouveau membre évangélise son ancien squad → BOUCLE
```
**Levier :** SEO page /discover, filtres, verified squads

---

## 📊 PROJECTIONS 2026

| Métrique | Q1 | Q2 | Q3 | Q4 |
|----------|----|----|----|----|
| **Squads actifs** | 100 | 1,000 | 5,000 | 15,000 |
| **Premium subs** | 20 | 200 | 1,000 | 3,000 |
| **MRR** | 100€ | 1K€ | 5K€ | 15K€ |
| **ARR** | 1.2K€ | 12K€ | 60K€ | 180K€ |
| **Trafic organique** | 500 | 2K | 5K | 10K/mois |
| **Followers social** | 500 | 5K | 20K | 50K |
| **Discord members** | 200 | 1K | 3K | 5K |

### Budget Marketing 2026

| Période | Budget | Allocation |
|---------|--------|------------|
| Q1 (Jan-Mar) | 1,000€ | Setup (socials, outils) |
| Q2 (Apr-Jun) | 6,000€ | Content (500€/m) + Ads tests (1K€/m) |
| Q3 (Jul-Sep) | 30,000€ | Ads scale (8K€/m) + Events (6K€) |
| Q4 (Oct-Dec) | 45,000€ | Full blitz ads (15K€/m) |
| **TOTAL 2026** | **82,000€** | **ROI moyen 2.5×** |

---

## TOP 20 IDÉES MARKETING (par Impact/Effort)

| # | Idée | Impact | Effort | Coût |
|---|------|--------|--------|------|
| 1 | **Marketing Reddit** (r/jeuxvideo, gaming FR) | Élevé | 2h/sem | 0€ |
| 2 | **Programme Parrainage "Squad Legends"** | Élevé | 2 sem dev | 500€/mois |
| 3 | **SEO "Comment organiser [JEU]"** (10 guides) | Élevé | 20h | 0€ |
| 4 | **Discord Bot "Squad Planner Sync"** | Élevé | 2 sem dev | 0€ |
| 5 | **Page comparaison "SP vs Discord"** | Élevé | 1 jour | 0€ |
| 6 | **TikTok/Reels gaming fails coordination** | Élevé | 1h/jour | 0€ |
| 7 | **Outil gratuit "Générateur Planning Raid"** | Élevé | 1 sem dev | 0€ |
| 8 | **Programme affiliation streamers Twitch FR** | Élevé | 2 sem | 1K€/mois |
| 9 | **Série YouTube "Guide du Squad Parfait"** | Élevé | 40h | 200€ |
| 10 | **Partenariats guildes e-sport amateurs** | Élevé | 20h | 500€/mois |
| 11 | **Événement "Nuit du Squad Planning"** | Élevé | 1 mois | 1500€ |
| 12 | **Newsletter gaming** | Moyen | 3h/sem | 0€ |
| 13 | **Intégration Raid Helper** | Moyen | 1 sem dev | 0€ |
| 14 | **Challenges communautaires "Squad Goals"** | Moyen | 1 sem dev | 200€/mois |
| 15 | **Publicités Reddit ciblées** | Moyen | 5h setup | 500€/mois |
| 16 | **Guest posts blogs gaming FR** | Moyen | 30h | 0€ |
| 17 | **Testimonials vidéo de squads** | Moyen | 20h | 300€ |
| 18 | **Programme bêta-testeurs "Squad Legends" VIP** | Moyen | 5h/sem | 250€/mois |
| 19 | **Sponsoring tournois e-sport amateurs** | Long terme | 50h | 5K€/an |
| 20 | **App mobile native (stores)** | Long terme | 2 sem | 200€/an |

---

## SPÉCIFICITÉS MARCHÉ FRANÇAIS

### À savoir
- **Communautarisme fort** : Gamers FR très squad-oriented, loyauté au groupe
- **Sensibilité prix** : 4.99€/mois = sweet spot, pas 9.99€
- **Défiance publicité** : Authenticité > Reach, humour > promo directe
- **Reddit/Discord > Twitter** : Hubs principaux gamers FR
- **Langue non-négociable** : App 100% français, pas de "Frenglish"

### Timing saisonnier
- **Éviter** : Juillet-Août (vacances), 24-31 Décembre (fêtes)
- **Opportunités** : Septembre (rentrée), Janvier (bonnes résolutions), releases gros jeux

### Concurrence FR
- Très peu d'outils dédiés coordination gaming FR
- Discord = omnipresent mais reconnu comme mauvais pour le planning
- **Blue Ocean** sur le planning gaming spécifiquement

---

## 🎯 RÉSUMÉ : TOP 3 PRIORITÉS ABSOLUES

### 1. Corriger les problèmes de crédibilité (Phase 1)
**Impact immédiat, effort minimal.** Incohérence squads, faux social proof, pilier 2 — ces bugs de confiance tuent la conversion avant même que le reste ait une chance de fonctionner.

### 2. Programme de Parrainage "Squad Legends"
**Growth loop #1.** Les squads invitent naturellement d'autres squads. K-factor cible >1.2 = croissance auto-entretenue. C'est la différence entre "produit qui stagne" et "produit qui décolle".

### 3. Content SEO + Discord Bot
**Distribution gratuite à grande échelle.** 40 guides SEO = 10K visiteurs/mois. Discord Bot dans 1000+ serveurs = top-of-mind permanent chez les gamers FR. Coût : uniquement du temps.

---

*Audit réalisé le 11 février 2026 avec les skills marketing de coreyhaines31/marketingskills installés dans Claude Code.*
