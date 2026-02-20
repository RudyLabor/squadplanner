# Checklist Publication App Store & Google Play

> **Dernière mise à jour :** 20 février 2026
> **État global :** ~80% — l'implémentation technique est en place, il reste la configuration externe.

---

## Ce qui est FAIT (code en place)

| Composant | Fichier | Statut |
|-----------|---------|--------|
| Config Capacitor (appId, appName, plugins) | `capacitor.config.ts` | ✅ |
| Privacy Manifest iOS | `ios/App/App/PrivacyInfo.xcprivacy` | ✅ |
| Entitlements iOS (push prod + associated domains) | `ios/App/App/App.entitlements` | ✅ |
| Info.plist (permissions micro/caméra + URL scheme) | `ios/App/App/Info.plist` | ✅ |
| AndroidManifest (intent-filters, deep links, permissions) | `android/app/src/main/AndroidManifest.xml` | ✅ |
| Android build.gradle (signing config, versionCode) | `android/app/build.gradle` | ✅ |
| Deep linking hook | `src/hooks/useDeepLink.ts` | ✅ |
| In-App Purchase hook | `src/hooks/useInAppPurchase.ts` | ✅ |
| App Store Review hook | `src/hooks/useAppStoreReview.ts` | ✅ |
| Validation reçus IAP server-side | `supabase/functions/validate-iap-receipt/index.ts` | ✅ |
| Suppression compte RGPD | `supabase/functions/delete-user-data/index.ts` | ✅ |
| Migration recurring_sessions | `supabase/migrations/20260220000001_recurring_sessions.sql` | ✅ |
| CI/CD mobile (GitHub Actions) | `.github/workflows/mobile-build.yml` | ✅ |
| Icônes app iOS + Android | `ios/App/App/Assets.xcassets/` + `android/app/src/main/res/` | ✅ |
| Splash screens | configurés iOS + Android | ✅ |
| apple-app-site-association (structure) | `public/.well-known/apple-app-site-association` | ✅ |
| assetlinks.json (structure) | `public/.well-known/assetlinks.json` | ✅ |

---

## Ce qu'il RESTE à faire

### 1. Comptes développeur

- [ ] **Créer un compte Apple Developer** (99 €/an) → https://developer.apple.com
- [ ] **Créer un compte Google Play Developer** (25 $ one-time) → https://play.google.com/console

> Délai d'approbation Apple : ~48h. Commencer par ça.

---

### 2. Remplacer les placeholders dans le code

- [ ] **`TEAM_ID`** dans `public/.well-known/apple-app-site-association`
  → Remplacer `TEAM_ID.fr.squadplanner.app` par ton Apple Team ID
  → Visible dans developer.apple.com > Membership
- [ ] **`SHA256_FINGERPRINT`** dans `public/.well-known/assetlinks.json`
  → Remplacer `SHA256_FINGERPRINT_TO_REPLACE` par l'empreinte SHA256 du keystore Android
  → Obtenue via `keytool -list -v -keystore release.keystore`

---

### 3. Installer les plugins Capacitor manquants

```bash
npm install @capacitor/app @nicklason/capacitor-iap @capawesome/capacitor-app-review
npx cap sync
```

Ces packages sont importés dynamiquement dans le code mais **pas encore dans package.json**.

---

### 4. Générer le keystore Android

```bash
keytool -genkey -v \
  -keystore android/keystore/release.keystore \
  -alias squadplanner \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Puis configurer les secrets GitHub Actions :

| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE_PATH` | Chemin vers le keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Mot de passe du keystore |
| `ANDROID_KEY_ALIAS` | Alias de la clé (squadplanner) |
| `ANDROID_KEY_PASSWORD` | Mot de passe de la clé |

---

### 5. Configurer le signing iOS

- [ ] Ouvrir `ios/App/App.xcworkspace` dans Xcode
- [ ] Sélectionner ton Apple Developer Team dans Signing & Capabilities
- [ ] Vérifier que le provisioning profile est créé automatiquement
- [ ] Tester sur un vrai device via TestFlight

---

### 6. Configurer Firebase (push notifications)

- [ ] Créer un projet Firebase → https://console.firebase.google.com
- [ ] Télécharger `google-services.json` → `android/app/`
- [ ] Télécharger `GoogleService-Info.plist` → `ios/App/App/`
- [ ] Configurer APNs dans Firebase (clé .p8 depuis Apple Developer)

---

### 7. Créer les produits In-App Purchase

#### App Store Connect

Créer 4 abonnements auto-renouvelables :

| Product ID | Prix | Tier |
|------------|------|------|
| `fr.squadplanner.premium.monthly` | 4,99 €/mois | Premium |
| `fr.squadplanner.premium.yearly` | 47,88 €/an | Premium |
| `fr.squadplanner.squadleader.monthly` | 14,99 €/mois | Squad Leader |
| `fr.squadplanner.squadleader.yearly` | 143,88 €/an | Squad Leader |

#### Google Play Console

Créer les mêmes produits avec ces IDs :

| Product ID | Prix | Tier |
|------------|------|------|
| `premium_monthly` | 4,99 €/mois | Premium |
| `premium_yearly` | 47,88 €/an | Premium |
| `squad_leader_monthly` | 14,99 €/mois | Squad Leader |
| `squad_leader_yearly` | 143,88 €/an | Squad Leader |

---

### 8. Variables d'environnement Supabase

Pour la validation des reçus IAP (edge function `validate-iap-receipt`) :

```
APPLE_APP_STORE_SERVER_KEY=<clé privée .p8 encodée>
APPLE_APP_STORE_KEY_ID=<Key ID depuis App Store Connect>
APPLE_APP_STORE_ISSUER_ID=<Issuer ID depuis App Store Connect>
APPLE_ENVIRONMENT=sandbox  # passer à "production" avant la soumission
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=<JSON du service account Google>
GOOGLE_PLAY_PACKAGE_NAME=fr.squadplanner.app
```

Configurer via :

```bash
supabase secrets set APPLE_APP_STORE_SERVER_KEY="..."
supabase secrets set APPLE_APP_STORE_KEY_ID="..."
# etc.
```

---

### 9. Push du workflow GitHub Actions

Le fichier `.github/workflows/mobile-build.yml` existe localement mais n'a pas pu être poussé (token GitHub sans scope `workflow`).

**Option A :** Mettre à jour le token GitHub avec le scope `workflow`, puis :
```bash
git add .github/workflows/mobile-build.yml
git commit -m "ci: ajouter le workflow mobile build"
git push
```

**Option B :** Ajouter le fichier manuellement via l'interface GitHub (Actions > New workflow).

---

### 10. Assets marketing

#### App Store Connect (iOS)

- [ ] **Screenshots iPhone 6.7"** (1290 × 2796 px) — iPhone 15 Pro Max — min 3, max 10
- [ ] **Screenshots iPhone 5.5"** (1242 × 2208 px) — iPhone 8 Plus — min 3, max 10
- [ ] **Screenshots iPad** (2048 × 2732 px) — si universel
- [ ] **Icône App Store** : 1024 × 1024 PNG, sans transparence, sans coins arrondis
- [ ] **Description courte** : max 80 caractères
- [ ] **Description longue** : features, avantages, mots-clés
- [ ] **Mots-clés ASO** : max 100 caractères, séparés par des virgules
- [ ] **Vidéo preview** (optionnel, 15-30 sec, fortement recommandé)
- [ ] **Texte promotionnel** : max 170 caractères (modifiable sans nouvelle soumission)

#### Google Play Console (Android)

- [ ] **Screenshots phone** (min 2, max 8) — 16:9 ou 9:16
- [ ] **Screenshots tablet 7"** et **tablet 10"** (si app tablette)
- [ ] **Feature graphic** : 1024 × 500 px (obligatoire)
- [ ] **Icône haute résolution** : 512 × 512 PNG
- [ ] **Description courte** : max 80 caractères
- [ ] **Description longue** : max 4000 caractères
- [ ] **Vidéo YouTube** (optionnel)

#### Informations communes

- [ ] **Catégorie** : Social Networking (iOS) / Social (Android)
- [ ] **Classification âge** : remplir le questionnaire de rating (probablement 12+ / PEGI 12)
- [ ] **URL politique de confidentialité** : `https://squadplanner.fr/legal`
- [ ] **URL support** : `https://squadplanner.fr/help`
- [ ] **Coordonnées développeur** (email + adresse obligatoires sur Google Play)

---

### 11. TestFlight / Test interne

- [ ] Build iOS → upload via Xcode (`Product > Archive > Distribute`) ou `xcrun altool`
- [ ] Inviter des testeurs TestFlight (beta interne, max 100 sans review)
- [ ] Build Android → `./gradlew bundleRelease` → upload AAB sur Google Play Console (piste test interne)
- [ ] Tester les IAP en sandbox (Apple) / licence test (Google)
- [ ] Tester les deep links sur les deux plateformes
- [ ] Tester les push notifications
- [ ] Tester la suppression de compte (RGPD)
- [ ] Vérifier le comportement offline

---

## Ordre recommandé

| Étape | Action | Durée estimée |
|-------|--------|---------------|
| 1 | Comptes développeur Apple + Google | 1-3 jours (attente approbation) |
| 2 | Installer plugins npm + `cap sync` | 10 min |
| 3 | Firebase + push notifications | 1h |
| 4 | Remplacer placeholders (TEAM_ID + SHA256) | 30 min |
| 5 | Signing iOS (Xcode) + keystore Android | 1h |
| 6 | Créer produits IAP sur les deux stores | 1h |
| 7 | Secrets Supabase + GitHub Actions | 30 min |
| 8 | Push workflow CI/CD | 5 min |
| 9 | TestFlight + test interne Google Play | 2-3 jours |
| 10 | Assets marketing (screenshots, description) | 1-2 jours |
| 11 | Soumission App Store + Google Play | 1-2 semaines (review Apple) |

---

## Risques de rejet connus

| Risque | Mitigation | Statut |
|--------|-----------|--------|
| Pas d'IAP pour les abonnements | Hook + validation server-side implémentés | ✅ Implémenté |
| Pas de suppression de compte | Edge function delete-user-data | ✅ Implémenté |
| Privacy Manifest manquant | PrivacyInfo.xcprivacy configuré | ✅ Implémenté |
| Permissions non justifiées | Descriptions françaises dans Info.plist | ✅ Implémenté |
| Deep links cassés | apple-app-site-association + assetlinks.json | ⚠️ Placeholders à remplacer |
| Crash au lancement | Stubs Capacitor pour build web | ✅ Implémenté |
| Contenu minimum insuffisant | App fonctionnelle avec squads, sessions, chat | ✅ OK |
