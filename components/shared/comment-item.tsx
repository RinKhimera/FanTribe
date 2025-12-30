"use client"

import { BadgeCheck } from "lucide-react"
import Link from "next/link"
import React from "react"
import { CommentEllipsis } from "@/components/domains/posts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Doc } from "@/convex/_generated/dataModel"
import { formatPostDate } from "@/lib/formatters"
import { cn } from "@/lib/utils"

type CommentItemProps = {
  comment: {
    _id: Doc<"comments">["_id"]
    _creationTime: number
    content: string
    author: Doc<"users"> | null | undefined
  }
}

export const CommentItem = ({ comment }: CommentItemProps) => {
  const isVerified =
    comment.author?.accountType === "CREATOR" ||
    comment.author?.accountType === "SUPERUSER"

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-2 mx-4 rounded-xl",
        "hover:bg-muted/50 transition-colors duration-200",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <Link href={`/${comment.author?.username}`} className="shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage
            src={comment.author?.image}
            alt={comment.author?.name || "Avatar"}
            className="object-cover"
          />
          <AvatarFallback className="text-xs bg-muted text-muted-foreground font-semibold">
            {comment.author?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/${comment.author?.username}`}
                className="text-sm font-semibold hover:text-primary transition-colors truncate"
              >
                {comment.author?.name}
              </Link>
              {isVerified && (
                <span className="flex items-center justify-center size-4 rounded-full bg-primary shrink-0">
                  <BadgeCheck className="size-2.5 text-primary-foreground" />
                </span>
              )}
              <span className="text-muted-foreground/60 text-xs">
                {formatPostDate(comment._creationTime)}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">
              {comment.content}
            </p>
          </div>
          <CommentEllipsis
            commentId={comment._id}
            author={comment.author}
            initialContent={comment.content}
          />
        </div>
      </div>
    </div>
  )
}
