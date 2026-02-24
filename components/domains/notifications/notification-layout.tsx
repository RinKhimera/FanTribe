"use client"

import { useConvexAuth, usePaginatedQuery } from "convex/react"
import {
  Bell,
  Coins,
  CreditCard,
  Heart,
  ImagePlus,
  Loader2,
  MessageSquareText,
  Sparkles,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useMemo, useState } from "react"
import { PageContainer } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { containerVariants, itemVariants } from "@/lib/animations"
import { cn } from "@/lib/utils"
import { NotificationActions } from "./notification-actions"
import {
  NotificationFilterTabs,
  NotificationFilterType,
} from "./notification-filter-tabs"
import { NotificationItem } from "./notification-item"

const INITIAL_NUM_ITEMS = 20
const LOAD_MORE_ITEMS = 20

export const NotificationsLayout = () => {
  const { isAuthenticated } = useConvexAuth()
  const [activeFilter, setActiveFilter] =
    useState<NotificationFilterType>("all")

  const { results, status, loadMore } = usePaginatedQuery(
    api.notifications.getNotifications,
    isAuthenticated ? { filter: activeFilter } : "skip",
    { initialNumItems: INITIAL_NUM_ITEMS },
  )

  const unreadCount = useMemo(() => {
    if (!results) return 0
    return results.filter((n) => !n.isRead).length
  }, [results])

  const isLoading = status === "LoadingFirstPage"

  return (
    <PageContainer
      title="Notifications"
      secondaryBar={
        <div className="flex items-center justify-between gap-4 px-4 py-2">
          <NotificationFilterTabs
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
          <NotificationActions unreadCount={unreadCount} />
        </div>
      }
    >
      {/* Content area */}
      <div className="px-4 py-4">
        {isLoading ? (
          <NotificationsSkeleton />
        ) : results?.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {results?.map((notification) => (
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

            {/* Load more button */}
            {status === "CanLoadMore" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center pt-4"
              >
                <Button
                  variant="ghost"
                  onClick={() => loadMore(LOAD_MORE_ITEMS)}
                  className="glass-button gap-2"
                >
                  <Loader2 className="size-4" aria-hidden="true" />
                  Charger plus
                </Button>
              </motion.div>
            )}

            {status === "LoadingMore" && (
              <div className="flex justify-center py-4">
                <Loader2 className="text-muted-foreground size-5 animate-spin" aria-hidden="true" />
              </div>
            )}
          </motion.div>
        )}
      </div>
    </PageContainer>
  )
}

const emptyStateConfig: Record<
  NotificationFilterType,
  {
    icon: React.ElementType
    title: string
    description: string
    iconBg: string
    iconColor: string
    accentGradient: string
  }
> = {
  all: {
    icon: Bell,
    title: "Aucune notification",
    description:
      "Vos notifications apparaîtront ici dès que vous aurez de l'activité",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    accentGradient: "from-primary/20 via-transparent to-transparent",
  },
  like: {
    icon: Heart,
    title: "Aucun j'aime",
    description:
      "Partagez du contenu pour recevoir des j'aime de votre communauté",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
    accentGradient: "from-rose-500/20 via-transparent to-transparent",
  },
  comment: {
    icon: MessageSquareText,
    title: "Aucun commentaire",
    description: "Engagez votre audience pour recevoir des commentaires",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-500",
    accentGradient: "from-sky-500/20 via-transparent to-transparent",
  },
  subscriptions: {
    icon: CreditCard,
    title: "Aucun abonnement",
    description: "Les notifications de vos abonnés apparaîtront ici",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    accentGradient: "from-emerald-500/20 via-transparent to-transparent",
  },
  newPost: {
    icon: ImagePlus,
    title: "Aucune publication",
    description:
      "Les nouvelles publications de vos créateurs favoris apparaîtront ici",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    accentGradient: "from-violet-500/20 via-transparent to-transparent",
  },
  tip: {
    icon: Coins,
    title: "Aucun pourboire",
    description: "Les pourboires que vous recevez apparaîtront ici",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    accentGradient: "from-amber-500/20 via-transparent to-transparent",
  },
}

const EmptyState = ({ filter }: { filter: NotificationFilterType }) => {
  const config = emptyStateConfig[filter]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden"
    >
      {/* Main Card */}
      <div className="glass-card relative flex flex-col items-center justify-center px-6 py-12 sm:py-16">
        {/* Subtle gradient accent */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-linear-to-br opacity-60",
            config.accentGradient,
          )}
        />

        {/* Decorative elements - geometric patterns */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.08, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="absolute -top-8 -right-8 size-32 rounded-full border-2 border-current"
            style={{ color: "var(--primary)" }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.05, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="absolute top-4 -right-4 size-24 rounded-full border border-current"
            style={{ color: "var(--primary)" }}
          />
          <motion.div
            initial={{ opacity: 0, rotate: 45, scale: 0.5 }}
            animate={{ opacity: 0.06, rotate: 45, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute -bottom-6 -left-6 size-20 border-2 border-current"
            style={{ color: "var(--primary)" }}
          />
        </div>

        {/* Icon with animated ring */}
        <div className="relative mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.3, 0.1, 0.3], scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className={cn("absolute inset-0 rounded-2xl", config.iconBg)}
            style={{ margin: "-8px" }}
          />
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.15,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className={cn(
              "relative flex size-20 items-center justify-center rounded-2xl",
              config.iconBg,
            )}
          >
            <Icon
              className={cn("size-10", config.iconColor)}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="size-5 text-amber-400" strokeWidth={2} aria-hidden="true" />
            </motion.div>
          </motion.div>
        </div>

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mb-2 text-center text-lg font-semibold tracking-tight"
        >
          {config.title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="text-muted-foreground max-w-xs text-center text-sm leading-relaxed"
        >
          {config.description}
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="via-border mt-8 h-px w-24 bg-linear-to-r from-transparent to-transparent"
        />
      </div>
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
