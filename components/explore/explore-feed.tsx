"use client"

import { usePaginatedQuery } from "convex/react"
import { motion } from "motion/react"
import { Compass, Loader2 } from "lucide-react"
import { useEffect, useRef } from "react"
import { PostCard } from "@/components/shared/post-card"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import {
  premiumFeedContainerVariants,
  premiumFeedItemVariants,
} from "@/lib/animations"
import { cn } from "@/lib/utils"
import type { ExploreSortMode } from "./use-explore"

const INITIAL_ITEMS = 20
const LOAD_MORE_ITEMS = 10

type PostWithAuthor = Doc<"posts"> & {
  author: Doc<"users"> | null | undefined
}

const PremiumLoader = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div
        className={cn(
          "relative flex size-14 items-center justify-center rounded-full",
          "bg-primary",
        )}
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
      </div>
    </div>
    <p className="mt-5 text-sm font-medium text-muted-foreground">{message}</p>
  </div>
)

interface ExploreFeedProps {
  currentUser: Doc<"users"> | undefined
  sortBy: ExploreSortMode
}

export const ExploreFeed = ({ currentUser, sortBy }: ExploreFeedProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const { results, status, loadMore } = usePaginatedQuery(
    api.posts.getExplorePostsPaginated,
    currentUser ? { sortBy } : "skip",
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
        threshold: 0.4,
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

  // Afficher un loader si currentUser n'est pas encore défini
  if (!currentUser) {
    return <PremiumLoader message="Chargement du fil d'exploration…" />
  }

  // Premier chargement
  if (status === "LoadingFirstPage") {
    return <PremiumLoader message="Découverte des publications…" />
  }

  // Aucun post disponible
  if (results.length === 0 && status === "Exhausted") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="glass-premium max-w-sm rounded-2xl p-8 text-center">
          <div
            className={cn(
              "mx-auto mb-5 flex size-16 items-center justify-center rounded-full",
              "bg-primary",
            )}
          >
            <Compass className="size-7 text-primary-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Aucune publication à explorer
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Revenez bientôt pour découvrir du nouveau contenu
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={premiumFeedContainerVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col"
    >
      {(results as PostWithAuthor[]).map((post, index) => (
        <motion.div
          key={post._id}
          variants={premiumFeedItemVariants}
          custom={index}
        >
          <PostCard post={post} currentUser={currentUser} />
        </motion.div>
      ))}

      {/* Element déclencheur pour le chargement infini */}
      {status === "CanLoadMore" && (
        <div
          ref={loadMoreRef}
          className="flex flex-col items-center justify-center py-10"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </div>
        </div>
      )}

      {/* Chargement en cours */}
      {status === "LoadingMore" && (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Chargement de plus de publications…
            </p>
          </div>
        </div>
      )}

      {/* Message de fin */}
      {status === "Exhausted" && results.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 h-px w-24 bg-border" />
          <p className="flex items-center gap-2 text-sm text-muted-foreground/70">
            <Compass className="size-4 text-primary" />
            <span>Vous avez tout exploré</span>
            <Compass className="size-4 text-primary" />
          </p>
        </div>
      )}
    </motion.div>
  )
}
