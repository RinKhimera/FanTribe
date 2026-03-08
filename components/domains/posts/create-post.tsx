"use client"

import { ImagePlus, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import TextareaAutosize from "react-textarea-autosize"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Doc } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

export const CreatePost = ({
  currentUser,
}: {
  currentUser: Doc<"users"> | undefined
}) => {
  const router = useRouter()

  const handleCreatePostClick = () => {
    if (
      currentUser?.accountType === "CREATOR" ||
      currentUser?.accountType === "SUPERUSER"
    ) {
      router.push("/new-post")
    } else {
      router.push("/be-creator")
    }
  }

  return (
    <div
      className={cn(
        "relative cursor-pointer max-sm:hidden",
        "mx-4 my-4 rounded-2xl p-5",
        "glass-premium",
        "border-primary/10 border",
        "hover:border-primary/25 transition-[border-color,box-shadow] duration-300",
        "hover:shadow-[0_4px_24px_color-mix(in_oklch,var(--primary)_25%,transparent)]",
      )}
      onClick={handleCreatePostClick}
    >
      <div className="flex items-start gap-4">
        <Avatar className="size-12 shrink-0">
          <AvatarImage
            src={currentUser?.image || ""}
            alt={currentUser?.username || "Profile image"}
          />
          <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
            {currentUser?.name?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <TextareaAutosize
            placeholder="Partager une publication…"
            className={cn(
              "w-full cursor-pointer resize-none border-none bg-transparent",
              "placeholder:text-muted-foreground/50 text-lg",
              "focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-hidden",
            )}
            onClick={(e) => {
              e.stopPropagation()
              handleCreatePostClick()
            }}
            readOnly
            minRows={2}
            maxRows={4}
          />

          {/* Divider */}
          <div className="bg-border my-4 h-px" />

          <div className="flex items-center justify-between">
            {currentUser !== undefined && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn(
                  "h-10 w-10 rounded-full",
                  "hover:bg-primary/10 hover:text-primary",
                  "transition-colors duration-200",
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  handleCreatePostClick()
                }}
              >
                <ImagePlus className="size-5" />
              </Button>
            )}

            <Button
              className={cn(
                "h-10 rounded-full px-6",
                "font-semibold tracking-wide",
              )}
              onClick={(e) => {
                e.stopPropagation()
                handleCreatePostClick()
              }}
              type="button"
            >
              <Sparkles className="mr-2 size-4" />
              Publier
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
