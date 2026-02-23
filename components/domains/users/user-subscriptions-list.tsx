"use client"

import { usePaginatedQuery } from "convex/react"
import { Loader2, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

const INITIAL_ITEMS = 20
const LOAD_MORE_ITEMS = 10

export const UserSubscriptionsList = ({
  userId,
}: {
  userId: Id<"users">
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const { results, status, loadMore } = usePaginatedQuery(
    api.subscriptions.getPublicSubscriptionsPaginated,
    { userId },
    { initialNumItems: INITIAL_ITEMS },
  )

  // Intersection Observer pour le scroll infini
  useEffect(() => {
    if (!loadMoreRef.current || status !== "CanLoadMore") return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0]
        if (firstEntry.isIntersecting && status === "CanLoadMore") {
          loadMore(LOAD_MORE_ITEMS)
        }
      },
      {
        threshold: 0.5,
        rootMargin: "200px",
      },
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [status, loadMore])

  // Premier chargement
  if (status === "LoadingFirstPage") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4 text-sm">
          Chargement…
        </p>
      </div>
    )
  }

  // Aucun abonnement
  if (results.length === 0 && status === "Exhausted") {
    return (
      <div className="mt-16 flex h-full flex-col items-center px-4 text-center">
        <Users className="text-muted-foreground/50 mb-4 size-12" />
        <p className="text-muted-foreground text-xl">
          Aucun abonnement pour le moment
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-border/50">
      {results.map((sub) => (
        <Link
          key={sub._id}
          href={`/${sub.creator.username}`}
          className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50"
        >
          <div className="relative">
            <Avatar className="size-12">
              <AvatarImage
                src={sub.creator.image}
                alt={sub.creator.name}
              />
              <AvatarFallback className="bg-muted">
                {sub.creator.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {sub.creator.isOnline && (
              <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-green-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{sub.creator.name}</p>
            <p className="text-muted-foreground truncate text-sm">
              @{sub.creator.username}
            </p>
          </div>
        </Link>
      ))}

      {/* Élément déclencheur pour le chargement infini */}
      {status === "CanLoadMore" && (
        <div
          ref={loadMoreRef}
          className="flex flex-col items-center justify-center py-8"
        >
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
          <p className="text-muted-foreground mt-2 text-sm">
            Chargement…
          </p>
        </div>
      )}

      {/* Chargement en cours */}
      {status === "LoadingMore" && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
          <p className="text-muted-foreground mt-2 text-sm">
            Chargement…
          </p>
        </div>
      )}

      {/* Message de fin */}
      {status === "Exhausted" && results.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">
            Vous avez tout vu !
          </p>
        </div>
      )}
    </div>
  )
}
