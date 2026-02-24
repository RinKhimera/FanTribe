import { useEffect, useEffectEvent, useRef } from "react"

type PaginationStatus =
  | "LoadingFirstPage"
  | "CanLoadMore"
  | "LoadingMore"
  | "Exhausted"

type UseInfiniteScrollOptions = {
  status: PaginationStatus
  loadMore: (numItems: number) => void
  numItems?: number
  threshold?: number
  rootMargin?: string
}

/**
 * Hook réutilisable pour le scroll infini via IntersectionObserver.
 * Retourne un ref à attacher à un élément sentinelle en bas de la liste.
 */
export function useInfiniteScroll({
  status,
  loadMore,
  numItems = 10,
  threshold = 0.4,
  rootMargin = "200px",
}: UseInfiniteScrollOptions) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Stable callback that always reads latest loadMore without recreating the observer
  const handleLoadMore = useEffectEvent(() => {
    loadMore(numItems)
  })

  useEffect(() => {
    if (!loadMoreRef.current || status !== "CanLoadMore") return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore()
        }
      },
      { threshold, rootMargin },
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [status, numItems, threshold, rootMargin])

  return { loadMoreRef }
}
