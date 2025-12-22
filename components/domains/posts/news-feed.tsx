"use client"

import { usePaginatedQuery } from "convex/react"
import { Loader2 } from "lucide-react"
import { useEffect, useRef } from "react"
import { PostCard } from "@/components/shared/post-card"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"

const INITIAL_ITEMS = 20
const LOAD_MORE_ITEMS = 10

type PostWithAuthor = Doc<"posts"> & {
  author: Doc<"users"> | null | undefined
}

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
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4 text-sm">
          Chargement du fil d&apos;actualité...
        </p>
      </div>
    )
  }

  // Premier chargement
  if (status === "LoadingFirstPage") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4 text-sm">
          Chargement des publications...
        </p>
      </div>
    )
  }

  // Aucun post disponible
  if (results.length === 0 && status === "Exhausted") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground text-lg font-medium">
          Aucune publication disponible
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Suivez des créateurs pour voir leurs publications ici
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {(results as PostWithAuthor[]).map((post) => (
        <PostCard post={post} currentUser={currentUser} key={post._id} />
      ))}

      {/* Élément déclencheur pour le chargement infini */}
      {status === "CanLoadMore" && (
        <div
          ref={loadMoreRef}
          className="flex flex-col items-center justify-center py-8"
        >
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
          <p className="text-muted-foreground mt-2 text-sm">
            Chargement de plus de publications...
          </p>
        </div>
      )}

      {/* Chargement en cours */}
      {status === "LoadingMore" && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
          <p className="text-muted-foreground mt-2 text-sm">
            Chargement de plus de publications...
          </p>
        </div>
      )}

      {/* Message de fin */}
      {status === "Exhausted" && results.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">
            Vous avez tout vu ! 🎉
          </p>
        </div>
      )}
    </div>
  )
}
