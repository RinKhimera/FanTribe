"use client"

import { useQuery } from "convex/react"
import { Loader } from "lucide-react"
import { notFound } from "next/navigation"
import React from "react"
import { PostCard } from "@/components/shared/post-card"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { CommentFeed } from "./comment-feed"
import { CreateComment } from "./create-comment"

export const PostLayout = ({
  currentUser,
  postId,
}: {
  currentUser: Doc<"users">
  postId: Id<"posts">
}) => {
  const post = useQuery(api.posts.getPost, {
    postId,
  })

  if (post === undefined || currentUser === undefined)
    return (
      <main className="border-muted flex h-full min-h-screen w-[50%] flex-col border-r border-l max-[500px]:pb-16 max-lg:w-[80%] max-sm:w-full">
        <h1 className="border-muted sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
          Publication
        </h1>

        <div className="flex flex-1 flex-col items-center justify-center">
          <Loader className="text-primary animate-spin" size={60} />
        </div>
      </main>
    )

  if (post === null) notFound()

  return (
    <main className="border-muted flex h-full min-h-screen w-[50%] flex-col border-r border-l max-lg:w-[80%] max-sm:w-full">
      <h1 className="border-muted sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
        Publication
      </h1>

      <PostCard post={post} currentUser={currentUser} />

      <CreateComment currentUser={currentUser} postId={post._id} />
      <CommentFeed postId={post._id} />
    </main>
  )
}
