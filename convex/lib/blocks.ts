import { Id } from "../_generated/dataModel"
import { MutationCtx, QueryCtx } from "../_generated/server"

type DbCtx = QueryCtx | MutationCtx

/**
 * Récupère l'ensemble des IDs d'utilisateurs bloqués par ou bloquant un utilisateur
 * Utile pour filtrer le contenu dans les feeds, notifications, etc.
 *
 * @example
 * const blockedIds = await getBlockedUserIds(ctx, currentUser._id)
 * const filteredPosts = posts.filter(p => !blockedIds.has(p.author))
 */
export const getBlockedUserIds = async (
  ctx: DbCtx,
  userId: Id<"users">,
): Promise<Set<Id<"users">>> => {
  const [blockedByMe, blockingMe] = await Promise.all([
    ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", userId))
      .collect(),
    ctx.db
      .query("blocks")
      .withIndex("by_blocked", (q) => q.eq("blockedId", userId))
      .collect(),
  ])

  return new Set([
    ...blockedByMe.map((b) => b.blockedId),
    ...blockingMe.map((b) => b.blockerId),
  ])
}

/**
 * Vérifie si une relation de blocage existe entre deux utilisateurs
 * (dans les deux sens)
 */
export const isBlocked = async (
  ctx: DbCtx,
  userA: Id<"users">,
  userB: Id<"users">,
): Promise<boolean> => {
  const [aBlockedB, bBlockedA] = await Promise.all([
    ctx.db
      .query("blocks")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerId", userA).eq("blockedId", userB),
      )
      .unique(),
    ctx.db
      .query("blocks")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerId", userB).eq("blockedId", userA),
      )
      .unique(),
  ])

  return aBlockedB !== null || bBlockedA !== null
}

/**
 * Filtre une liste d'IDs utilisateurs en excluant ceux qui sont bloqués
 */
export const filterBlockedUsers = async <T extends Id<"users">>(
  ctx: DbCtx,
  userId: Id<"users">,
  userIds: T[],
): Promise<T[]> => {
  const blockedIds = await getBlockedUserIds(ctx, userId)
  return userIds.filter((id) => !blockedIds.has(id))
}
