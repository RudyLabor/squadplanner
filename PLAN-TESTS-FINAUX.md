# PLAN — 0% Tests Bidons + 100% Couverture + Phase P3.4

## PARTIE A : 0% Tests Bidons (actuellement ~10%)

### A1 — Réécrire `a11y.test.tsx` (28 tests axe-only → vrais tests a11y)
**Fichier :** `src/components/ui/__tests__/a11y.test.tsx`
**Problème :** 28 tests répètent `expect(await axe(container)).toHaveNoViolations()` — axe ne détecte que ~30% des problèmes a11y
**Action :** Garder les tests axe, mais AJOUTER pour chaque composant :
- Tests de navigation clavier (Tab, Enter, Space, Escape)
- Tests focus trap (Dialog, Sheet, Drawer, Popover)
- Tests ARIA states (aria-expanded, aria-selected, aria-checked, aria-disabled)
- Tests de rôles ARIA appropriés

### A2 — Remplacer `toHaveClass` par assertions comportementales (15 fichiers UI)
**Fichiers affectés :** 15 fichiers dans `src/components/ui/__tests__/` avec 59 occurrences de `toHaveClass`
**Priorité haute (beaucoup d'occurrences) :**
- `GameCover.test.tsx` (16 toHaveClass)
- `LoadingMore.test.tsx` (11 toHaveClass)
- `AdaptiveImage.test.tsx` (5 toHaveClass)
- `AnimatedList.test.tsx` (5 toHaveClass)
- `ScrollProgress.test.tsx` (4 toHaveClass)
- `CrossfadeTransition.test.tsx` (3 toHaveClass)
- `SharedElement.test.tsx` (3 toHaveClass)

**Action :** Remplacer `expect(el).toHaveClass('bg-primary')` par assertions comportementales/ARIA.

### A3 — Fixer anti-patterns E2E OR (7 occurrences, 5 fichiers)
**Fichiers :**
- `e2e/critical-flows.spec.ts` (ligne 86)
- `e2e/auth.spec.ts` (ligne 384)
- `e2e/settings.spec.ts` (ligne 448)
- `e2e/discover.spec.ts` (lignes 32, 54)
- `e2e/onboarding.spec.ts` (ligne 126)
- `e2e/messages.spec.ts` (ligne 304)

**Action :** Remplacer chaque OR par des chemins explicites avec `if/else` et assertions spécifiques.

### A4 — Fixer `.catch(() => false)` (2 fichiers)
- `src/lib/__tests__/motionApple.test.tsx`
- `src/components/__tests__/LazyComponents.test.tsx`

### A5 — Auditer "renders without crashing" comme test principal (55 fichiers)
**Action :** Pour chaque fichier où c'est le SEUL test, ajouter des tests comportementaux.

---

## PARTIE B : 100% Couverture Fichiers

### B1 — Routes sans tests (3 fichiers)
- `src/routes/referrals.tsx` → Créer test
- `src/routes/session-share.tsx` → Créer test
- `src/routes/discord-callback.tsx` → Créer route test

### B2 — Composants sans tests
- `src/components/PlanBadge.tsx` → Créer test

### B3 — Scan final pour tout fichier sans test

---

## PARTIE C : Phase P3.4 — Tests Avancés

### C1 — Tests d'intégration
### C2 — Tests de charge
### C3 — Tests de sécurité
### C4 — Tests de régression visuelle

---

## ORDRE : A → B → C
