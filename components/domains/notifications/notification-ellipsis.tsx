"use client"

import { useMutation } from "convex/react"
import { Ellipsis } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config/logger"

const NotificationEllipsis = ({
  notificationId,
  notificationRead,
}: {
  notificationId: Id<"notifications">
  notificationRead: boolean
}) => {
  const [isPending, startTransition] = useTransition()

  const markAsRead = useMutation(api.notifications.markNotificationAsRead)
  const markAsUnread = useMutation(api.notifications.markNotificationAsUnread)

  const handleMarkAsRead = () => {
    startTransition(async () => {
      try {
        await markAsRead({ notificationId })
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={"icon"} variant="ghost">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-1" side="right">
        <DropdownMenuItem>
          {notificationRead ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleMarkAsUnread}
              disabled={isPending}
            >
              Marquer comme non lue
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleMarkAsRead}
              disabled={isPending}
            >
              Marquer comme lue
            </Button>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificationEllipsis
