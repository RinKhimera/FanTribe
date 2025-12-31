"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { BadgeCheck, Lock, Pin } from "lucide-react"
import Link from "next/link"
import { PostEllipsis } from "@/components/domains/posts"
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
  isPinned?: boolean
}

export const PostHeader = ({
  author,
  postId,
  createdAt,
  visibility,
  currentUser,
  canViewMedia,
  onRequireSubscribe,
  isPinned,
}: PostHeaderProps) => {
  const isOwnPost = currentUser._id === author?._id
  const isVerified =
    author?.accountType === "CREATOR" || author?.accountType === "SUPERUSER"

  return (
    <div className="flex items-start justify-between gap-3 px-4">
      {/* Avatar et infos auteur */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {author ? (
          <Link
            href={`/${author.username}`}
            prefetch={false}
            className={cn(
              "focus-visible:ring-primary shrink-0 rounded-full",
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              "group relative",
            )}
            aria-label={`Aller au profil de ${author.username}`}
          >
            <Avatar className="size-12">
              <AvatarImage
                src={author.image}
                width={48}
                height={48}
                alt={author.username || "Profile image"}
                className="aspect-square object-cover"
              />
              <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                {author.name?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            {/* Online indicator */}
            {author.isOnline && (
              <span className="absolute -right-0.5 -bottom-0.5 flex size-3">
                <span className="ring-background relative inline-flex size-3 rounded-full bg-green-500 ring-2" />
              </span>
            )}
          </Link>
        ) : (
          <Avatar className="size-12">
            <AvatarFallback className="bg-muted text-muted-foreground">
              ?
            </AvatarFallback>
          </Avatar>
        )}

        <div className="flex min-w-0 flex-col">
          {/* Nom + badge vérifié */}
          <div className="flex items-center gap-1.5">
            {author ? (
              <Link
                href={`/${author.username}`}
                className={cn(
                  "focus-visible:ring-primary truncate font-semibold tracking-tight",
                  "hover:text-primary focus-visible:ring-2 focus-visible:outline-none",
                  "transition-colors duration-200",
                )}
              >
                {author.name}
              </Link>
            ) : (
              <span className="text-muted-foreground">Utilisateur</span>
            )}
            {isVerified && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center justify-center size-[18px] rounded-full bg-primary shrink-0">
                    <BadgeCheck className="size-3 text-primary-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4}>
                  <p className="text-xs">Créateur vérifié</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Username + date */}
          <div className="flex items-center gap-1.5 text-sm">
            {author && (
              <Link
                href={`/${author.username}`}
                className={cn(
                  "text-muted-foreground hover:text-primary",
                  "transition-colors duration-200",
                )}
              >
                @{author.username}
              </Link>
            )}
            <span className="text-muted-foreground/40">·</span>
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
                      "transition-colors duration-200 hover:underline",
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

      {/* Actions (ellipsis + visibility + pinned) */}
      <div className="flex items-center gap-0.5">
        {isPinned && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex size-8 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                <Pin className="size-3.5 text-primary" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4}>
              <p className="text-xs">Publication épinglée</p>
            </TooltipContent>
          </Tooltip>
        )}
        {visibility === "subscribers_only" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex size-8 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                <Lock className="size-3.5 text-primary" />
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
          isPinned={isPinned}
        />
      </div>
    </div>
  )
}
