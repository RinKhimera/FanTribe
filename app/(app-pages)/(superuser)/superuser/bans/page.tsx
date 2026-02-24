"use client"

import { useMutation, useQuery } from "convex/react"
import {
  Ban,
  Calendar,
  Clock,
  History,
  Infinity as InfinityIcon,
  Shield,
  ShieldOff,
  User,
  UserX,
} from "lucide-react"
import { motion } from "motion/react"
import { useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useAsyncHandler, useCurrentUser } from "@/hooks"
import { pluralize } from "@/lib/formatters"
import { cn } from "@/lib/utils"

type BanFilter = "all" | "temporary" | "permanent"

const filterOptions: { value: BanFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "temporary", label: "Temporaires" },
  { value: "permanent", label: "Permanents" },
]

const banTypeConfig = {
  temporary: {
    label: "Temporaire",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    dotColor: "bg-amber-500",
  },
  permanent: {
    label: "Permanent",
    icon: InfinityIcon,
    className: "bg-red-500/10 text-red-600 border-red-500/20",
    dotColor: "bg-red-500",
  },
}

export default function BansPage() {
  const { currentUser } = useCurrentUser()
  const [activeTab, setActiveTab] = useState<"active" | "history">("active")
  const [filter, setFilter] = useState<BanFilter>("all")
  const [userToUnban, setUserToUnban] = useState<{
    id: Id<"users">
    name: string
    username?: string
  } | null>(null)

  const bannedUsers = useQuery(
    api.bans.getAllBannedUsers,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip"
  )

  const banHistory = useQuery(
    api.bans.getBanHistory,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip"
  )

  const unbanUser = useMutation(api.bans.unbanUser)

  const { execute, isPending } = useAsyncHandler({
    successMessage: "Ban levé",
    successDescription: `${userToUnban?.username ? `@${userToUnban.username}` : userToUnban?.name} peut à nouveau accéder à la plateforme.`,
    errorMessage: "Erreur lors de la levée du ban",
    onSuccess: () => setUserToUnban(null),
  })

  // Create stable keys for useMemo dependencies
  const bannedUsersKey = bannedUsers?.map((u) => `${u._id}-${u.banType}`).join(",") ?? ""
  const banHistoryKey = banHistory?.map((h) => `${h.userId}-${h.bannedAt}-${h.liftedAt}`).join(",") ?? ""

  const filteredBannedUsers = useMemo(() => {
    if (!bannedUsers) return []
    if (filter === "all") return bannedUsers
    return bannedUsers.filter((u) => u.banType === filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannedUsersKey, filter])

  const filteredHistory = useMemo(() => {
    if (!banHistory) return []
    if (filter === "all") return banHistory
    return banHistory.filter((h) => h.banType === filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banHistoryKey, filter])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getRemainingTime = (expiresAt: number) => {
    const now = Date.now()
    const diff = expiresAt - now
    if (diff <= 0) return "Expiré"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}j ${hours}h restants`
    return `${hours}h restantes`
  }

  const handleUnban = () => {
    if (!userToUnban) return
    execute(() => unbanUser({ userId: userToUnban.id }))
  }

  const isLoading = bannedUsers === undefined || banHistory === undefined

  const activeBansCount = bannedUsers?.length ?? 0
  const historyCount = banHistory?.length ?? 0

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 space-y-5 p-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20"
          >
            <Ban aria-hidden="true" className="h-5 w-5 text-red-500" />
          </motion.div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Gestion des bans
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeBansCount} {pluralize(activeBansCount, "ban actif", "bans actifs")}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "active" | "history")}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="active" className="gap-2">
                <Shield aria-hidden="true" className="h-4 w-4" />
                <span>Bans actifs</span>
                {activeBansCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 min-w-5 px-1.5 text-xs"
                  >
                    {activeBansCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History aria-hidden="true" className="h-4 w-4" />
                <span>Historique</span>
                {historyCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 min-w-5 px-1.5 text-xs"
                  >
                    {historyCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Filter pills */}
            <div className="flex gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    filter === option.value
                      ? "bg-foreground text-background"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Bans Tab */}
          <TabsContent value="active" className="mt-4">
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredBannedUsers.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="Aucun ban actif"
                description={
                  filter === "all"
                    ? "Aucun utilisateur n'est actuellement banni."
                    : `Aucun ban ${filter === "temporary" ? "temporaire" : "permanent"} actif.`
                }
              />
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } },
                }}
                className="space-y-3"
              >
                {filteredBannedUsers.map((user) => (
                  <BannedUserCard
                    key={user._id}
                    user={user}
                    formatDate={formatDate}
                    getRemainingTime={getRemainingTime}
                    onUnban={() =>
                      setUserToUnban({
                        id: user._id,
                        name: user.name,
                        username: user.username,
                      })
                    }
                  />
                ))}
              </motion.div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredHistory.length === 0 ? (
              <EmptyState
                icon={History}
                title="Aucun historique"
                description={
                  filter === "all"
                    ? "Aucun ban n'a encore été levé."
                    : `Aucun ban ${filter === "temporary" ? "temporaire" : "permanent"} dans l'historique.`
                }
              />
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } },
                }}
                className="space-y-3"
              >
                {filteredHistory.map((entry, idx) => (
                  <HistoryCard
                    key={`${entry.userId}-${entry.bannedAt}-${idx}`}
                    entry={entry}
                    formatDateTime={formatDateTime}
                  />
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Unban Confirmation Dialog */}
      <Dialog open={!!userToUnban} onOpenChange={() => setUserToUnban(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff aria-hidden="true" className="h-5 w-5 text-emerald-500" />
              Lever le ban
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir lever le ban de{" "}
              <span className="font-medium text-foreground">
                {userToUnban?.username
                  ? `@${userToUnban.username}`
                  : userToUnban?.name}
              </span>
              ? Cette personne pourra à nouveau accéder à la plateforme.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToUnban(null)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUnban}
              disabled={isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Traitement\u2026
                </>
              ) : (
                <>
                  <ShieldOff aria-hidden="true" className="h-4 w-4" />
                  Confirmer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

function BannedUserCard({
  user,
  formatDate,
  getRemainingTime,
  onUnban,
}: {
  user: NonNullable<ReturnType<typeof useQuery<typeof api.bans.getAllBannedUsers>>>[number]
  formatDate: (ts: number) => string
  getRemainingTime: (ts: number) => string
  onUnban: () => void
}) {
  const config = banTypeConfig[user.banType as keyof typeof banTypeConfig]
  const TypeIcon = config?.icon || Clock

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                  <AvatarImage src={user.image} />
                  <AvatarFallback className="bg-muted text-sm font-medium">
                    {user.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                {/* Status dot */}
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
                    config?.dotColor || "bg-red-500"
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{user.name}</p>
                  <Badge variant="outline" className={cn("shrink-0", config?.className)}>
                    <TypeIcon aria-hidden="true" className="mr-1 h-3 w-3" />
                    {config?.label}
                  </Badge>
                </div>
                {user.username && (
                  <p className="truncate text-sm text-muted-foreground">
                    @{user.username}
                  </p>
                )}
              </div>
            </div>

            {/* Ban Details */}
            <div className="flex flex-col gap-1 text-sm sm:items-end">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Banni le {formatDate(user.bannedAt || 0)}</span>
              </div>
              {user.banType === "temporary" && user.banExpiresAt && (
                <div className="flex items-center gap-1.5 text-amber-600">
                  <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>{getRemainingTime(user.banExpiresAt)}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Par {user.bannedByName}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className="mt-3 rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Raison
            </p>
            <p className="mt-1 text-sm">{user.banReason}</p>
          </div>

          {/* Action */}
          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onUnban}
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
            >
              <ShieldOff aria-hidden="true" className="h-3.5 w-3.5" />
              Lever le ban
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function HistoryCard({
  entry,
  formatDateTime,
}: {
  entry: NonNullable<ReturnType<typeof useQuery<typeof api.bans.getBanHistory>>>[number]
  formatDateTime: (ts: number) => string
}) {
  const config = banTypeConfig[entry.banType as keyof typeof banTypeConfig]

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      <Card className="overflow-hidden opacity-75 transition-opacity hover:opacity-100">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={entry.userImage} />
                <AvatarFallback className="bg-muted text-xs">
                  {entry.userName?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{entry.userName}</p>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", config?.className)}
                  >
                    {config?.label}
                  </Badge>
                </div>
                {entry.username && (
                  <p className="text-sm text-muted-foreground">
                    @{entry.username}
                  </p>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-1 text-sm sm:text-right">
              <div className="flex items-center gap-1.5 text-muted-foreground sm:justify-end">
                <UserX aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Banni: {formatDateTime(entry.bannedAt)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 sm:justify-end">
                <User aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Levé: {formatDateTime(entry.liftedAt)}</span>
              </div>
            </div>
          </div>

          {/* Reason & Admins */}
          <div className="mt-3 flex flex-col gap-2 rounded-lg bg-muted/30 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <span className="text-muted-foreground">Raison: </span>
              <span>{entry.reason}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Banni par {entry.bannedByName} • Levé par {entry.liftedByName}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
        <Icon aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-medium">{title}</h3>
      <p className="text-center text-sm text-muted-foreground">{description}</p>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="mt-3 h-16 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
