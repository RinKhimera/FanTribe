# Guide: Structure des dossiers `/lib` vs `/utils`

## 📦 Philosophie actuelle (à améliorer)

### État actuel

```
lib/                        utils/
├── bunny.ts               ├── cinetpayPayment.ts
├── stripe.ts              ├── detectRiskFactors.tsx
├── env.ts                 ├── formatCustomTimeAgo.ts
├── env.client.ts          ├── formatPostDate.ts
├── logger.ts              ├── generateRandomString.ts
├── utils.ts (cn)          └── getStatusBadge.tsx
├── create-initials.tsx
├── dates.ts
├── video-utils.ts
└── svgs.tsx
```

**Problème:** Pas de distinction claire entre `/lib` et `/utils` → confusion sur où placer nouveaux fichiers

## 🎯 Convention recommandée

### `/lib` - Configuration & Services externes

**Définition:** Code qui configure et **encapsule des services externes** ou des **configurations système**

**Caractéristiques:**
- ✅ Interagit avec des APIs externes (Bunny, Stripe, CinetPay)
- ✅ Gère l'authentification/autorisation
- ✅ Configure des outils système (logger, env)
- ✅ Contient de la logique métier complexe
- ✅ Peut avoir des side-effects (HTTP calls, logging)
- ✅ Souvent statefull ou avec dépendances externes

**Exemples concrets:**
```typescript
// ✅ lib/bunny.ts - Service externe CDN
export const deleteBunnyAsset = async (mediaId, type) => {
  await fetch(`https://video.bunnycdn.com/...`) // API externe
}

// ✅ lib/stripe.ts - Service externe paiement
export const stripe = new Stripe(env.STRIPE_SECRET_KEY) // Config SDK

// ✅ lib/logger.ts - Système de logging
export const logger = {
  error: (message, error, context) => { /* ... */ }
}

// ✅ lib/env.ts - Validation environnement
export const env = serverEnvSchema.parse({ /* ... */ }) // Config système
```

### `/utils` - Fonctions utilitaires pures

**Définition:** Fonctions **pures** et **réutilisables** qui transforment des données sans side-effects

**Caractéristiques:**
- ✅ Fonctions pures (même input → même output)
- ✅ Pas de side-effects (no HTTP, no logging, no state)
- ✅ Transformations de données (format, parse, calculate)
- ✅ Helpers simples et testables unitairement
- ✅ Indépendant de services externes
- ✅ Logique UI simple (badges, avatars)

**Exemples concrets:**
```typescript
// ✅ utils/format-date.ts - Transformation pure
export const formatPostDate = (timestamp: number): string => {
  return differenceInMinutes(now, date) < 60 
    ? `il y a ${minutes}m` 
    : format(date, "d MMM")
}

// ✅ utils/create-initials.ts - Calcul pur
export const createInitials = (name?: string): string => {
  return name?.split(" ").map(w => w[0].toUpperCase()).join("") || "XO"
}

// ✅ utils/generate-random-string.ts - Helper simple
export const generateRandomString = (length: number): string => {
  return Math.random().toString(36).substring(2, length + 2)
}
```

## 🔄 Réorganisation proposée

### Étape 1: Clarifier `/lib` (Services & Config)

```
lib/
├── services/              # Services externes (APIs tierces)
│   ├── bunny.ts          # Bunny CDN (upload/delete videos/images)
│   ├── stripe.ts         # Stripe (paiements cartes)
│   └── cinetpay.ts       # CinetPay (paiements mobiles) ← DÉPLACER de /utils
│
├── config/               # Configuration système
│   ├── env.ts           # Variables serveur (secrets)
│   ├── env.client.ts    # Variables client (NEXT_PUBLIC_*)
│   └── logger.ts        # Système de logging structuré
│
└── ui-helpers.ts        # Helpers UI complexes (cn, svgs)
```

**Justifications:**
- `bunny.ts`: Service externe avec HTTP calls → `/lib/services/`
- `stripe.ts`: SDK externe configuré → `/lib/services/`
- `cinetpay.ts`: Service externe (actuellement dans `/utils` par erreur) → `/lib/services/`
- `env.ts`: Configuration critique système → `/lib/config/`
- `logger.ts`: Infrastructure de logging → `/lib/config/`
- `utils.ts` (cn): Garde ce nom car convention shadcn/ui → `/lib/ui-helpers.ts` ou garder `/lib/utils.ts`

### Étape 2: Clarifier `/utils` (Pure functions)

```
utils/
├── formatters/                    # Transformations de format
│   ├── format-date.ts            # Format dates posts (il y a 5m, hier)
│   ├── format-custom-time-ago.ts # Format timestamp personnalisé
│   └── format-message-date.ts    # Format dates messages ← CRÉER (logique de lib/dates.ts)
│
├── generators/                    # Génération de données
│   ├── generate-random-string.ts # UUID/random strings
│   └── create-initials.ts        # Initiales depuis nom ← DÉPLACER de /lib
│
├── validators/                    # Validation & détection
│   └── detect-risk-factors.tsx   # Analyse candidatures créateur
│
├── calculators/                   # Calculs purs
│   └── video-display-info.ts     # Calcul aspect ratio vidéos ← DÉPLACER de /lib
│
└── ui/                           # Helpers UI simples (React)
    └── get-status-badge.tsx      # Badges de statut
```

**Justifications:**
- `formatPostDate`: Transformation pure → `/utils/formatters/`
- `createInitials`: Calcul pur, actuellement dans `/lib` par erreur → `/utils/generators/`
- `video-utils.ts`: Calculs géométriques purs → `/utils/calculators/`
- `dates.ts` (lib): Contient formatters purs → **splitter** vers `/utils/formatters/`
- `detectRiskFactors`: Analyse pure de données → `/utils/validators/`

### Étape 3: Cas spéciaux à réorganiser

#### `lib/dates.ts` - À SPLITTER

**Problème:** Mélange formatters (utils) et helpers dates (peuvent rester lib)

```typescript
// ❌ Actuellement dans lib/dates.ts (tout mélangé)

// ✅ Déplacer vers utils/formatters/format-message-date.ts
export const formatDate = (timestamp: number): string => { /* ... */ }

// ✅ Garder dans lib/dates.ts (ou utils/calculators/date-helpers.ts)
export const isSameDay = (t1: number, t2: number): boolean => { /* ... */ }
export const getRelativeDateTime = (msg: any, prevMsg: any) => { /* ... */ }
```

#### `lib/create-initials.tsx` - À DÉPLACER

**Problème:** Fonction pure dans `/lib`

```typescript
// ❌ Actuellement lib/create-initials.tsx
// ✅ Devrait être utils/generators/create-initials.ts

export const createInitials = (name?: string): string => {
  return name?.split(" ").map(w => w[0].toUpperCase()).join("") || "XO"
}
```

#### `lib/video-utils.ts` - À DÉPLACER

**Problème:** Calculs purs dans `/lib`

```typescript
// ❌ Actuellement lib/video-utils.ts
// ✅ Devrait être utils/calculators/video-display-info.ts

export function getVideoDisplayInfo(videoData: BunnyVideoGetResponse) {
  // Calculs mathématiques purs (rotation, aspect ratio)
}
```

#### `utils/cinetpayPayment.ts` - À DÉPLACER

**Problème:** Service externe dans `/utils`

```typescript
// ❌ Actuellement utils/cinetpayPayment.ts
// ✅ Devrait être lib/services/cinetpay.ts

export const initializeCinetPayPayment = async (data: PaymentData) => {
  await fetch("https://api-checkout.cinetpay.com/v2/payment") // API externe!
}
```

#### `lib/svgs.tsx` - À CONSERVER ou DÉPLACER

**Options:**
1. **Garder** dans `/lib/ui-helpers.ts` (convention, pas vraiment utils)
2. **Déplacer** vers `/components/ui/icons.tsx` (plus logique, ce sont des composants React)

## 📋 Plan de migration

### Migration complète (recommandé)

```bash
# 1. Créer la nouvelle structure
mkdir lib/services lib/config
mkdir utils/formatters utils/generators utils/validators utils/calculators utils/ui

# 2. Déplacer services externes
mv utils/cinetpayPayment.ts lib/services/cinetpay.ts
# Renommer imports dans le code

# 3. Déplacer fonctions pures de /lib vers /utils
mv lib/create-initials.tsx utils/generators/create-initials.ts
mv lib/video-utils.ts utils/calculators/video-display-info.ts

# 4. Organiser /lib
mv lib/bunny.ts lib/services/bunny.ts
mv lib/stripe.ts lib/services/stripe.ts
mv lib/env.ts lib/config/env.ts
mv lib/env.client.ts lib/config/env.client.ts
mv lib/logger.ts lib/config/logger.ts

# 5. Organiser /utils
mv utils/formatPostDate.ts utils/formatters/format-post-date.ts
mv utils/formatCustomTimeAgo.ts utils/formatters/format-custom-time-ago.ts
mv utils/generateRandomString.ts utils/generators/generate-random-string.ts
mv utils/detectRiskFactors.tsx utils/validators/detect-risk-factors.tsx
mv utils/getStatusBadge.tsx utils/ui/get-status-badge.tsx

# 6. Splitter lib/dates.ts
# Créer utils/formatters/format-message-date.ts pour formatDate()
# Garder isSameDay et getRelativeDateTime dans lib/dates.ts ou utils/calculators/
```

### Migration progressive (pragmatique)

**Phase 1 - Nouveaux fichiers seulement:**
- ✅ Nouveaux services API → `/lib/services/`
- ✅ Nouveaux formatters → `/utils/formatters/`
- ✅ Nouvelle config → `/lib/config/`

**Phase 2 - Corrections flagrantes:**
- Move `utils/cinetpayPayment.ts` → `lib/services/cinetpay.ts`
- Move `lib/create-initials.tsx` → `utils/generators/create-initials.ts`
- Move `lib/video-utils.ts` → `utils/calculators/video-display-info.ts`

**Phase 3 - Refactor complet (quand temps disponible):**
- Organiser tous les fichiers existants selon convention

## 🎓 Règles de décision rapides

### "Où dois-je mettre ce fichier ?"

```
┌─────────────────────────────────────┐
│ Mon code fait des HTTP calls ?      │
│ Mon code configure un SDK externe ? │
└──────────┬──────────────────────────┘
           │ OUI
           ▼
    📦 /lib/services/
    (bunny.ts, stripe.ts, cinetpay.ts)


┌─────────────────────────────────────┐
│ Mon code valide/configure l'app ?   │
│ (env, logger, auth config)          │
└──────────┬──────────────────────────┘
           │ OUI
           ▼
    ⚙️ /lib/config/
    (env.ts, logger.ts)


┌─────────────────────────────────────┐
│ Mon code est une fonction pure ?    │
│ (pas de side-effects, testable)     │
└──────────┬──────────────────────────┘
           │ OUI
           ▼
    🔧 /utils/
    ├── formatters/    (dates, strings)
    ├── generators/    (random, initials)
    ├── validators/    (risk detection)
    ├── calculators/   (math, geometry)
    └── ui/            (badges, avatars)


┌─────────────────────────────────────┐
│ Mon code est un composant React UI? │
└──────────┬──────────────────────────┘
           │ OUI
           ▼
    🎨 /components/ui/
    (button.tsx, badge.tsx, icons.tsx)
```

## 🚦 Exemples concrets de décision

| Fichier | Actuellement | Devrait être | Raison |
|---------|--------------|--------------|--------|
| `bunny.ts` | `/lib` | ✅ `/lib/services/` | API externe Bunny CDN |
| `stripe.ts` | `/lib` | ✅ `/lib/services/` | SDK Stripe configuré |
| `cinetpayPayment.ts` | ❌ `/utils` | ✅ `/lib/services/` | API externe CinetPay |
| `env.ts` | `/lib` | ✅ `/lib/config/` | Config système |
| `logger.ts` | `/lib` | ✅ `/lib/config/` | Infrastructure logging |
| `create-initials.tsx` | ❌ `/lib` | ✅ `/utils/generators/` | Fonction pure |
| `video-utils.ts` | ❌ `/lib` | ✅ `/utils/calculators/` | Calculs purs |
| `formatPostDate.ts` | ✅ `/utils` | ✅ `/utils/formatters/` | Formatter pur |
| `generateRandomString.ts` | ✅ `/utils` | ✅ `/utils/generators/` | Generator pur |
| `detectRiskFactors.tsx` | ✅ `/utils` | ✅ `/utils/validators/` | Validation pure |
| `getStatusBadge.tsx` | ✅ `/utils` | ✅ `/utils/ui/` | UI helper |
| `utils.ts` (cn) | `/lib` | ✅ `/lib/` (garder) | Convention shadcn/ui |
| `svgs.tsx` | `/lib` | 🤔 `/components/ui/icons.tsx` | Composants React |

## 📝 Convention finale

### `/lib` = "Library" (Bibliothèques & Services)
**"Code qui interagit avec le monde extérieur ou configure l'app"**
- Services externes (APIs, SDKs)
- Configuration système (env, logger, auth)
- Helpers UI complexes (cn, pas des pure utils)

### `/utils` = "Utilities" (Utilitaires purs)
**"Fonctions pures qui transforment des données"**
- Formatters (dates, strings, numbers)
- Generators (random, UUIDs, initials)
- Validators (checks, detections)
- Calculators (math, geometry)
- UI helpers simples (badges sans side-effects)

### Avantages de cette organisation

✅ **Clarté:** On sait immédiatement où chercher
✅ **Maintenabilité:** Code organisé par responsabilité
✅ **Testabilité:** `/utils` = 100% testable unitairement
✅ **Réutilisabilité:** Fonctions pures faciles à réutiliser
✅ **Évolutivité:** Facile d'ajouter nouveaux fichiers

## 🔄 Prochaines étapes

1. **Décider:** Migration complète ou progressive ?
2. **Créer:** Sous-dossiers selon besoin
3. **Déplacer:** Fichiers mal placés (cinetpay, create-initials, video-utils)
4. **Mettre à jour:** Imports dans tout le codebase
5. **Documenter:** Ajouter règle dans `CONTRIBUTING.md`

Tu veux que je t'aide à faire la migration ? 🚀
