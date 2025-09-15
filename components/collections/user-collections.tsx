import { useQuery } from "convex/react"
import { PostCard } from "@/components/shared/PostCard"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"

export const UserCollections = ({
  currentUser,
}: {
  currentUser: Doc<"users">
}) => {
  const bookmarksData = useQuery(api.bookmarks.getUserBookmarks)
  const posts = bookmarksData?.posts || []

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
