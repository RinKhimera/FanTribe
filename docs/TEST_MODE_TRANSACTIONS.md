# Mode Test - Dashboard des Transactions 🧪

## Vue d'ensemble

Le dashboard des transactions inclut un **mode test** qui affiche des données fictives pour faciliter le développement et les démonstrations sans avoir besoin de vraies transactions dans la base de données.

## Activation/Désactivation

### Configuration

Le mode test est contrôlé par une constante dans le fichier de la page :

**Fichier** : `app/(app-pages)/(superuser)/superuser/transactions/page.tsx`

```typescript
// 🧪 Mode TEST - Mettre à true pour afficher des données fictives
const USE_TEST_DATA = true // ← Changer ici
```

### Basculer entre les modes

#### ✅ Activer le mode test (données fictives)

```typescript
const USE_TEST_DATA = true
```

#### ✅ Désactiver le mode test (données réelles)

```typescript
const USE_TEST_DATA = false
```

## Données de Test Générées

### 🧪 Transactions (30 au total)

- **Période** : Réparties sur les 2 dernières semaines
- **Montant** : 1000 XAF par transaction
- **Providers** : 70% CinetPay, 30% Stripe (répartition réaliste)
- **Total général** : 30,000 XAF

### 👥 Créatrices de Test (5)

1. **Sophie Martin** (@sophiemartin) - 8000 XAF - 8 transactions
2. **Amélie Dubois** (@ameliedubois) - 6000 XAF - 6 transactions
3. **Clara Bernard** (@clarabernard) - 7000 XAF - 7 transactions
4. **Léa Petit** (@leapetit) - 5000 XAF - 5 transactions
5. **Emma Laurent** (@emmalaurent) - 4000 XAF - 4 transactions

### 👤 Abonnés de Test (6)

1. Jean Dupont (@jeandupont)
2. Pierre Moreau (@pierremoreau)
3. Marie Lambert (@marielambert)
4. Lucas Simon (@lucassimon)
5. Julie Roux (@julieroux)
6. Thomas Blanc (@thomasblanc)

### 🎨 Avatars

Les avatars sont générés via [DiceBear Avataaars](https://api.dicebear.com/) pour des profils visuels uniques et cohérents.

## Fonctionnalités Testables

Avec le mode test activé, vous pouvez tester :

### ✅ Filtres

- **Période** : Modifier la plage de dates (les transactions sont générées sur 2 semaines)
- **Créatrice** : Filtrer par créatrice spécifique (test_creator_1 à test_creator_5)
- **Provider** : Filtrer par Stripe ou CinetPay

### ✅ Statistiques

- **Cartes de résumé** : Revenu total, nombre de transactions, créatrices actives, moyenne
- **Top Earners** : Les 5 créatrices avec le plus de revenus
- **Low Earners** : Les 5 créatrices avec le moins de revenus

### ✅ Tableau

- **Affichage** : Liste complète des 30 transactions
- **Tri** : Par date décroissante (plus récent en premier)
- **Formatage** : Dates relatives, montants en XAF, badges

## Indicateur Visuel

Quand le mode test est activé, un badge **"🧪 Mode Test"** apparaît dans le titre de la page avec un message d'information :

```
Dashboard des Transactions 🧪 Mode Test
Suivi des paiements et performances des créatrices
Les données affichées sont fictives à des fins de démonstration
```

## Queries Convex

### Mode Test (USE_TEST_DATA = true)

- `api.transactions.getTestTransactionsForDashboard`
- `api.transactions.getTestTransactionsSummary`
- `api.transactions.getTestCreators`

### Mode Production (USE_TEST_DATA = false)

- `api.transactions.getTransactionsForDashboard`
- `api.transactions.getTransactionsSummary`
- `api.transactions.getAllCreators`

## Cas d'Usage

### 🎯 Développement

Activez le mode test pour :

- Tester l'interface sans données réelles
- Valider les filtres et le tri
- Vérifier le responsive design
- Tester les calculs de statistiques

### 🎯 Démonstration

Activez le mode test pour :

- Présenter le dashboard aux stakeholders
- Former les administrateurs
- Créer des captures d'écran pour la documentation

### 🎯 Production

Désactivez le mode test pour :

- Afficher les vraies transactions
- Effectuer les paiements réels aux créatrices
- Générer des rapports financiers

## ⚠️ Important

### Avant le Déploiement en Production

**IMPÉRATIF** : Désactiver le mode test avant de déployer en production !

```typescript
const USE_TEST_DATA = false // ✅ PRODUCTION
```

### Checklist Pré-déploiement

- [ ] `USE_TEST_DATA = false` dans le code
- [ ] Vérifier qu'il existe au moins une transaction réelle dans la DB
- [ ] Tester avec un compte SUPERUSER réel
- [ ] Vérifier que les filtres fonctionnent avec les vraies données
- [ ] Valider les calculs de statistiques

## Architecture Technique

### Fichiers Modifiés

**Backend (Convex)**

- `convex/transactions.ts` : Ajout de 3 nouvelles queries de test

**Frontend**

- `app/(app-pages)/(superuser)/superuser/transactions/page.tsx` : Logique de basculement

### Implémentation

```typescript
// Sélection dynamique des queries
const transactionsQuery = USE_TEST_DATA
  ? api.transactions.getTestTransactionsForDashboard
  : api.transactions.getTransactionsForDashboard

const summaryQuery = USE_TEST_DATA
  ? api.transactions.getTestTransactionsSummary
  : api.transactions.getTransactionsSummary

const creatorsQuery = USE_TEST_DATA
  ? api.transactions.getTestCreators
  : api.transactions.getAllCreators

// Utilisation avec useQuery
const transactions = useQuery(transactionsQuery, args)
const summary = useQuery(summaryQuery, args)
const creators = useQuery(creatorsQuery, {})
```

## Avantages du Mode Test

### ✅ Pour les Développeurs

- Développement sans dépendance aux données réelles
- Tests rapides des fonctionnalités
- Pas besoin de créer des transactions manuellement

### ✅ Pour les Stakeholders

- Visualisation immédiate du dashboard
- Compréhension des fonctionnalités
- Pas de risque de corruption de données réelles

### ✅ Pour la Formation

- Environnement sûr pour apprendre
- Données cohérentes et prévisibles
- Possibilité de répéter les démonstrations

## Dépannage

### Le mode test n'affiche pas de données

**Causes possibles** :

1. Utilisateur non authentifié
2. Compte sans permissions SUPERUSER
3. Erreur dans les queries Convex

**Solution** :

- Vérifier la console pour les erreurs
- Confirmer le `accountType = "SUPERUSER"`
- Vérifier que Convex est bien déployé

### Les filtres ne fonctionnent pas en mode test

**Cause** : Les IDs de test ne correspondent pas

**Solution** :

- Les filtres par créatrice utilisent des IDs fictifs (`test_creator_1`, etc.)
- Sélectionner une créatrice dans la liste déroulante
- Ne pas entrer d'ID manuellement

## Support

Pour toute question sur le mode test, consulter :

- `docs/TRANSACTIONS_DASHBOARD_GUIDE.md` - Guide complet
- `convex/transactions.ts` - Implémentation des queries de test

---

**Dernière mise à jour** : Octobre 2025  
**Version** : 1.0.0  
**Mode** : Test & Production
