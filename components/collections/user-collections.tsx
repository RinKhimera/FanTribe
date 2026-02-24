import { useQuery } from "convex/react"
import { PostCard } from "@/components/shared/post-card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"

export const UserCollections = ({
  currentUser,
}: {
  currentUser: Doc<"users">
}) => {
  const bookmarksData = useQuery(api.bookmarks.getUserBookmarks)

  if (bookmarksData === undefined) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 border-b border-white/5 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  const posts = bookmarksData.posts || []

  if (posts.length === 0) {
    return (
      <div className="text-muted-foreground mt-16 h-full px-4 text-center text-xl">
        Aucune collection trouvée. Ajoutez des collections en cliquant sur le
        bouton de signet pour les retrouver ici.
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <PostCard post={post} currentUser={currentUser} key={post._id} />
      ))}
    </div>
  )
}
