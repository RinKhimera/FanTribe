"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { BadgeCheck, Lock } from "lucide-react"
import Link from "next/link"
import { PostEllipsis } from "@/components/home/post-ellipsis"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { formatPostDate } from "@/lib/formatters"
import { cn } from "@/lib/utils"

type PostHeaderProps = {
  author: Doc<"users"> | null | undefined
  postId: Id<"posts">
  createdAt: number
  visibility: "public" | "subscribers_only"
  currentUser: Doc<"users">
  canViewMedia: boolean
  onRequireSubscribe: () => void
}

export const PostHeader = ({
  author,
  postId,
  createdAt,
  visibility,
  currentUser,
  canViewMedia,
  onRequireSubscribe,
}: PostHeaderProps) => {
  const isOwnPost = currentUser._id === author?._id
  const isVerified =
    author?.accountType === "CREATOR" || author?.accountType === "SUPERUSER"

  return (
    <div className="flex items-start justify-between gap-2 px-4">
      {/* Avatar et infos auteur */}
      <div className="flex items-start gap-3">
        <Link
          href={`/${author?.username}`}
          prefetch={false}
          className={cn(
            "focus-visible:ring-primary shrink-0 rounded-full",
            "focus-visible:ring-2 focus-visible:outline-none",
            "group relative",
          )}
          aria-label={`Aller au profil de ${author?.username}`}
        >
          <Avatar className="group-hover:ring-primary/30 size-11 ring-2 ring-transparent transition-all duration-200">
            <AvatarImage
              src={author?.image}
              width={100}
              height={100}
              alt={author?.username || "Profile image"}
              className="aspect-square object-cover"
            />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {author?.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>

          {/* Online indicator */}
          {author?.isOnline && (
            <span className="absolute -right-0.5 -bottom-0.5 flex size-2.5">
              <span className="ring-background relative inline-flex size-2.5 rounded-full bg-green-500 ring-2" />
            </span>
          )}
        </Link>

        <div className="flex min-w-0 flex-col">
          {/* Nom + badge vérifié */}
          <div className="flex items-center gap-1.5">
            <Link
              href={`/${author?.username}`}
              className={cn(
                "focus-visible:ring-primary truncate font-semibold",
                "hover:underline focus-visible:ring-2 focus-visible:outline-none",
                "transition-colors duration-150",
              )}
            >
              {author?.name}
            </Link>
            {isVerified && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <BadgeCheck className="fill-primary text-primary-foreground size-4 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4}>
                  <p className="text-xs">Créateur vérifié</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Username + date */}
          <div className="flex items-center gap-1.5 text-sm">
            <Link
              href={`/${author?.username}`}
              className={cn(
                "text-muted-foreground hover:text-primary",
                "transition-colors duration-150",
              )}
            >
              @{author?.username}
            </Link>
            <span className="text-muted-foreground/50">·</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/${author?.username}/post/${postId}`}
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!canViewMedia && author && !isOwnPost) {
                        e.preventDefault()
                        onRequireSubscribe()
                      }
                    }}
                    className={cn(
                      "text-muted-foreground hover:text-primary",
                      "transition-colors duration-150 hover:underline",
                    )}
                    aria-label="Voir le post"
                  >
                    {formatPostDate(createdAt)}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4}>
                  {format(new Date(createdAt), "d MMMM yyyy 'à' HH:mm", {
                    locale: fr,
                  })}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Actions (ellipsis + visibility) */}
      <div className="flex items-center gap-1">
        {visibility === "subscribers_only" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex size-8 items-center justify-center">
                <Lock className="text-muted-foreground size-3.5" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4}>
              <p className="text-xs">Réservé aux abonnés</p>
            </TooltipContent>
          </Tooltip>
        )}
        <PostEllipsis
          postId={postId}
          currentUser={currentUser}
          postAuthorId={author?._id}
          visibility={visibility}
          postAuthorUsername={author?.username}
        />
      </div>
    </div>
  )
}
