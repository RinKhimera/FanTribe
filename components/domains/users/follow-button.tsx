"use client"

import { useMutation, useQuery } from "convex/react"
import { Loader2, UserCheck, UserPlus } from "lucide-react"
import { motion } from "motion/react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

interface FollowButtonProps {
  targetUserId: Id<"users">
  className?: string
  variant?: "default" | "compact"
}

export const FollowButton = ({
  targetUserId,
  className,
  variant = "default",
}: FollowButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const isFollowing = useQuery(api.follows.isFollowing, { targetUserId })
  const followMutation = useMutation(api.follows.followUser)
  const unfollowMutation = useMutation(api.follows.unfollowUser)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLoading(true)
    try {
      if (isFollowing) {
        await unfollowMutation({ targetUserId })
        toast.success("Vous ne suivez plus ce créateur")
      } else {
        await followMutation({ targetUserId })
        toast.success("Vous suivez maintenant ce créateur")
      }
    } catch {
      toast.error("Une erreur s'est produite")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFollowing === undefined) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={cn("rounded-full", className)}
      >
        <Loader2 className="size-4 animate-spin" />
      </Button>
    )
  }

  if (variant === "compact") {
    return (
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          onClick={handleToggle}
          disabled={isLoading}
          className={cn("rounded-full px-3 text-xs", className)}
          aria-label={isFollowing ? "Ne plus suivre" : "Suivre"}
        >
          {isLoading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : isFollowing ? (
            <>
              <UserCheck className="mr-1 size-3" />
              Suivi
            </>
          ) : (
            <>
              <UserPlus className="mr-1 size-3" />
              Suivre
            </>
          )}
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <Button
        variant={isFollowing ? "outline" : "default"}
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          "w-full rounded-2xl py-5 text-base font-semibold",
          isFollowing
            ? "border-primary/30 bg-primary/5"
            : "bg-primary shadow-lg shadow-primary/20",
          className,
        )}
        aria-label={isFollowing ? "Ne plus suivre" : "Suivre"}
      >
        {isLoading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="mr-2 size-4" />
        ) : (
          <UserPlus className="mr-2 size-4" />
        )}
        {isFollowing ? "Suivi" : "Suivre"}
      </Button>
    </motion.div>
  )
}
