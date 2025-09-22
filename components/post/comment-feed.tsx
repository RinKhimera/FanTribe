import { useQuery } from "convex/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import React from "react"
import { CommentEllipsis } from "@/components/post/comment-ellipsis"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

export const CommentFeed = ({ postId }: { postId: Id<"posts"> }) => {
  const postComments = useQuery(api.comments.listPostComments, { postId })

  return (
    <div className="flex flex-col">
      {postComments?.map((comment) => (
        <div
          key={comment._id}
          className="flex space-x-4 border-b px-4 pt-4 pb-2"
        >
          <div className="flex w-full flex-col">
            <div className="flex items-center justify-between">
              <Link href={`/${comment.author?.username}`}>
                <div className="flex items-center gap-3">
                  <Avatar className="overflow-hidden">
                    <AvatarImage
                      src={comment.author?.image}
                      alt={comment.author?.name || "Avatar"}
                    />
                    <AvatarFallback className="size-11">
                      <div className="animate-pulse rounded-full bg-gray-500"></div>
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left max-sm:text-sm">
                    <div className="font-bold">{comment.author?.name}</div>
                    <div className="text-muted-foreground">
                      @{comment.author?.username}
                    </div>
                  </div>
                </div>
              </Link>
              <div className="text-muted-foreground flex items-center gap-3">
                <>
                  {format(new Date(comment._creationTime), "d MMMM", {
                    locale: fr,
                  })}
                </>
                <CommentEllipsis
                  commentId={comment._id}
                  author={comment.author}
                />
              </div>
            </div>
            <div className="mt-1 flex flex-col sm:ml-[52px]">
              <div className="w-full text-base">
                {comment.content
                  .split("\n")
                  .filter((line) => line.trim() !== "")
                  .map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
