"use client"

import { useQuery } from "convex/react"
import { Loader } from "lucide-react"
import { notFound } from "next/navigation"
import React from "react"
import { PageContainer } from "@/components/layout"
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
      <PageContainer title="Publication">
        <div className="flex flex-1 flex-col items-center justify-center">
          <Loader className="text-primary animate-spin" size={60} />
        </div>
      </PageContainer>
    )

  if (post === null) notFound()

  return (
    <PageContainer title="Publication">
      <PostCard post={post} currentUser={currentUser} />
      <CreateComment currentUser={currentUser} postId={post._id} />
      <CommentFeed postId={post._id} />
    </PageContainer>
  )
}
