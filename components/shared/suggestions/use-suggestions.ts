"use client"

import { useQuery } from "convex/react"
import { useState, useEffect, useCallback } from "react"
import { api } from "@/convex/_generated/api"

export function useSuggestions() {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)

  // Debounce search term (300ms for responsive feel)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

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
    setDebouncedSearchTerm("")
  }, [])

  // Derived states
  const isSearching = debouncedSearchTerm.trim().length > 0
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
