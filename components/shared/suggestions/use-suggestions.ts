"use client"

import { useQuery } from "convex/react"
import { useState, useCallback } from "react"
import { api } from "@/convex/_generated/api"
import { useDebounce } from "@/hooks/useDebounce"

export function useSuggestions() {
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch suggested creators
  const suggestedCreators = useQuery(api.users.getSuggestedCreators, {
    refreshKey,
  })

  // Search users query (skip when empty)
  const searchResults = useQuery(
    api.users.searchUsers,
    debouncedSearchTerm.trim()
      ? { searchTerm: debouncedSearchTerm.trim() }
      : "skip"
  )

  // Refresh suggestions
  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm("")
  }, [])

  // Derived states — check both to ensure immediate clear behavior
  const isSearching =
    searchTerm.trim().length > 0 && debouncedSearchTerm.trim().length > 0
  const isSearchLoading = isSearching && searchResults === undefined
  const isSuggestionsLoading = suggestedCreators === undefined

  return {
    // State
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,

    // Loading states
    isSearching,
    isSearchLoading,
    isSuggestionsLoading,

    // Data
    suggestedCreators: suggestedCreators || [],
    searchResults: searchResults || [],

    // Actions
    refresh,
    clearSearch,
  }
}
