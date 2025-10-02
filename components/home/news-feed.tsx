"use client"

import { useQuery } from "convex/react"
import { Loader2 } from "lucide-react"
import { PostCard } from "@/components/shared/post-card"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"

export const NewsFeed = ({
  currentUser,
}: {
  currentUser: Doc<"users"> | undefined
}) => {
  const getPosts = useQuery(api.posts.getHomePosts)

  // Afficher un loader si currentUser n'est pas encore défini
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4 text-sm">
          Chargement du fil d&apos;actualité...
        </p>
      </div>
    )
  }

  // Afficher un loader si les posts sont encore en cours de chargement
  if (getPosts === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4 text-sm">
          Chargement des publications...
        </p>
      </div>
    )
  }

  // Afficher un message si aucun post n'est disponible
  if (getPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground text-lg font-medium">
          Aucune publication disponible
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Suivez des créateurs pour voir leurs publications ici
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {getPosts.map((post) => (
        <PostCard post={post} currentUser={currentUser} key={post._id} />
      ))}
    </div>
  )
}
