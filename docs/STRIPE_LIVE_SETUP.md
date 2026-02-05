# Configuration Stripe Mode Live - Squad Planner

Ce guide documente toutes les etapes necessaires pour passer Stripe du mode Test au mode Live (production).

## Table des matieres

1. [Prerequis](#prerequis)
2. [Architecture actuelle](#architecture-actuelle)
3. [Variables d'environnement](#variables-denvironnement)
4. [Configuration Stripe Dashboard](#configuration-stripe-dashboard)
5. [Checklist de migration](#checklist-de-migration)
6. [Tests de validation](#tests-de-validation)
7. [Rollback](#rollback)

---

## Prerequis

### Compte Stripe
- [ ] Compte Stripe cree et verifie
- [ ] Informations bancaires ajoutees (IBAN pour recevoir les paiements)
- [ ] Informations d'entreprise completees (ou particulier)
- [ ] Verification d'identite validee par Stripe

### Produits et Prix
- [ ] Produit "Squad Planner Premium" cree en mode **Live**
- [ ] Prix mensuel configure (ex: 19.99 EUR/mois)
- [ ] Prix annuel configure (ex: 191.90 EUR/an - ~20% reduction)

### Infrastructure
- [ ] Acces au dashboard Supabase (pour configurer les secrets)
- [ ] Acces au fichier `.env` de production
- [ ] Edge Functions deployees et fonctionnelles en mode Test

---

## Architecture actuelle

### Edge Functions Stripe

| Fonction | Description | Fichier |
|----------|-------------|---------|
| `create-checkout` | Cree une session de paiement Stripe Checkout | `supabase/functions/create-checkout/index.ts` |
| `stripe-webhook` | Recoit les evenements Stripe (paiements, annulations) | `supabase/functions/stripe-webhook/index.ts` |
| `create-portal` | Cree une session du portail client Stripe | `supabase/functions/create-portal/index.ts` |
| `cancel-subscription` | Annule un abonnement (fin de periode) | `supabase/functions/cancel-subscription/index.ts` |

### Flux de paiement

```
1. Utilisateur clique "Passer Premium"
        |
        v
2. Frontend appelle create-checkout (Edge Function)
        |
        v
3. Stripe Checkout s'ouvre (page hebergee par Stripe)
        |
        v
4. Utilisateur entre ses infos de paiement
        |
        v
5. Stripe envoie webhook "checkout.session.completed"
        |
        v
6. stripe-webhook met a jour la BDD (subscriptions, squads, profiles)
        |
        v
7. Squad passe en Premium
```

### Evenements webhook geres

- `checkout.session.completed` - Paiement reussi
- `customer.subscription.updated` - Modification d'abonnement
- `customer.subscription.deleted` - Abonnement annule
- `invoice.payment_failed` - Echec de paiement

---

## Variables d'environnement

### Frontend (.env)

```bash
# Cle publique Stripe (visible cote client)
# Mode Test: pk_test_xxx
# Mode Live: pk_live_xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE_PUBLIQUE

# Price IDs Stripe (a creer dans le dashboard Live)
VITE_STRIPE_PRICE_MONTHLY=price_XXXXXXXXX
VITE_STRIPE_PRICE_YEARLY=price_XXXXXXXXX
```

### Supabase Secrets (Edge Functions)

```bash
# Definir les secrets Supabase (remplace les valeurs Test)
supabase secrets set STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_SECRETE
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET
```

### Ou trouver ces cles ?

| Cle | Emplacement dans Stripe Dashboard |
|-----|----------------------------------|
| `pk_live_xxx` | Developers > API keys > Publishable key |
| `sk_live_xxx` | Developers > API keys > Secret key |
| `whsec_xxx` | Developers > Webhooks > (votre endpoint) > Signing secret |
| `price_xxx` | Products > (votre produit) > Pricing > (copier l'ID) |

---

## Configuration Stripe Dashboard

### 1. Creer le produit Premium

1. Aller dans **Products** > **Add product**
2. Remplir:
   - **Name**: Squad Planner Premium
   - **Description**: Acces illimite a toutes les fonctionnalites premium de Squad Planner
   - **Image**: (optionnel) Logo de l'app

### 2. Configurer les prix

#### Prix mensuel
- **Pricing model**: Standard pricing
- **Price**: 19.99 EUR
- **Billing period**: Monthly
- **Price ID**: Copier et sauvegarder (format: `price_xxx`)

#### Prix annuel
- **Pricing model**: Standard pricing
- **Price**: 191.90 EUR (equivalent a ~15.99/mois, 20% de reduction)
- **Billing period**: Yearly
- **Price ID**: Copier et sauvegarder

### 3. Configurer le webhook

1. Aller dans **Developers** > **Webhooks**
2. **Add endpoint**
3. Configurer:
   - **Endpoint URL**: `https://nxbqiwmfyafgshxzczxo.supabase.co/functions/v1/stripe-webhook`
   - **Events to send**:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
4. **Add endpoint**
5. Copier le **Signing secret** (`whsec_xxx`)

### 4. Configurer le Customer Portal

1. Aller dans **Settings** > **Billing** > **Customer portal**
2. Activer les fonctionnalites:
   - [x] Customers can view their invoices
   - [x] Customers can update payment methods
   - [x] Customers can cancel subscriptions
3. **Save changes**

---

## Checklist de migration

### Preparation (J-1)

- [ ] Verifier que le compte Stripe Live est completement configure
- [ ] Creer le produit et les prix en mode Live
- [ ] Noter tous les Price IDs Live
- [ ] Configurer le webhook Live avec l'URL de production
- [ ] Copier le Webhook Signing Secret Live

### Migration (Jour J)

```bash
# 1. Mettre a jour les secrets Supabase
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx

# 2. Redeployer les Edge Functions pour prendre en compte les nouveaux secrets
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy create-portal
supabase functions deploy cancel-subscription

# 3. Mettre a jour le .env de production
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# 4. Rebuild et deployer le frontend
npm run build
# (deployer selon votre hebergeur)
```

### Post-migration

- [ ] Tester un vrai paiement avec une vraie carte
- [ ] Verifier que le webhook est bien recu
- [ ] Verifier que la BDD est mise a jour (subscription, squad is_premium)
- [ ] Rembourser le paiement de test via le dashboard Stripe
- [ ] Surveiller les logs des Edge Functions

---

## Tests de validation

### Test 1: Checkout complet

1. Se connecter avec un compte utilisateur
2. Creer ou rejoindre une squad
3. Cliquer sur "Passer Premium"
4. Completer le paiement avec une vraie carte
5. Verifier:
   - [ ] Redirection vers la page succes
   - [ ] Squad marquee `is_premium: true`
   - [ ] Subscription creee dans la BDD
   - [ ] Webhook recu (verifier logs Supabase)

### Test 2: Portail client

1. Aller sur le profil utilisateur
2. Cliquer sur "Gerer mon abonnement"
3. Verifier l'acces au portail Stripe
4. Tester la visualisation des factures

### Test 3: Annulation

1. Depuis le portail ou l'app, annuler l'abonnement
2. Verifier:
   - [ ] `cancel_at_period_end: true` dans la BDD
   - [ ] L'acces Premium reste actif jusqu'a la fin de la periode
   - [ ] Webhook `customer.subscription.updated` recu

### Verification des logs

```bash
# Voir les logs des Edge Functions
supabase functions logs stripe-webhook --tail
supabase functions logs create-checkout --tail
```

---

## Rollback

En cas de probleme, revenir au mode Test:

```bash
# 1. Remettre les cles Test
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_test_xxx

# 2. Redeployer
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy create-portal
supabase functions deploy cancel-subscription

# 3. Mettre a jour le .env frontend
# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# 4. Rebuild frontend
npm run build
```

---

## Securite

### Bonnes pratiques

1. **Ne jamais commiter les cles API** - Utiliser `.env` et `.gitignore`
2. **Cle secrete uniquement cote serveur** - `sk_live_xxx` dans Supabase Secrets uniquement
3. **Verifier les signatures webhook** - Deja implemente dans `stripe-webhook`
4. **HTTPS obligatoire** - Stripe refuse les webhooks en HTTP

### Variables sensibles

| Variable | Securite | Ou la stocker |
|----------|----------|---------------|
| `pk_live_xxx` | Publique | `.env` frontend |
| `sk_live_xxx` | **SECRETE** | Supabase Secrets uniquement |
| `whsec_xxx` | **SECRETE** | Supabase Secrets uniquement |

---

## Support

### Ressources utiles

- [Documentation Stripe](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

### En cas de probleme

1. Verifier les logs Stripe Dashboard > Developers > Logs
2. Verifier les logs Supabase Edge Functions
3. Verifier que les secrets sont bien configures: `supabase secrets list`
4. Tester le webhook avec Stripe CLI: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`

---

## Historique des modifications

| Date | Version | Description |
|------|---------|-------------|
| 2024-02-05 | 1.0 | Creation initiale du guide |
