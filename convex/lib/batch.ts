import { Doc, Id } from "../_generated/dataModel"
import { QueryCtx, MutationCtx } from "../_generated/server"

type DbCtx = QueryCtx | MutationCtx

/**
 * Batch fetch users by their IDs
 * Deduplicates IDs and returns a Map for O(1) lookup
 *
 * @example
 * const userMap = await batchGetUsers(ctx, userIds)
 * const user = userMap.get(userId)
 */
export async function batchGetUsers(
  ctx: DbCtx,
  userIds: Id<"users">[]
): Promise<Map<Id<"users">, Doc<"users">>> {
  const uniqueIds = [...new Set(userIds)]
  const users = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)))

  const map = new Map<Id<"users">, Doc<"users">>()
  for (let i = 0; i < uniqueIds.length; i++) {
    const user = users[i]
    if (user) {
      map.set(uniqueIds[i], user)
    }
  }
  return map
}

/**
 * Batch fetch posts by their IDs
 */
export async function batchGetPosts(
  ctx: DbCtx,
  postIds: Id<"posts">[]
): Promise<Map<Id<"posts">, Doc<"posts">>> {
  const uniqueIds = [...new Set(postIds)]
  const posts = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)))

  const map = new Map<Id<"posts">, Doc<"posts">>()
  for (let i = 0; i < uniqueIds.length; i++) {
    const post = posts[i]
    if (post) {
      map.set(uniqueIds[i], post)
    }
  }
  return map
}

/**
 * Batch fetch comments by their IDs
 */
export async function batchGetComments(
  ctx: DbCtx,
  commentIds: Id<"comments">[]
): Promise<Map<Id<"comments">, Doc<"comments">>> {
  const uniqueIds = [...new Set(commentIds)]
  const comments = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)))

  const map = new Map<Id<"comments">, Doc<"comments">>()
  for (let i = 0; i < uniqueIds.length; i++) {
    const comment = comments[i]
    if (comment) {
      map.set(uniqueIds[i], comment)
    }
  }
  return map
}
