"use client"

import Link from "next/link"
import React from "react"
import { CommentEllipsis } from "@/components/domains/posts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Doc } from "@/convex/_generated/dataModel"
import { formatPostDate } from "@/lib/formatters"

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
    <div className="flex gap-3 px-4" onClick={(e) => e.stopPropagation()}>
      <Link href={`/${comment.author?.username}`} className="shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage
            src={comment.author?.image}
            alt={comment.author?.name || "Avatar"}
            className="object-cover"
          />
          <AvatarFallback className="text-xs">
            {comment.author?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/${comment.author?.username}`}
                className="text-sm font-semibold hover:underline"
              >
                {comment.author?.name}
              </Link>
              <span className="text-muted-foreground text-xs">
                {formatPostDate(comment._creationTime)}
              </span>
            </div>
            <p className="mt-0.5 text-sm leading-relaxed">{comment.content}</p>
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
