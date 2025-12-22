"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { PageContainer } from "@/components/layout"
import { api } from "@/convex/_generated/api"
import { NotificationItem } from "./notification-item"

export const NotificationsLayout = () => {
  // We need to call database from client component to get reactivity when changing read status
  const { isAuthenticated } = useConvexAuth()

  const userNotifications = useQuery(
    api.notifications.getUserNotifications,
    isAuthenticated ? undefined : "skip",
  )

  return (
    <PageContainer title="Notifications">
      {userNotifications?.length === 0 ? (
        <div className="text-muted-foreground mt-16 h-full px-4 text-center text-xl">
          Aucune notification pour le moment...
        </div>
      ) : (
        <div className="flex flex-col">
          {userNotifications?.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
            />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
