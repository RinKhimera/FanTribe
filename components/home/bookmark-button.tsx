"use client"

import { useMutation, useQuery } from "convex/react"
import { Bookmark } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config"
import { cn } from "@/lib/utils"

type BookmarkButtonProps = {
  postId: Id<"posts">
  disabled?: boolean
}

export const BookmarkButton = ({
  postId,
  disabled = false,
}: BookmarkButtonProps) => {
  const addBookmark = useMutation(api.bookmarks.addBookmark)
  const removeBookmark = useMutation(api.bookmarks.removeBookmark)
  const bookmarkedQuery = useQuery(api.bookmarks.isBookmarked, { postId })
  const isBookmarked = bookmarkedQuery?.bookmarked || false

  const [isPending, startTransition] = useTransition()

  const handleAddBookmark = () => {
    startTransition(async () => {
      try {
        await addBookmark({ postId })
        toast.success("La publication a été ajoutée à vos collections")
      } catch (error) {
        logger.error("Erreur ajout bookmark", error, { postId })
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  const handleRemoveBookmark = () => {
    startTransition(async () => {
      try {
        await removeBookmark({ postId })
        toast.success("La publication a été retirée de vos collections")
      } catch (error) {
        logger.error("Erreur suppression bookmark", error, { postId })
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  const handleBookmark = () => {
    if (disabled || isPending) return
    if (isBookmarked) handleRemoveBookmark()
    else handleAddBookmark()
  }

  return (
    <Button
      variant={"ghost"}
      disabled={isPending || disabled}
      onClick={handleBookmark}
      className={cn("size-8 rounded-full transition-colors", {
        "cursor-not-allowed opacity-50": disabled,
        "bg-blue-600/15 text-blue-500": isBookmarked,
        "hover:bg-blue-600/15 hover:text-blue-500": !disabled && !isBookmarked,
      })}
    >
      <Bookmark
        className={cn("!size-[19px]", isBookmarked ? "fill-current" : "")}
      />
    </Button>
  )
}
