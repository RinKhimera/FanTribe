"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { NotificationItem } from "@/components/notifications/notification-item"
import { api } from "@/convex/_generated/api"

export const NotificationsLayout = () => {
  // We need to call database from client component to get reactivity when changing read status
  const { isAuthenticated } = useConvexAuth()

  const userNotifications = useQuery(
    api.notifications.getUserNotifications,
    isAuthenticated ? undefined : "skip",
  )

  return (
    <main className="border-muted flex h-full min-h-screen w-[50%] flex-col border-r border-l max-[500px]:pb-16 max-lg:w-[80%] max-sm:w-full">
      <h1 className="border-muted sticky top-0 z-20 border-b p-4 text-2xl font-bold backdrop-blur-sm">
        Notifications
      </h1>

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
    </main>
  )
}
