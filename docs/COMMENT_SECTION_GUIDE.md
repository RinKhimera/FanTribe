# Section Commentaires - Documentation

## Vue d'ensemble

La section commentaires a été refactorisée pour offrir une expérience utilisateur similaire à celle des réseaux sociaux modernes (OnlyFans, Instagram, etc.).

## Fonctionnalités

### 1. Affichage progressif des commentaires

- **Par défaut** : Affiche les 3 commentaires les plus récents
- **Bouton "Voir plus"** : Charge tous les commentaires du post
- **Bouton "Masquer"** : Ferme complètement la section

### 2. Barre d'emojis

Une barre d'emojis cliquables permet d'ajouter rapidement des réactions au commentaire en cours de rédaction :

```
😂 😍 😘 😊 😁 😃 😄 😆 🤣 😅 🥰
```

### 3. Interface de commentaire

- Avatar de l'utilisateur courant
- Champ de saisie compact (1 ligne par défaut)
- Bouton d'envoi avec icône (Send)
- Support du multi-ligne dans le textarea

### 4. Affichage des commentaires

Chaque commentaire affiche :

- Avatar de l'auteur (cliquable vers le profil)
- Nom de l'auteur (cliquable)
- Date formatée (ex: "2 oct")
- Contenu du commentaire
- Menu ellipsis (pour supprimer si autorisé)

## Architecture

### Fichiers modifiés/créés

#### 1. `convex/comments.ts`

**Nouvelle query** : `getRecentComments`

```typescript
export const getRecentComments = query({
  args: { postId: v.id("posts"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 3
    // Récupère les N commentaires les plus récents
  },
})
```

#### 2. `components/shared/comment-section.tsx`

**Refactorisation complète** :

- Gestion d'état : `showAllComments` (boolean)
- Queries conditionnelles : `getRecentComments` vs `listPostComments`
- Sections :
  - Stats + bouton "Voir plus"
  - Liste des commentaires (avec `CommentItem`)
  - Barre d'emojis
  - Formulaire de commentaire
  - Bouton "Masquer les commentaires"

Props :

```typescript
type CommentSectionProps = {
  postId: Id<"posts">
  currentUser: Doc<"users">
  isOpen: boolean
  disabled?: boolean
  onClose?: () => void // Nouveau : callback pour fermer la section
}
```

#### 3. `components/shared/comment-item.tsx` (NOUVEAU)

Composant réutilisable pour afficher un commentaire individuel.

Props :

```typescript
type CommentItemProps = {
  comment: {
    _id: Doc<"comments">["_id"]
    _creationTime: number
    content: string
    author: Doc<"users"> | null | undefined
  }
}
```

#### 4. `components/shared/post-card.tsx`

**Modification mineure** : Ajout de la prop `onClose` au `CommentSection`

```tsx
<CommentSection
  postId={post._id}
  currentUser={currentUser}
  isOpen={isCommentsOpen}
  disabled={!canViewMedia}
  onClose={toggleComments} // Nouveau
/>
```

## Workflow utilisateur

1. **Ouvrir la section**
   - Clic sur l'icône commentaire → La section s'ouvre
   - Loader animé pendant le chargement des commentaires
   - Affichage des 3 commentaires les plus récents

2. **Voir plus de commentaires**
   - Si > 3 commentaires existent → Bouton "Voir plus de commentaires" visible en haut
   - Clic → Charge tous les commentaires du post

3. **Ajouter un commentaire**
   - Taper du texte dans le champ
   - Optionnel : Cliquer sur un emoji pour l'ajouter
   - Clic sur bouton Send (ou Enter) → Commentaire publié

4. **Fermer la section**
   - Clic sur "Masquer les commentaires" (en bas)
   - OU clic sur l'icône commentaire dans le post-card
   - → La section se ferme et `<Activity>` préserve l'état pour une réouverture rapide

## Considérations techniques

### Performance

- **Queries conditionnelles** : Utilise `"skip"` pour éviter les requêtes inutiles
- **Batch loading** : Les auteurs sont chargés en batch pour éviter les N+1 queries
- **Limite par défaut** : 3 commentaires pour réduire la charge initiale

### Accessibilité

- Labels ARIA sur les boutons emoji
- Avatars avec texte alternatif
- Focus management sur les champs de formulaire

### Responsive

- Barre d'emojis : `overflow-x-auto` pour le scroll horizontal sur mobile
- Gap et padding adaptés pour petits écrans
- Avatars réduits (h-9 w-9 = 36px)

## Améliorations futures possibles

1. **Réactions sur commentaires** : Like/Heart sur chaque commentaire
2. **Réponses** : Système de threads (commentaire → réponses)
3. **Pagination** : "Charger plus" au lieu de tout charger d'un coup
4. **Optimistic updates** : Afficher le commentaire immédiatement avant confirmation serveur
5. **Emojis personnalisés** : Picker d'emojis complet au lieu de liste fixe
6. **Mentions** : @username avec autocomplete
7. **Images dans commentaires** : Support d'upload média

## Conformité avec le guide du projet

✅ **Convex First** : Toutes les données passent par Convex queries/mutations
✅ **French UI** : Tous les textes en français
✅ **Arrow functions** : Utilisation exclusive de const/arrow functions
✅ **Real-time** : Mise à jour automatique via Convex subscriptions
✅ **Error handling** : Toast messages + console logging
✅ **Kebab-case** : Noms de fichiers en kebab-case
