"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

export type FilterValue = string | string[] | null

export interface SuperuserFilters {
  [key: string]: FilterValue
}

/**
 * Hook for managing URL-based filters in superuser pages
 * Filters persist across navigation and can be shared via URL
 */
export function useSuperuserFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get all current filters as an object
  const filters = useMemo(() => {
    const result: SuperuserFilters = {}
    searchParams.forEach((value, key) => {
      const existing = result[key]
      if (existing) {
        // Handle multiple values for same key
        if (Array.isArray(existing)) {
          existing.push(value)
        } else {
          result[key] = [existing, value]
        }
      } else {
        result[key] = value
      }
    })
    return result
  }, [searchParams])

  // Get a single filter value
  const getFilter = useCallback(
    (key: string): string | null => {
      return searchParams.get(key)
    },
    [searchParams],
  )

  // Get multiple filter values (for multi-select filters)
  const getFilterAll = useCallback(
    (key: string): string[] => {
      return searchParams.getAll(key)
    },
    [searchParams],
  )

  // Set a single filter value
  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }

      const queryString = params.toString()
      router.push(queryString ? `${pathname}?${queryString}` : pathname)
    },
    [router, pathname, searchParams],
  )

  // Set multiple filters at once
  const setFilters = useCallback(
    (newFilters: SuperuserFilters) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(newFilters).forEach(([key, value]) => {
        params.delete(key) // Clear existing values for this key

        if (value === null || value === "") {
          // Already deleted
        } else if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v))
        } else {
          params.set(key, value)
        }
      })

      const queryString = params.toString()
      router.push(queryString ? `${pathname}?${queryString}` : pathname)
    },
    [router, pathname, searchParams],
  )

  // Toggle a value in a multi-select filter
  const toggleFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const currentValues = params.getAll(key)

      if (currentValues.includes(value)) {
        // Remove the value
        params.delete(key)
        currentValues
          .filter((v) => v !== value)
          .forEach((v) => params.append(key, v))
      } else {
        // Add the value
        params.append(key, value)
      }

      const queryString = params.toString()
      router.push(queryString ? `${pathname}?${queryString}` : pathname)
    },
    [router, pathname, searchParams],
  )

  // Clear all filters
  const clearFilters = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchParams.toString().length > 0
  }, [searchParams])

  // Get count of active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    searchParams.forEach(() => count++)
    return count
  }, [searchParams])

  return {
    filters,
    getFilter,
    getFilterAll,
    setFilter,
    setFilters,
    toggleFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  }
}
