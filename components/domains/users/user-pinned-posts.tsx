"use client"

import { useQuery } from "convex/react"
import { motion } from "motion/react"
import { Pin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { itemVariants, pinnedBadgeVariants } from "@/lib/animations"
import { formatCustomTimeAgo } from "@/lib/formatters"
import { cn } from "@/lib/utils"

interface UserPinnedPostsProps {
  userId: Id<"users">
  username?: string
  currentUserId?: Id<"users">
}

type PinnedPost = Doc<"posts"> & {
  author: Doc<"users">
}

export const UserPinnedPosts = ({
  userId,
  username,
  currentUserId,
}: UserPinnedPostsProps) => {
  const pinnedPosts = useQuery(api.users.getPinnedPosts, { userId }) as
    | PinnedPost[]
    | undefined

  if (!pinnedPosts || pinnedPosts.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <motion.div
          variants={pinnedBadgeVariants}
          initial="initial"
          animate="animate"
        >
          <Pin className="text-primary size-5" />
        </motion.div>
        <h3 className="text-sm font-semibold uppercase tracking-wide">
          Publications épinglées
        </h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {pinnedPosts.map((post, index) => (
          <motion.div
            key={post._id}
            variants={itemVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: index * 0.1 }}
          >
            <PinnedPostCard
              post={post}
              username={username}
              isOwner={currentUserId === userId}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

interface PinnedPostCardProps {
  post: PinnedPost
  username?: string
  isOwner: boolean
}

const PinnedPostCard = ({ post, username, isOwner }: PinnedPostCardProps) => {
  const hasMedia = post.medias && post.medias.length > 0
  const firstMedia = hasMedia ? post.medias[0] : null
  const isVideo =
    firstMedia?.includes("mediadelivery.net") ||
    firstMedia?.includes(".mp4") ||
    firstMedia?.includes(".webm")

  return (
    <Link href={`/${username}/post/${post._id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "glass-card group relative overflow-hidden rounded-xl transition-all",
          "hover:shadow-xl"
        )}
      >
        {/* Pin indicator */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="bg-primary absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-full shadow-lg"
        >
          <Pin className="size-3.5 text-white" />
        </motion.div>

        {/* Media preview */}
        {hasMedia && firstMedia && (
          <div className="bg-muted relative aspect-video overflow-hidden">
            {isVideo ? (
              <div className="bg-muted flex h-full items-center justify-center">
                <div className="bg-primary/20 flex size-12 items-center justify-center rounded-full">
                  <div className="ml-1 size-0 border-t-8 border-b-8 border-l-12 border-t-transparent border-b-transparent border-l-white" />
                </div>
              </div>
            ) : (
              <Image
                src={firstMedia}
                alt="Post preview"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
            <div className="glass-overlay absolute inset-x-0 bottom-0 h-1/2" />
          </div>
        )}

        {/* Content */}
        <div className="p-3">
          <p
            className={cn(
              "line-clamp-2 text-sm",
              hasMedia ? "text-muted-foreground" : "font-medium"
            )}
          >
            {post.content}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">
            {formatCustomTimeAgo(post._creationTime)}
          </p>
        </div>
      </motion.div>
    </Link>
  )
}
