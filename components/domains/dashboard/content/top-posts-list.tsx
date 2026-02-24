"use client"

import { Heart, Lock, MessageSquareText } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { containerVariants, itemVariants } from "@/lib/animations"
import type { PostMedia } from "@/types"

interface TopPost {
  _id: string
  _creationTime: number
  content: string
  medias: PostMedia[]
  visibility: "public" | "subscribers_only"
  likeCount: number
  commentCount: number
  engagementScore: number
}

interface TopPostsListProps {
  posts: TopPost[]
}

export const TopPostsList = ({ posts }: TopPostsListProps) => {
  const { currentUser } = useCurrentUser()
  const username = currentUser?.username

  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Top publications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center text-sm">
            Aucune publication trouvée
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Top publications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="space-y-2"
        >
          {posts.map((post, index) => (
            <motion.div key={post._id} variants={itemVariants}>
              <Link
                href={username ? `/${username}/post/${post._id}` : "#"}
                className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-white/5"
              >
                {/* Rank */}
                <div className="text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold">
                  {index + 1}
                </div>

                {/* Thumbnail */}
                {post.medias.length > 0 && post.medias[0].type === "image" && (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={post.medias[0].url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm">{post.content}</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Heart className="h-3 w-3" />
                      {post.likeCount}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <MessageSquareText className="h-3 w-3" />
                      {post.commentCount}
                    </span>
                    {post.visibility === "subscribers_only" && (
                      <Badge
                        variant="outline"
                        className="h-5 gap-1 px-1.5 text-[10px]"
                      >
                        <Lock className="h-2.5 w-2.5" />
                        Abonnés
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Engagement Score */}
                <div className="bg-primary/10 text-primary shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold">
                  {post.engagementScore}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  )
}
