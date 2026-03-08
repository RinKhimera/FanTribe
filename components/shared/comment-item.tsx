"use client"

import Link from "next/link"
import React from "react"
import { CommentEllipsis } from "@/components/domains/posts"
import { UserProfileBadgeInline } from "@/components/domains/users/user-profile-badges"
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
  return (
    <div
      className={cn(
        "mx-4 flex gap-3 rounded-xl px-4 py-2",
        "hover:bg-muted/50 transition-colors duration-200",
      )}
      role="presentation"
      onClick={(e) => e.stopPropagation()}
    >
      <Link href={`/${comment.author?.username}`} className="shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage
            src={comment.author?.image}
            alt={comment.author?.name || "Avatar"}
            className="object-cover"
          />
          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
            {comment.author?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href={`/${comment.author?.username}`}
                className="hover:text-primary truncate text-sm font-semibold transition-colors"
              >
                {comment.author?.name}
              </Link>
              <UserProfileBadgeInline
                accountType={comment.author?.accountType}
              />
              <span className="text-muted-foreground/60 text-xs">
                {formatPostDate(comment._creationTime)}
              </span>
            </div>
            <p className="text-foreground/90 mt-1 text-sm leading-relaxed break-words">
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
