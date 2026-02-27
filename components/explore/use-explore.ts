"use client"

import { useQuery } from "convex/react"
import { useCallback, useState } from "react"
import { api } from "@/convex/_generated/api"
import { useDebounce } from "@/hooks/useDebounce"

export type ExploreSortMode = "recent" | "trending"

export function useExplore() {
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [sortBy, setSortBy] = useState<ExploreSortMode>("recent")
  const [refreshKey, setRefreshKey] = useState(0)

  // Créateurs suggérés (exclut les déjà suivis)
  const suggestedCreators = useQuery(
    api.users.getSuggestedCreatorsForExplore,
    { refreshKey },
  )

  // Recherche utilisateurs (réutilise searchUsers existant)
  const searchResults = useQuery(
    api.users.searchUsers,
    debouncedSearchTerm.trim().length >= 2
      ? { searchTerm: debouncedSearchTerm.trim() }
      : "skip",
  )

  const refresh = useCallback(() => setRefreshKey((p) => p + 1), [])
  const clearSearch = useCallback(() => setSearchTerm(""), [])

  // Derived states — check both to ensure immediate clear behavior
  const isSearching =
    searchTerm.trim().length >= 2 && debouncedSearchTerm.trim().length >= 2
  const isSearchLoading = isSearching && searchResults === undefined
  const isSuggestionsLoading = suggestedCreators === undefined

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching,
    isSearchLoading,
    isSuggestionsLoading,
    searchResults: searchResults || [],
    suggestedCreators: suggestedCreators || [],
    sortBy,
    setSortBy,
    refresh,
    clearSearch,
  }
}
