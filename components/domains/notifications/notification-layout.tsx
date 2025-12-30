"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { AnimatePresence, motion } from "motion/react"
import { Bell, Inbox } from "lucide-react"
import { useMemo, useState } from "react"
import { PageContainer } from "@/components/layout"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { containerVariants, itemVariants } from "@/lib/animations"
import { NotificationActions } from "./notification-actions"
import {
  NotificationFilterTabs,
  NotificationFilterType,
} from "./notification-filter-tabs"
import { ExtendedNotificationProps, NotificationItem } from "./notification-item"

export const NotificationsLayout = () => {
  const { isAuthenticated } = useConvexAuth()
  const [activeFilter, setActiveFilter] = useState<NotificationFilterType>("all")

  const userNotifications = useQuery(
    api.notifications.getNotificationsByType,
    isAuthenticated
      ? { type: activeFilter === "all" ? undefined : activeFilter }
      : "skip"
  ) as ExtendedNotificationProps[] | undefined

  const unreadCount = useMemo(() => {
    if (!userNotifications) return 0
    return userNotifications.filter((n) => !n.read).length
  }, [userNotifications])

  const isLoading = userNotifications === undefined && isAuthenticated

  return (
    <PageContainer
      headerContent={
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -20, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Bell className="size-6" />
          </motion.div>
          <span className="text-xl font-bold">Notifications</span>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-[calc(var(--header-height))] z-20 px-4 pb-4 pt-2"
      >
        {/* Header with filter dropdown and actions */}
        <div className="flex items-center justify-between gap-4">
          <NotificationFilterTabs
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
          <NotificationActions unreadCount={unreadCount} />
        </div>
      </motion.div>

      {/* Content area */}
      <div className="px-4 pb-8">
        {isLoading ? (
          <NotificationsSkeleton />
        ) : userNotifications?.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {userNotifications?.map((notification, index) => (
                <motion.div
                  key={notification._id}
                  variants={itemVariants}
                  layout
                  style={{ originY: 0 }}
                >
                  <NotificationItem notification={notification} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </PageContainer>
  )
}

const EmptyState = ({ filter }: { filter: NotificationFilterType }) => {
  const getEmptyMessage = () => {
    switch (filter) {
      case "like":
        return "Aucun j'aime pour le moment"
      case "comment":
        return "Aucun commentaire pour le moment"
      case "newSubscription":
        return "Aucun nouvel abonnement pour le moment"
      case "newPost":
        return "Aucune nouvelle publication pour le moment"
      default:
        return "Aucune notification pour le moment"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="glass-card flex flex-col items-center justify-center py-16"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
        className="bg-muted mb-4 flex size-16 items-center justify-center rounded-2xl"
      >
        <Inbox className="text-muted-foreground size-8" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground text-center text-lg"
      >
        {getEmptyMessage()}
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground/60 mt-1 text-center text-sm"
      >
        Les nouvelles notifications apparaîtront ici
      </motion.p>
    </motion.div>
  )
}

const NotificationsSkeleton = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-notification rounded-xl p-4"
        >
          <div className="flex gap-4">
            <Skeleton className="size-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="mt-3 h-16 w-full rounded-lg" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
