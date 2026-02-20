# Guide de test du système i18n

Ce document explique comment tester l'infrastructure i18n qui vient d'être mise en place.

## ✅ Vérifications rapides

### 1. Le sélecteur de langue dans Settings

**Accès:** Paramètres → Région → Langue

1. Ouvrir l'application
2. Se connecter (si nécessaire)
3. Aller dans **Paramètres** (Settings)
4. Scroller jusqu'à la section **Région**
5. Cliquer sur **Français** ou **English** dans le sélecteur de langue

**Résultat attendu:**
- ✅ Le choix est sauvegardé immédiatement
- ✅ Toast "Paramètres sauvegardés" / "Settings saved" apparaît
- ✅ Le choix persiste après rechargement de la page
- ✅ La valeur est stockée dans `localStorage` (clé: `squad-planner-locale`)

### 2. Vérifier localStorage

**Console navigateur:**

```javascript
// Voir la locale actuelle
localStorage.getItem('squad-planner-locale')
// → 'fr' ou 'en'

// Changer manuellement
localStorage.setItem('squad-planner-locale', 'en')
// Recharger la page
location.reload()
```

**Résultat attendu:**
- ✅ La locale est bien stockée
- ✅ Après rechargement, le sélecteur affiche la bonne valeur

### 3. Build production

**Commande:**

```bash
npm run build
```

**Résultat attendu:**
- ✅ Build réussit sans erreurs
- ✅ Pas d'erreurs TypeScript liées à i18n
- ✅ Fichiers générés dans `build/`

## 🧪 Composant de démonstration

### Option A: Demo widget (recommandé)

Un composant de démonstration a été créé pour tester visuellement le système.

**1. Importer dans une page:**

```tsx
// Par exemple dans src/pages/Home.tsx
import { LanguageDemo } from '../components/LanguageDemo'

export function Home() {
  return (
    <div>
      {/* Votre contenu existant */}

      {/* Ajouter temporairement */}
      <LanguageDemo />
    </div>
  )
}
```

**2. Relancer le serveur de dev:**

```bash
npm run dev
```

**3. Ouvrir la page dans le navigateur**

Un widget de démonstration apparaît en bas à droite avec :
- Sélecteur FR/EN
- Exemples de traductions qui changent en temps réel
- Exemples de pluriels et fonctions dynamiques

**4. Tester:**
- Cliquer sur FR → toutes les traductions passent en français
- Cliquer sur EN → toutes les traductions passent en anglais
- Recharger la page → le choix persiste

**5. Retirer le composant:**

Une fois les tests terminés, retirer `<LanguageDemo />` du composant.

### Option B: Test dans la console

**Console navigateur:**

```javascript
// 1. Importer le store
const { useI18nStore } = await import('/src/lib/i18n.ts')

// 2. Voir la locale actuelle
useI18nStore.getState().locale
// → 'fr'

// 3. Changer la locale
useI18nStore.getState().setLocale('en')

// 4. Vérifier le changement
useI18nStore.getState().locale
// → 'en'

// 5. Tester une traduction (dans un composant React)
const { useT } = await import('/src/lib/i18n.ts')
// Utiliser dans un composant: const t = useT(); t('nav.home')
```

## 🔍 Tests manuels détaillés

### Test 1: Persistance

1. Ouvrir l'app
2. Aller dans Settings
3. Changer la langue en English
4. Recharger la page (F5)
5. Vérifier que le sélecteur affiche toujours "English"

**✅ Pass si:** La langue reste "English" après rechargement

### Test 2: Synchronisation

1. Ouvrir l'app dans 2 onglets
2. Dans l'onglet 1, changer la langue en English
3. Dans l'onglet 2, recharger la page
4. Vérifier que le sélecteur affiche "English"

**✅ Pass si:** Les deux onglets sont synchronisés

### Test 3: TypeScript

1. Ouvrir `src/lib/i18n.ts` dans l'éditeur
2. Essayer d'accéder à une clé inexistante:

```tsx
import { useT } from '../lib/i18n'

function Test() {
  const t = useT()
  return <div>{t('this.key.does.not.exist')}</div>
}
```

3. Vérifier que TypeScript NE génère PAS d'erreur (le système est permissif)
4. En runtime, la clé sera affichée + warning console

**✅ Pass si:** Pas d'erreur TS, warning en console en dev

### Test 4: Migration d'un composant

1. Choisir un composant simple (ex: un bouton)
2. Remplacer le texte hardcodé par une traduction

**Avant:**
```tsx
<button>Créer</button>
```

**Après:**
```tsx
import { useT } from '../lib/i18n'

function MyComponent() {
  const t = useT()
  return <button>{t('actions.create')}</button>
}
```

3. Tester dans les deux langues
4. Vérifier que "Créer" devient "Create" en EN

**✅ Pass si:** La traduction change selon la langue

## 📊 Checklist de validation

- [ ] **Settings:** Le sélecteur FR/EN fonctionne
- [ ] **Toast:** Message "Paramètres sauvegardés" / "Settings saved"
- [ ] **localStorage:** Valeur stockée et récupérée
- [ ] **Persistance:** Choix conservé après rechargement
- [ ] **Build:** `npm run build` réussit
- [ ] **TypeScript:** Pas d'erreurs de compilation
- [ ] **Demo widget:** Traductions changent en temps réel (si testé)
- [ ] **Migration:** Un composant migré fonctionne (si testé)

## 🐛 Problèmes potentiels

### Problème: Le choix de langue ne persiste pas

**Solution:**
- Vérifier que localStorage est activé dans le navigateur
- Vérifier que le domaine n'est pas en mode incognito
- Vérifier les erreurs console

### Problème: TypeError sur useI18nStore

**Solution:**
- Vérifier que Zustand est installé: `npm list zustand`
- Si manquant: `npm install zustand`

### Problème: Traductions ne changent pas

**Solution:**
- Vérifier que le composant utilise bien `useT()`
- Vérifier que le composant se re-render quand la locale change
- Vérifier la console pour des erreurs

### Problème: Build échoue

**Solution:**
- Vérifier les erreurs TypeScript: `npm run typecheck`
- Vérifier que tous les imports sont corrects
- Nettoyer et rebuilder: `rm -rf build && npm run build`

## 📝 Rapports de bugs

Si un problème persiste:

1. Noter la version de Node: `node --version`
2. Noter les erreurs console complètes
3. Noter les étapes de reproduction
4. Vérifier les fichiers créés sont bien présents:
   - `src/lib/i18n.ts`
   - `src/locales/fr.ts`
   - `src/locales/en.ts`

## 🎯 Résultats attendus

Après tous les tests, vous devriez avoir:

1. ✅ Un sélecteur de langue fonctionnel dans Settings
2. ✅ Le choix persiste dans localStorage
3. ✅ Le build compile sans erreurs
4. ✅ ~200 clés de traduction disponibles
5. ✅ Infrastructure prête pour migration progressive

## 📚 Prochaines étapes

Une fois les tests validés:

1. **Migration progressive:** Commencer par la navigation (voir `MIGRATION-EXAMPLE.md`)
2. **Ajout de traductions:** Enrichir `fr.ts` et `en.ts` selon les besoins
3. **Feedback utilisateur:** Tester avec de vrais utilisateurs anglophones

## 🔗 Ressources

- **Documentation complète:** `src/locales/README.md`
- **Guide de migration:** `MIGRATION-EXAMPLE.md`
- **Exemples d'utilisation:** `src/lib/i18n.example.tsx`
- **Liste des clés:** `src/locales/TRANSLATION-KEYS.md`
- **Quick start:** `src/locales/QUICK-START.md`

---

**Bonne chance avec les tests! 🚀**
