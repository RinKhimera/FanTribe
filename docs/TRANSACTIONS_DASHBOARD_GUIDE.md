# Dashboard de Suivi des Transactions - Paiement Créatrices

## Vue d'ensemble

Le dashboard des transactions permet aux administrateurs (SUPERUSER) de suivre et analyser tous les paiements effectués sur la plateforme FanTribe. Il facilite la gestion des paiements bihebdomadaires aux créatrices et offre une vue claire des performances financières.

## Accès

- **URL**: `/superuser/transactions`
- **Permissions**: Réservé aux utilisateurs avec `accountType = "SUPERUSER"`
- **Navigation**: Accessible depuis le dashboard principal superuser

## Fonctionnalités

### 1. Filtres

Le dashboard offre trois types de filtres configurables :

#### Période

- **Par défaut**: 2 dernières semaines (14 jours)
- **Options disponibles**:
  - 2 dernières semaines
  - Dernier mois (30 jours)
  - 3 derniers mois (90 jours)
  - 6 derniers mois (180 jours)
  - Dernière année (365 jours)

#### Créatrice

- Filtre par créatrice spécifique
- Liste déroulante avec toutes les créatrices actives
- Option "Toutes les créatrices" pour vue globale

#### Moyen de paiement

- **Stripe**: Paiements par carte bancaire
- **CinetPay**: Paiements mobile money (Orange Money, MTN Mobile Money)
- Option "Tous les moyens" pour vue globale

### 2. Statistiques Agrégées

Le dashboard affiche 4 cartes de statistiques principales :

1. **Revenu Total**
   - Montant total des transactions pour la période
   - Formaté en devise locale (XAF par défaut)

2. **Transactions**
   - Nombre total de paiements réussis
   - Statut: uniquement les transactions `succeeded`

3. **Créatrices Actives**
   - Nombre de créatrices ayant reçu des paiements
   - Pour la période sélectionnée

4. **Moyenne/Transaction**
   - Montant moyen par transaction
   - Calcul: Revenu Total ÷ Nombre de Transactions

### 3. Top & Low Earners

Deux cartes présentent le classement des créatrices :

#### Top Earners

- Les 5 créatrices avec les meilleurs revenus
- Affiche:
  - Classement (1-5)
  - Nom et username
  - Nombre de transactions
  - Montant total généré

#### Low Earners

- Les 5 créatrices avec les revenus les plus faibles
- Même format d'affichage
- Permet d'identifier les créatrices nécessitant un accompagnement

### 4. Tableau Détaillé des Transactions

Liste complète de toutes les transactions avec :

- **Date**: Date exacte + temps relatif ("il y a X jours")
- **Créatrice**: Avatar, nom, username
- **Abonné**: Avatar, nom, username
- **Moyen de paiement**: Badge coloré (Stripe/CinetPay)
- **Devise**: Badge avec code devise (XAF, EUR, etc.)
- **Montant**: Formaté en devise locale, aligné à droite

Les transactions sont triées par date décroissante (plus récentes en premier).

## Architecture Technique

### Fichiers Convex

**`convex/transactions.ts`**

- `getTransactionsForDashboard`: Récupère les transactions filtrées
- `getTransactionsSummary`: Calcule les statistiques agrégées
- `getAllCreators`: Liste toutes les créatrices pour le filtre

### Composants

**Structure des composants** (pattern `_components`):

```
app/(app-pages)/(superuser)/superuser/transactions/
├── page.tsx                           # Page principale
└── _components/
    ├── transactions-filters.tsx       # Filtres de recherche
    ├── transactions-table.tsx         # Tableau des transactions
    ├── transactions-summary-cards.tsx # Cartes de statistiques
    └── top-earners-card.tsx          # Cartes de classement
```

### Schéma de Données

**Table `transactions`** (convex/schema.ts):

```typescript
{
  subscriptionId: Id<"subscriptions">
  subscriberId: Id<"users">
  creatorId: Id<"users">
  amount: number
  currency: string
  status: "pending" | "succeeded" | "failed" | "refunded"
  provider: string // "stripe" ou "cinetpay"
  providerTransactionId: string
  _creationTime: number // Timestamp de création
}
```

**Index utilisés**:

- `by_creator`: Filtre par créatrice
- `by_subscriber`: Filtre par abonné

## Cas d'Usage

### 1. Paiement Bihebdomadaire des Créatrices

**Workflow**:

1. Ouvrir le dashboard `/superuser/transactions`
2. Sélectionner la période "2 dernières semaines"
3. Consulter le résumé par créatrice dans "Top Earners"
4. Exporter ou noter les montants à payer
5. Effectuer les virements bancaires
6. Répéter toutes les 2 semaines

### 2. Analyse des Performances

**Top Performers**:

- Identifier les créatrices à forte audience
- Comprendre les stratégies efficaces
- Potentiellement les mettre en avant sur la plateforme

**Low Performers**:

- Identifier les créatrices ayant besoin de soutien
- Proposer des formations ou conseils
- Analyser les raisons de la faible performance

### 3. Analyse des Moyens de Paiement

**Questions répondues**:

- Quel moyen de paiement est le plus utilisé ?
- Stripe (cartes) vs CinetPay (mobile money)
- Adapter la stratégie marketing en conséquence

### 4. Suivi des Tendances

**Périodes longues**:

- Utiliser les filtres 3 mois, 6 mois, 1 an
- Observer la croissance des revenus
- Identifier les tendances saisonnières

## Permissions et Sécurité

### Contrôles d'Accès

**Niveau Query Convex**:

```typescript
const currentUser = await ctx.db
  .query("users")
  .withIndex("by_tokenIdentifier", (q) =>
    q.eq("tokenIdentifier", identity.tokenIdentifier),
  )
  .unique()

if (!currentUser || currentUser.accountType !== "SUPERUSER") {
  throw new Error("Accès refusé : uniquement pour les administrateurs")
}
```

**Niveau Page React**:

```tsx
if (!currentUser || currentUser.accountType !== "SUPERUSER") {
  return <Card>Accès refusé</Card>
}
```

### Données Sensibles

- **Transactions**: Affichage complet réservé aux SUPERUSER
- **Montants**: Informations financières protégées
- **Identités**: Créatrices et abonnés identifiés clairement

## Améliorations Futures

### Fonctionnalités Suggérées

1. **Export CSV/Excel**
   - Exporter les données filtrées
   - Pour comptabilité ou analyse externe

2. **Graphiques de Tendances**
   - Évolution des revenus sur le temps
   - Graphique en ligne ou courbe

3. **Notifications Automatiques**
   - Email aux créatrices tous les 15 jours
   - Récapitulatif de leurs gains

4. **Filtres Avancés**
   - Par devise
   - Par type de subscription (content_access vs messaging_access)
   - Par plage de montants

5. **Calcul Automatique des Commissions**
   - Si la plateforme prend une commission
   - Afficher montant net pour la créatrice

6. **Historique des Paiements**
   - Tracker quels paiements ont été effectués
   - Éviter les doubles paiements

## Dépannage

### La page affiche "Aucune transaction"

**Causes possibles**:

1. Filtres trop restrictifs (période trop courte)
2. Pas de transactions dans la période sélectionnée
3. Problème de connexion à Convex

**Solution**: Réinitialiser les filtres ou élargir la période

### Les montants semblent incorrects

**Vérifications**:

1. Vérifier la devise affichée
2. Confirmer que seules les transactions `succeeded` sont comptées
3. Vérifier les filtres actifs

### Erreur "Accès refusé"

**Cause**: L'utilisateur n'est pas SUPERUSER

**Solution**: Se connecter avec un compte administrateur

## Maintenance

### Monitoring

- Surveiller les erreurs dans les logs Convex
- Vérifier la performance des queries (temps de réponse)
- Monitorer l'utilisation de la bande passante

### Mises à Jour

Lors de modifications du schéma `transactions`:

1. Mettre à jour les types TypeScript
2. Adapter les queries Convex si nécessaire
3. Tester le dashboard avec les nouvelles données
4. Documenter les changements

## Support

Pour toute question ou problème concernant le dashboard des transactions, contacter l'équipe technique FanTribe.

---

**Dernière mise à jour**: Octobre 2025  
**Version**: 1.0.0  
**Auteurs**: Équipe FanTribe
