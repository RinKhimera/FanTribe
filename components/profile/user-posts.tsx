"use client"

import { useQuery } from "convex/react"
import { PostCard } from "@/components/shared/post-card"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"

export const UserPosts = ({
  authorId,
  currentUser,
}: {
  authorId: Id<"users">
  currentUser: Doc<"users"> | undefined
}) => {
  const userPosts = useQuery(api.posts.getUserPosts, { authorId })

  return (
    <>
      {userPosts?.length === 0 ? (
        <div className="text-muted-foreground mt-16 h-full px-4 text-center text-xl">
          Pas de posts pour le moment
        </div>
      ) : (
        <div className="flex flex-col">
          {userPosts?.map((post) => (
            <div key={post._id}>
              {/* Afficher toujours le contenu textuel du post */}
              <PostCard post={post} currentUser={currentUser!} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
