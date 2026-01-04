"use client"

import { useQuery } from "convex/react"
import { motion } from "motion/react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { notFound, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PostCard } from "@/components/shared/post-card"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { PostDetailComments } from "./post-detail-comments"

export const PostLayout = ({
  currentUser,
  postId,
}: {
  currentUser: Doc<"users">
  postId: Id<"posts">
}) => {
  const router = useRouter()
  const post = useQuery(api.posts.getPost, { postId })

  // Loading state
  if (post === undefined || currentUser === undefined) {
    return (
      <div
        className={cn(
          "flex min-h-screen flex-col",
          "border-border/40 border-r border-l",
          "max-[500px]:border-0",
          "max-[500px]:pb-[var(--mobile-nav-height)]",
        )}
      >
        {/* Sticky Header */}
        <header
          className={cn(
            "sticky top-0 z-30",
            "border-border/40 border-b",
            "bg-background/80 backdrop-blur-xl backdrop-saturate-150",
          )}
        >
          <div className="flex items-center gap-4 px-4 h-14">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="size-9 rounded-full hover:bg-muted/80 -ml-1"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="text-lg font-semibold tracking-tight">
              Publication
            </h1>
          </div>
        </header>

        {/* Loading spinner */}
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Loader2 className="text-primary size-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  if (post === null) notFound()

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col",
        "border-border/40 border-r border-l",
        "max-[500px]:border-0",
        "max-[500px]:pb-[var(--mobile-nav-height)]",
      )}
    >
      {/* Sticky Frosted Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          "sticky top-0 z-30",
          "border-border/40 border-b",
          "bg-background/80 backdrop-blur-xl backdrop-saturate-150",
        )}
      >
        <div className="flex items-center gap-4 px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="size-9 rounded-full hover:bg-muted/80 transition-colors -ml-1"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">Publication</h1>
        </div>
      </motion.header>

      {/* Post Content */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1], delay: 0.05 }}
      >
        <PostCard
          post={post}
          currentUser={currentUser}
          isDetailView={true}
        />
      </motion.div>

      {/* Comments Section */}
      <PostDetailComments
        postId={postId}
        currentUser={currentUser}
        post={post}
      />
    </div>
  )
}
