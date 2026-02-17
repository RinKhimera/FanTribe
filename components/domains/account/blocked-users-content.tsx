"use client"

import { useState } from "react"

import { useConvexAuth, useMutation, usePaginatedQuery } from "convex/react"
import { Loader2, Search, Shield, UserX } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
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
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useDebounce, useInfiniteScroll } from "@/hooks"
import { containerVariants, itemVariants } from "@/lib/animations"
import { formatCustomTimeAgo } from "@/lib/formatters"
import { cn } from "@/lib/utils"

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

const INITIAL_ITEMS = 20
const LOAD_MORE_ITEMS = 10

export const BlockedUsersContent = () => {
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
        description: `Vous avez débloqué ${entry.user.name}`,
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
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Utilisateurs bloqués</h2>
        <p className="text-muted-foreground text-sm">
          Gérez les utilisateurs que vous avez bloqués
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="pl-9"
          aria-label="Rechercher un utilisateur bloqué"
          spellCheck={false}
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-24 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && blockedUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-muted mb-4 rounded-full p-4">
            <Shield className="text-muted-foreground size-8" />
          </div>
          <p className="font-medium">Aucun utilisateur bloqué</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Vous n&apos;avez bloqué personne pour le moment.
          </p>
        </div>
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

              return (
                <motion.div
                  key={entry.blockId}
                  variants={itemVariants}
                  exit="exit"
                  layout
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3",
                    "transition-colors hover:bg-muted/50",
                  )}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage
                      src={entry.user.image}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-muted text-xs">
                      {entry.user.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {entry.user.name}
                      </span>
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
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                          <UserX className="mr-1.5 size-3.5" />
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
      <div ref={loadMoreRef} className="h-1" />

      {/* Loading more indicator */}
      {status === "LoadingMore" && (
        <div className="flex justify-center py-4">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </div>
      )}
    </div>
  )
}
