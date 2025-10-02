# Logger - Guide d'utilisation

## Import

```typescript
import { logger } from "@/lib/logger"
```

## Exemples d'utilisation

### 1. Logger une erreur avec contexte

```typescript
try {
  await someAsyncOperation()
} catch (error) {
  logger.error("Operation failed", error, {
    userId: currentUser._id,
    operation: "someAsyncOperation",
    timestamp: Date.now(),
  })

  toast.error("L'opération a échoué", {
    description: error instanceof Error ? error.message : "Erreur inconnue",
  })
}
```

### 2. Logger un succès (dev only)

```typescript
const result = await createPost({ content, medias })

logger.success("Post created successfully", {
  postId: result.postId,
  authorId: currentUser._id,
  mediaCount: medias.length,
})
```

### 3. Logger un avertissement

```typescript
if (file.size > MAX_FILE_SIZE) {
  logger.warn("File size exceeds limit", {
    fileSize: file.size,
    maxSize: MAX_FILE_SIZE,
    fileName: file.name,
  })

  toast.error(`Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`)
  return
}
```

### 4. Logger des informations de debug

```typescript
logger.debug("Subscription check", {
  canSubscribe: canSubscribe?.canSubscribe,
  reason: canSubscribe?.reason,
  creatorId: userProfile._id,
})
```

## Migration des console.log existants

### ❌ Avant

```typescript
console.log("✅ Vidéo supprimée avec succès", deleteResponse)
console.error("❌ Erreur lors de la suppression", error)
```

### ✅ Après

```typescript
logger.success("Video deleted successfully", { deleteResponse })
logger.error("Video deletion failed", error, { videoId })
```

## Configuration pour production

Pour envoyer les logs à un service externe (Sentry, Logtail, etc.):

```typescript
// Dans lib/logger.ts

export const logger = {
  error: (message: string, error?: any, context?: LogContext) => {
    console.error(`❌ ${message}`, { error, ...context })

    // Envoyer à Sentry en production
    if (process.env.NODE_ENV === "production") {
      Sentry.captureException(error, {
        tags: { message },
        extra: context,
      })
    }
  },
  // ...
}
```

## Bonnes pratiques

1. **Toujours inclure un contexte**: Ajoutez des IDs, timestamps, états pertinents
2. **Messages en anglais**: Pour faciliter la recherche dans les logs
3. **Descriptions toast en français**: Pour l'utilisateur final
4. **Ne pas logger de données sensibles**: Évitez tokens, mots de passe, PII
5. **Utiliser le bon niveau**:
   - `error`: Erreurs critiques nécessitant attention
   - `warn`: Situations anormales mais gérables
   - `info`: Informations utiles pour le debug
   - `success`: Confirmations d'opérations importantes
   - `debug`: Détails techniques pour le développement
