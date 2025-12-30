"use client"

import { useMutation } from "convex/react"
import { motion } from "motion/react"
import { CheckCheck, Loader2 } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { logger } from "@/lib/config"

interface NotificationActionsProps {
  unreadCount: number
}

export const NotificationActions = ({
  unreadCount,
}: NotificationActionsProps) => {
  const [isPending, startTransition] = useTransition()
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return

    startTransition(async () => {
      try {
        const result = await markAllAsRead()
        toast.success(`${result.count} notification(s) marquée(s) comme lue(s)`)
      } catch (error) {
        logger.error("Failed to mark all notifications as read", error)
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {unreadCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1.5"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </motion.div>
      )}

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllAsRead}
          disabled={isPending || unreadCount === 0}
          className="glass-button gap-1.5 rounded-lg px-2.5"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCheck className="size-4" />
          )}
          <span className="hidden sm:inline">Tout lu</span>
        </Button>
      </motion.div>
    </div>
  )
}
