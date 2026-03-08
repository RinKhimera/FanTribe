"use client"

import { usePaginatedQuery } from "convex/react"
import { Loader2, Sparkles } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useRef } from "react"
import { PostCard } from "@/components/shared/post-card"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import {
  premiumFeedContainerVariants,
  premiumFeedItemVariants,
} from "@/lib/animations"
import { cn } from "@/lib/utils"

const INITIAL_ITEMS = 20
const LOAD_MORE_ITEMS = 10

type PostWithAuthor = Doc<"posts"> & {
  author: Doc<"users"> | null | undefined
}

// Loader component - defined outside to avoid recreation on each render
const PremiumLoader = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="relative">
      <div
        className={cn(
          "relative flex size-14 items-center justify-center rounded-full",
          "bg-primary",
        )}
      >
        <Loader2 className="text-primary-foreground h-6 w-6 animate-spin" />
      </div>
    </div>
    <p className="text-muted-foreground mt-5 text-sm font-medium">{message}</p>
  </div>
)

/**
 * NewsFeed optimisé avec usePaginatedQuery
 * Utilise le scroll infini avec IntersectionObserver
 */
export const NewsFeed = ({
  currentUser,
}: {
  currentUser: Doc<"users"> | undefined
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const { results, status, loadMore } = usePaginatedQuery(
    api.posts.getHomePostsPaginated,
    currentUser ? {} : "skip",
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
    return <PremiumLoader message="Chargement du fil d'actualité…" />
  }

  // Premier chargement
  if (status === "LoadingFirstPage") {
    return <PremiumLoader message="Chargement des publications…" />
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
            <Sparkles className="text-primary-foreground size-7" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-semibold">
            Aucune publication
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Suivez des créateurs pour découvrir leurs contenus exclusifs
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      data-testid="news-feed"
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

      {/* Élément déclencheur pour le chargement infini */}
      {status === "CanLoadMore" && (
        <div
          ref={loadMoreRef}
          className="flex flex-col items-center justify-center py-10"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="text-primary h-5 w-5 animate-spin" />
            <p className="text-muted-foreground text-sm">Chargement…</p>
          </div>
        </div>
      )}

      {/* Chargement en cours */}
      {status === "LoadingMore" && (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="flex items-center gap-3">
            <Loader2 className="text-primary h-5 w-5 animate-spin" />
            <p className="text-muted-foreground text-sm">
              Chargement de plus de publications…
            </p>
          </div>
        </div>
      )}

      {/* Message de fin */}
      {status === "Exhausted" && results.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-border mb-4 h-px w-24" />
          <p className="text-muted-foreground/70 flex items-center gap-2 text-sm">
            <Sparkles className="text-primary size-4" />
            <span>Vous avez tout vu</span>
            <Sparkles className="text-primary size-4" />
          </p>
        </div>
      )}
    </motion.div>
  )
}
