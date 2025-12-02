"use client"

import { useMutation, useQuery } from "convex/react"
import { Heart } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config"
import { cn } from "@/lib/utils"

type LikeButtonProps = {
  postId: Id<"posts">
  disabled?: boolean
}

export const LikeButton = ({ postId, disabled = false }: LikeButtonProps) => {
  const [isPending, startTransition] = useTransition()

  const likedQuery = useQuery(api.likes.isLiked, { postId })
  const isLiked = likedQuery?.liked || false

  const likePost = useMutation(api.likes.likePost)
  const unlikePost = useMutation(api.likes.unlikePost)

  const handleToggle = () => {
    if (disabled || isPending) return
    startTransition(async () => {
      try {
        if (isLiked) await unlikePost({ postId })
        else await likePost({ postId })
      } catch (error) {
        logger.error("Erreur toggle like", error, { postId, isLiked })
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        className={cn("size-8 rounded-full transition-colors", {
          "cursor-not-allowed opacity-50": disabled || isPending,
          "bg-red-600/15 text-red-500": isLiked,
          "hover:bg-red-600/15 hover:text-red-500":
            !disabled && !isPending && !isLiked,
        })}
        onClick={handleToggle}
        disabled={disabled || isPending}
      >
        <Heart className={cn("!size-[20px]", isLiked ? "fill-current" : "")} />
      </Button>
    </div>
  )
}
