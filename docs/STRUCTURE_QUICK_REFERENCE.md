# 📚 Guide rapide: Nouvelle structure `/lib` et `/utils`

**Dernière mise à jour:** 2 octobre 2025  
**Statut:** ✅ Migration complétée

## 🗂️ Structure actuelle

### `/lib` - Services & Configuration

```
lib/
├── services/           # APIs externes & SDKs
│   ├── bunny.ts        # Bunny CDN (videos/images)
│   ├── stripe.ts       # Stripe (paiements cartes)
│   ├── cinetpay.ts     # CinetPay (mobile money)
│   └── index.ts        # Export groupé
│
├── config/             # Configuration système
│   ├── env.ts          # Variables serveur (secrets)
│   ├── env.client.ts   # Variables client (NEXT_PUBLIC_*)
│   ├── logger.ts       # Système de logging
│   └── index.ts        # Export groupé
│
├── utils.ts            # shadcn/ui - fonction cn()
├── dates.ts            # Helpers dates messages
└── svgs.tsx            # Composants SVG
```

### `/utils` - Fonctions utilitaires pures

```
utils/
├── formatters/                        # Transformations de format
│   ├── format-post-date.ts           # "il y a 5m", "hier"
│   ├── format-custom-time-ago.ts     # Timestamp → format custom
│   └── index.ts
│
├── generators/                        # Génération de données
│   ├── generate-random-string.ts     # UUIDs, randoms
│   ├── create-initials.ts            # "John Doe" → "JD"
│   └── index.ts
│
├── validators/                        # Validations & détections
│   ├── detect-risk-factors.tsx       # Analyse risques candidatures
│   └── index.ts
│
├── calculators/                       # Calculs purs
│   ├── video-display-info.ts         # Aspect ratio vidéos
│   └── index.ts
│
└── ui/                               # UI helpers simples
    ├── get-status-badge.tsx          # Badges de statut
    └── index.ts
```

## 📖 Patterns d'imports

### Imports directs (standard)

```typescript
// Services externes
import { deleteBunnyAsset, uploadBunnyAsset } from "@/lib/services/bunny"
import { stripe } from "@/lib/services/stripe"
import { initializeCinetPayPayment } from "@/lib/services/cinetpay"

// Configuration
import { env } from "@/lib/config/env"
import { clientEnv } from "@/lib/config/env.client"
import { logger } from "@/lib/config/logger"

// Formatters
import { formatPostDate } from "@/utils/formatters/format-post-date"
import { formatCustomTimeAgo } from "@/utils/formatters/format-custom-time-ago"

// Generators
import { createInitials } from "@/utils/generators/create-initials"
import { generateRandomString } from "@/utils/generators/generate-random-string"

// Calculators
import { getVideoDisplayInfo } from "@/utils/calculators/video-display-info"

// Validators
import { detectRiskFactors } from "@/utils/validators/detect-risk-factors"

// UI helpers
import { getStatusBadge } from "@/utils/ui/get-status-badge"
```

### Imports groupés (via index.ts)

```typescript
// Importer plusieurs services en une ligne
import { deleteBunnyAsset, stripe, initializeCinetPayPayment } from "@/lib/services"

// Importer toute la config
import { env, clientEnv, logger } from "@/lib/config"

// Importer plusieurs formatters
import { formatPostDate, formatCustomTimeAgo } from "@/utils/formatters"

// Etc.
```

## 🎯 Règles de décision rapides

### "Où mettre mon nouveau fichier ?"

```
┌─────────────────────────────────────┐
│ API externe ou SDK ?                │
└──────────┬──────────────────────────┘
           │ OUI → /lib/services/
           ▼
    📦 Exemples: Bunny, Stripe, CinetPay,
       Resend, Convex HTTP, APIs tierces


┌─────────────────────────────────────┐
│ Config système (env, logger, auth)?│
└──────────┬──────────────────────────┘
           │ OUI → /lib/config/
           ▼
    ⚙️ Exemples: env.ts, logger.ts,
       auth.config.ts


┌─────────────────────────────────────┐
│ Fonction PURE (no side-effects) ?   │
└──────────┬──────────────────────────┘
           │ OUI → /utils/[type]/
           ▼
    🔧 Types:
    • formatters/    (dates, strings, numbers)
    • generators/    (random, UUIDs, initials)
    • validators/    (checks, detections)
    • calculators/   (math, geometry)
    • ui/            (badges, avatars sans API)


┌─────────────────────────────────────┐
│ Composant React UI ?                │
└──────────┬──────────────────────────┘
           │ OUI → /components/
           ▼
    🎨 Organiser par feature ou ui/
```

## ✅ Checklist pour nouveau fichier

1. **Nommer en kebab-case:** `my-new-service.ts`, `format-my-data.ts`
2. **Placer dans le bon dossier** selon les règles ci-dessus
3. **Ajouter l'export** dans le `index.ts` du dossier parent
4. **Documenter** les fonctions principales (JSDoc)
5. **Utiliser logger** pour les erreurs (pas console.log)
6. **Utiliser env/clientEnv** pour les variables d'environnement

## 📚 Documentation détaillée

- **Structure complète:** `docs/FOLDER_STRUCTURE_GUIDE.md`
- **Variables d'environnement:** `docs/ENV_GUIDE.md`
- **Système de logging:** `docs/LOGGER_GUIDE.md`
- **Rapport de migration:** `docs/MIGRATION_REPORT.md`

## 🚀 Commandes utiles

```powershell
# Vérifier la structure actuelle
tree lib /F
tree utils /F

# Rechercher un import spécifique
Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String "from \"@/lib/services/bunny\""

# Build check
npm run build-check

# Tests
npm test
```

## 💡 Exemples concrets

### Ajouter un nouveau service API (Mailchimp)

```typescript
// 1. Créer lib/services/mailchimp.ts
import { logger } from "@/lib/config/logger"
import { env } from "@/lib/config/env"

export const mailchimpClient = new MailchimpAPI(env.MAILCHIMP_API_KEY)

export const subscribeToNewsletter = async (email: string) => {
  try {
    const result = await mailchimpClient.subscribe({ email })
    logger.success("Newsletter subscription successful", { email })
    return result
  } catch (error) {
    logger.error("Newsletter subscription failed", error, { email })
    throw error
  }
}
```

```typescript
// 2. Ajouter dans lib/services/index.ts
export * from "./mailchimp"
```

```typescript
// 3. Utiliser dans le code
import { subscribeToNewsletter } from "@/lib/services/mailchimp"
// OU
import { subscribeToNewsletter } from "@/lib/services"
```

### Ajouter un nouveau formatter (prix)

```typescript
// 1. Créer utils/formatters/format-price.ts
export const formatPrice = (amount: number, currency: string = "XAF"): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount)
}
```

```typescript
// 2. Ajouter dans utils/formatters/index.ts
export * from "./format-price"
```

```typescript
// 3. Utiliser
import { formatPrice } from "@/utils/formatters/format-price"
// OU
import { formatPrice } from "@/utils/formatters"
```

### Ajouter un nouveau calculator (distance)

```typescript
// 1. Créer utils/calculators/calculate-distance.ts
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  // Formule de Haversine (fonction pure)
  const R = 6371 // Rayon de la Terre en km
  // ... calcul
  return distance
}
```

```typescript
// 2. Ajouter dans utils/calculators/index.ts
export * from "./calculate-distance"
```

## ⚠️ Anti-patterns à éviter

### ❌ Ne PAS mettre dans /utils si...

```typescript
// ❌ MAUVAIS - Fonction avec side-effect (HTTP call)
// → Mettre dans /lib/services/
export const fetchUserData = async (id: string) => {
  const response = await fetch(`/api/users/${id}`) // ❌ Side-effect!
  return response.json()
}

// ❌ MAUVAIS - Accède à process.env directement
// → Utiliser env/clientEnv de /lib/config/
export const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL // ❌

// ❌ MAUVAIS - Utilise console.log
// → Utiliser logger de /lib/config/
export const debugUser = (user: User) => {
  console.log("User:", user) // ❌
}
```

### ✅ Bon exemple /utils (fonction pure)

```typescript
// ✅ BON - Fonction pure, testable
export const formatUserName = (firstName: string, lastName: string): string => {
  return `${firstName.trim()} ${lastName.trim()}`
}

// ✅ BON - Calcul pur
export const calculateAge = (birthDate: Date): number => {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}
```

## 🎉 Avantages de cette structure

| Avant | Après | Bénéfice |
|-------|-------|----------|
| Tous fichiers mélangés dans `/lib` | Organisés par responsabilité | **Clarté** - On sait où chercher |
| `formatPostDate.ts`, `formatCustomTimeAgo.ts` | `formatters/` | **Groupement logique** |
| PascalCase vs camelCase mixés | Tout en kebab-case | **Cohérence** |
| `cinetpayPayment` dans `/utils` | `cinetpay` dans `/lib/services` | **Correction** - API externe |
| Imports longs et répétitifs | `index.ts` pour grouper | **DX améliorée** |
| Pas de convention claire | Règles documentées | **Maintenabilité** |

---

**Questions ?** Consulte `docs/FOLDER_STRUCTURE_GUIDE.md` pour plus de détails ! 🚀
