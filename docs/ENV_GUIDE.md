# Guide: Variables d'environnement (env.ts vs env.client.ts)

## 🔐 Règle d'or

**Next.js ne rend accessible côté client QUE les variables `NEXT_PUBLIC_*`**

## 📁 Structure

```
lib/
├── env.ts         → Variables SERVEUR uniquement
└── env.client.ts  → Variables CLIENT (NEXT_PUBLIC_*)
```

## ✅ Quand utiliser quoi ?

### Utilisez `lib/env.ts` (serveur)

**Pour:** Server Actions, API Routes, Server Components

```typescript
// ✅ Bon - Server Action
"use server"
import { env } from "@/lib/env"

export async function sendEmail() {
  const resend = new Resend(env.RESEND_API_KEY) // ✅ Secret côté serveur
}
```

```typescript
// ✅ Bon - API Route
import { env } from "@/lib/env"

export async function POST() {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY) // ✅ Secret côté serveur
}
```

**Variables disponibles:**
- `env.CONVEX_DEPLOYMENT`
- `env.CLERK_SECRET_KEY`
- `env.CLERK_WEBHOOK_SECRET`
- `env.STRIPE_SECRET_KEY`
- `env.STRIPE_WEBHOOK_SECRET`
- `env.STRIPE_PRICE_ID`
- `env.RESEND_API_KEY`
- `env.NODE_ENV`

### Utilisez `lib/env.client.ts` (client)

**Pour:** Client Components (`"use client"`), hooks, providers

```typescript
// ✅ Bon - Client Component
"use client"
import { clientEnv } from "@/lib/env.client"

export const MyComponent = () => {
  const convexUrl = clientEnv.NEXT_PUBLIC_CONVEX_URL // ✅ Public, safe
}
```

```typescript
// ✅ Bon - Provider
"use client"
import { clientEnv } from "@/lib/env.client"

const convex = new ConvexReactClient(clientEnv.NEXT_PUBLIC_CONVEX_URL)
```

**Variables disponibles:**
- `clientEnv.NEXT_PUBLIC_CONVEX_URL`
- `clientEnv.NEXT_PUBLIC_CLERK_FRONTEND_API_URL`
- `clientEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `clientEnv.NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `clientEnv.NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `clientEnv.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID`
- `clientEnv.NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY`
- `clientEnv.NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME`
- `clientEnv.NEXT_PUBLIC_BUNNY_STORAGE_ACCESS_KEY`
- `clientEnv.NEXT_PUBLIC_BUNNY_PULL_ZONE_URL`
- `clientEnv.NEXT_PUBLIC_CINETPAY_SITE_ID`
- `clientEnv.NEXT_PUBLIC_CINETPAY_API_KEY`

## ❌ Erreurs courantes

### ❌ Erreur 1: Import serveur dans client

```typescript
// ❌ MAUVAIS - Ne marchera PAS
"use client"
import { env } from "@/lib/env" // ❌ Variables serveur inaccessibles!

export const MyComponent = () => {
  const key = env.STRIPE_SECRET_KEY // ❌ undefined!
}
```

**Erreur runtime:**
```
ZodError: [
  { path: ["STRIPE_SECRET_KEY"], message: "Required", received: "undefined" }
]
```

**✅ Solution:**
```typescript
"use client"
import { clientEnv } from "@/lib/env.client" // ✅

// Utilisez uniquement les variables NEXT_PUBLIC_*
```

### ❌ Erreur 2: Oublier le préfixe NEXT_PUBLIC_

```env
# ❌ MAUVAIS - Pas de NEXT_PUBLIC_
BUNNY_ACCESS_KEY=xxx

# ✅ BON - Préfixe ajouté
NEXT_PUBLIC_BUNNY_ACCESS_KEY=xxx
```

Si vous devez rendre une variable accessible côté client:
1. Ajoutez `NEXT_PUBLIC_` au nom dans `.env`
2. Ajoutez-la dans `lib/env.client.ts`
3. Rebuild l'app (`npm run dev` restart)

## 🔍 Pourquoi deux fichiers ?

### Sécurité
Les variables sans `NEXT_PUBLIC_` ne sont JAMAIS envoyées au navigateur:
- `STRIPE_SECRET_KEY` → Reste sur le serveur ✅
- `CLERK_WEBHOOK_SECRET` → Reste sur le serveur ✅

### Type Safety
Autocomplétion et validation séparées:
- `env.` → Variables serveur uniquement
- `clientEnv.` → Variables client uniquement

### Fail-fast
Si une variable manque, l'app crash **au démarrage**, pas en production!

## 📝 Ajout d'une nouvelle variable

### Variable serveur (secret)

1. Ajoutez dans `.env`:
```env
MY_SECRET_API_KEY=xxx
```

2. Ajoutez dans `lib/env.ts`:
```typescript
const serverEnvSchema = z.object({
  // ... existantes
  MY_SECRET_API_KEY: z.string().min(1, "MY_SECRET_API_KEY is required"),
})

export const env = serverEnvSchema.parse({
  // ... existantes
  MY_SECRET_API_KEY: process.env.MY_SECRET_API_KEY,
})
```

3. Utilisez:
```typescript
import { env } from "@/lib/env"
const key = env.MY_SECRET_API_KEY
```

### Variable client (publique)

1. Ajoutez dans `.env` **avec NEXT_PUBLIC_**:
```env
NEXT_PUBLIC_MY_API_URL=https://api.example.com
```

2. Ajoutez dans `lib/env.client.ts`:
```typescript
const clientEnvSchema = z.object({
  // ... existantes
  NEXT_PUBLIC_MY_API_URL: z.string().url(),
})

export const clientEnv = clientEnvSchema.parse({
  // ... existantes
  NEXT_PUBLIC_MY_API_URL: process.env.NEXT_PUBLIC_MY_API_URL,
})
```

3. Utilisez:
```typescript
"use client"
import { clientEnv } from "@/lib/env.client"
const url = clientEnv.NEXT_PUBLIC_MY_API_URL
```

## 🚨 Rappels de sécurité

### ✅ Sûr (côté client)
- URLs publiques
- IDs publics (library IDs, site IDs)
- Clés API publiques (publishable keys)

### ❌ Dangereux (JAMAIS côté client)
- Clés secrètes API (secret keys)
- Tokens d'authentification
- Webhooks secrets
- Mots de passe
- Clés de chiffrement

**Si vous hésitez:** Mettez dans `env.ts` (serveur uniquement)!

## 🎯 Résumé rapide

| Type | Fichier | Import | Contexte |
|------|---------|--------|----------|
| Secrets | `lib/env.ts` | `import { env }` | Serveur uniquement |
| Publiques | `lib/env.client.ts` | `import { clientEnv }` | Client + Serveur |
