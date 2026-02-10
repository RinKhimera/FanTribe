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
        "mx-4 my-4 p-5 rounded-2xl",
        "glass-premium",
        "border border-primary/10",
        "hover:border-primary/25 transition-all duration-300",
        "hover:shadow-[0_4px_24px_color-mix(in_oklch,var(--primary)_25%,transparent)]",
      )}
      onClick={handleCreatePostClick}
    >
      <div className="flex items-start gap-4">
        <Avatar className="size-12 shrink-0">
          <AvatarImage
            src={currentUser?.image || ""}
            width={100}
            height={100}
            className="aspect-square h-full w-full object-cover"
            alt={currentUser?.username || "Profile image"}
          />
          <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
            {currentUser?.name?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <TextareaAutosize
            placeholder="Partager une publication..."
            className={cn(
              "w-full cursor-pointer resize-none border-none bg-transparent",
              "text-lg placeholder:text-muted-foreground/50",
              "outline-none focus:outline-none",
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
          <div className="h-px bg-border my-4" />

          <div className="flex items-center justify-between">
            {currentUser !== undefined && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn(
                  "rounded-full h-10 w-10",
                  "hover:bg-primary/10 hover:text-primary",
                  "transition-all duration-200",
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
                "rounded-full px-6 h-10",
                "font-semibold tracking-wide",
              )}
              onClick={(e) => {
                e.stopPropagation()
                handleCreatePostClick()
              }}
              type="button"
            >
              <Sparkles className="size-4 mr-2" />
              Publier
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
