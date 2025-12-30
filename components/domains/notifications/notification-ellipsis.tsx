"use client"

import { useMutation } from "convex/react"
import { motion } from "motion/react"
import { Check, Ellipsis, EyeOff, Trash2 } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config/logger"

interface NotificationEllipsisProps {
  notificationId: Id<"notifications">
  notificationRead: boolean
  onDelete?: () => void
}

const NotificationEllipsis = ({
  notificationId,
  notificationRead,
  onDelete,
}: NotificationEllipsisProps) => {
  const [isPending, startTransition] = useTransition()

  const markAsRead = useMutation(api.notifications.markNotificationAsRead)
  const markAsUnread = useMutation(api.notifications.markNotificationAsUnread)
  const deleteNotification = useMutation(api.notifications.deleteNotification)

  const handleMarkAsRead = () => {
    startTransition(async () => {
      try {
        await markAsRead({ notificationId })
        toast.success("Notification marquée comme lue")
      } catch (error) {
        logger.error("Failed to mark notification as read", error, {
          notificationId,
        })
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  const handleMarkAsUnread = () => {
    startTransition(async () => {
      try {
        await markAsUnread({ notificationId })
        toast.success("Notification marquée comme non lue")
      } catch (error) {
        logger.error("Failed to mark notification as unread", error, {
          notificationId,
        })
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteNotification({ notificationId })
        onDelete?.()
        toast.success("Notification supprimée")
      } catch (error) {
        logger.error("Failed to delete notification", error, {
          notificationId,
        })
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-lg opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
          >
            <Ellipsis className="size-4" />
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="bg-popover w-64 p-1.5"
        side="left"
        align="start"
      >
        {notificationRead ? (
          <DropdownMenuItem
            onClick={handleMarkAsUnread}
            disabled={isPending}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5"
          >
            <EyeOff className="size-4" />
            <span>Marquer comme non lue</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={handleMarkAsRead}
            disabled={isPending}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5"
          >
            <Check className="size-4" />
            <span>Marquer comme lue</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-border/50 my-1" />

        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isPending}
          className="text-destructive focus:text-destructive flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5"
        >
          <Trash2 className="size-4" />
          <span>Supprimer</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificationEllipsis
