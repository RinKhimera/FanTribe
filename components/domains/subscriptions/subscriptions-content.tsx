"use client"

import { useConvexAuth, useMutation, usePaginatedQuery } from "convex/react"
import { Loader2, Search, Shield, UserX, Users } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PageContainer } from "@/components/layout"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useDebounce } from "@/hooks/useDebounce"
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll"
import { containerVariants, itemVariants } from "@/lib/animations"
import { formatCustomTimeAgo } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { SubscriptionCard } from "./subscription-card"

const INITIAL_ITEMS = 20
const LOAD_MORE_ITEMS = 10

type FilterType = "all" | "active" | "expired" | "blocked"

const filterTabs: { value: FilterType; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "active", label: "Actifs" },
  { value: "expired", label: "Expirés" },
  { value: "blocked", label: "Bloqués" },
]

export const SubscriptionsContent = () => {
  const { isAuthenticated } = useConvexAuth()
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const debouncedSearch = useDebounce(search, 300)

  const isBlockedTab = activeFilter === "blocked"
  const subscriptionFilter = isBlockedTab ? "all" : activeFilter

  const queryArgs = useMemo(
    () => ({
      filter: subscriptionFilter as "all" | "active" | "expired",
      search: debouncedSearch || undefined,
    }),
    [subscriptionFilter, debouncedSearch],
  )

  const { results, status, loadMore } = usePaginatedQuery(
    api.subscriptions.getMySubscriptionsPaginated,
    isAuthenticated && !isBlockedTab ? queryArgs : "skip",
    { initialNumItems: INITIAL_ITEMS },
  )

  const { loadMoreRef } = useInfiniteScroll({
    status,
    loadMore,
    numItems: LOAD_MORE_ITEMS,
  })

  const isLoading = status === "LoadingFirstPage"
  const hasResults = results && results.length > 0
  const isFiltered = activeFilter !== "all" || debouncedSearch.length > 0

  return (
    <PageContainer
      title="Mes abonnements"
    >
      <div className="px-4 py-4 space-y-4">
        {/* Search bar — hidden when on blocked tab (it has its own) */}
        {!isBlockedTab && (
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Rechercher un créateur…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label="Rechercher un créateur"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveFilter(tab.value)}
              className={cn(
                "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activeFilter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
              aria-label={`Filtrer : ${tab.label}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Blocked users tab content */}
        {isBlockedTab ? (
          <BlockedUsersSection />
        ) : (
          <>
            {/* Subscriptions content */}
            {isLoading ? (
              <SubscriptionsSkeleton />
            ) : !hasResults ? (
              <EmptyState isFiltered={isFiltered} />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className="grid gap-4 sm:grid-cols-2"
              >
                <AnimatePresence mode="popLayout">
                  {results.map((subscription) => (
                    <motion.div
                      key={subscription._id}
                      variants={itemVariants}
                      layout
                      style={{ originY: 0 }}
                    >
                      <SubscriptionCard subscription={subscription} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Infinite scroll sentinel */}
            {status === "CanLoadMore" && (
              <div ref={loadMoreRef} className="h-4" />
            )}

            {/* Loading more indicator */}
            {status === "LoadingMore" && (
              <div className="flex justify-center py-4">
                <Loader2 className="text-muted-foreground size-5 animate-spin" aria-hidden="true" />
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  )
}

// ============================================================================
// Blocked Users Section
// ============================================================================

type BlockedEntry = {
  blockId: string
  blockedAt: number
  user: {
    _id: string
    name: string
    username?: string
    image: string
  }
}

const BlockedUsersSection = () => {
  const { isAuthenticated } = useConvexAuth()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null)

  const { results, status, loadMore } = usePaginatedQuery(
    api.blocks.getBlockedUsersPaginated,
    isAuthenticated
      ? { search: debouncedSearch || undefined }
      : "skip",
    { initialNumItems: INITIAL_ITEMS },
  )

  const unblockUser = useMutation(api.blocks.unblockUser)

  const { loadMoreRef } = useInfiniteScroll({
    status,
    loadMore,
    numItems: LOAD_MORE_ITEMS,
  })

  const handleUnblock = async (entry: BlockedEntry) => {
    setUnblockingUserId(entry.user._id)
    try {
      await unblockUser({
        targetUserId: entry.user._id as Id<"users">,
      })
      toast.success("Utilisateur débloqué", {
        description: `${entry.user.name} a été débloqué`,
      })
    } catch {
      toast.error("Erreur lors du déblocage")
    } finally {
      setUnblockingUserId(null)
    }
  }

  const isLoading = status === "LoadingFirstPage"
  const blockedUsers = (results ?? []) as BlockedEntry[]

  return (
    <div className="space-y-4">
      {/* Search within blocked users */}
      <div className="relative">
        <Search
          className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur bloqué…"
          className="pl-10"
          aria-label="Rechercher un utilisateur bloqué"
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {/* Loading state */}
      {isLoading && <BlockedSkeleton />}

      {/* Empty state */}
      {!isLoading && blockedUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden"
        >
          <div className="glass-card relative flex flex-col items-center justify-center px-6 py-12 sm:py-16">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-muted/40 via-transparent to-transparent opacity-60" />

            <div className="relative mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.15,
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
                className="relative flex size-20 items-center justify-center rounded-2xl bg-muted"
              >
                <Shield
                  className="text-muted-foreground size-10"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </motion.div>
            </div>

            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="mb-2 text-center text-lg font-semibold tracking-tight"
            >
              {debouncedSearch
                ? "Aucun résultat"
                : "Aucun utilisateur bloqué"}
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="text-muted-foreground max-w-xs text-center text-sm leading-relaxed"
            >
              {debouncedSearch
                ? "Aucun utilisateur bloqué ne correspond à votre recherche."
                : "Vous n\u2019avez bloqué personne pour le moment."}
            </motion.p>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="via-border mt-8 h-px w-24 bg-linear-to-r from-transparent to-transparent"
            />
          </div>
        </motion.div>
      )}

      {/* Blocked users list */}
      {!isLoading && blockedUsers.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="space-y-2"
        >
          <AnimatePresence mode="popLayout">
            {blockedUsers.map((entry) => {
              const isUnblocking = unblockingUserId === entry.user._id
              const profileHref = entry.user.username
                ? `/${entry.user.username}`
                : "#"

              return (
                <motion.div
                  key={entry.blockId}
                  variants={itemVariants}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.25 } }}
                  layout
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3",
                    "transition-colors hover:bg-muted/50",
                  )}
                >
                  <Link href={profileHref} className="shrink-0">
                    <Avatar className="size-10">
                      <AvatarImage
                        src={entry.user.image}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-muted text-xs">
                        {entry.user.name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={profileHref}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {entry.user.name}
                      </Link>
                      {entry.user.username && (
                        <span className="text-muted-foreground truncate text-xs">
                          @{entry.user.username}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Bloqué depuis {formatCustomTimeAgo(entry.blockedAt)}
                    </p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUnblocking}
                        className="shrink-0"
                      >
                        {isUnblocking ? (
                          <Loader2
                            aria-hidden="true"
                            className="mr-1.5 size-3.5 animate-spin"
                          />
                        ) : (
                          <UserX
                            aria-hidden="true"
                            className="mr-1.5 size-3.5"
                          />
                        )}
                        Débloquer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Débloquer {entry.user.name} ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette personne pourra à nouveau voir votre contenu et
                          vous envoyer des messages.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleUnblock(entry)}
                        >
                          Débloquer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Infinite scroll sentinel */}
      {status === "CanLoadMore" && (
        <div ref={loadMoreRef} className="h-4" />
      )}

      {/* Loading more indicator */}
      {status === "LoadingMore" && (
        <div className="flex justify-center py-4">
          <Loader2 className="text-muted-foreground size-5 animate-spin" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Skeleton & Empty States
// ============================================================================

const BlockedSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 rounded-lg border p-3"
      >
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-24 shrink-0" />
      </div>
    ))}
  </div>
)

const EmptyState = ({ isFiltered }: { isFiltered: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden"
    >
      <div className="glass-card relative flex flex-col items-center justify-center px-6 py-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/20 via-transparent to-transparent opacity-60" />

        <div className="relative mb-6">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.15,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="relative flex size-20 items-center justify-center rounded-2xl bg-primary/10"
          >
            <Users className="size-10 text-primary" strokeWidth={1.5} aria-hidden="true" />
          </motion.div>
        </div>

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mb-2 text-center text-lg font-semibold tracking-tight"
        >
          {isFiltered
            ? "Aucun résultat"
            : "Aucun abonnement"}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="text-muted-foreground max-w-xs text-center text-sm leading-relaxed"
        >
          {isFiltered
            ? "Aucun abonnement ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
            : "Vous n'êtes abonné à aucun créateur pour le moment. Découvrez des créateurs dans l'onglet Explorer."}
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

const SubscriptionsSkeleton = () => {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-lg border p-4"
        >
          <div className="flex gap-3">
            <Skeleton className="size-14 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
