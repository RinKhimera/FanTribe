"use client"

import { useMutation } from "convex/react"
import { useCallback, useEffect, useRef } from "react"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "./useCurrentUser"

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000 // 2 minutes

/**
 * Hook to manage user presence status.
 * - Sends a heartbeat every 2 minutes to keep the user online
 * - Handles visibility change events (tab hidden/visible)
 * - Handles page unload events (tab/window close)
 */
export const usePresence = () => {
  const { currentUser, isAuthenticated } = useCurrentUser()
  const updateHeartbeat = useMutation(api.users.updatePresenceHeartbeat)
  const setOffline = useMutation(api.users.setUserOffline)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)
  const updateHeartbeatRef = useRef(updateHeartbeat)
  const setOfflineRef = useRef(setOffline)

  // Keep refs up to date
  useEffect(() => {
    updateHeartbeatRef.current = updateHeartbeat
    setOfflineRef.current = setOffline
  }, [updateHeartbeat, setOffline]) // eslint-disable-line @tanstack/query/no-unstable-deps

  // Heartbeat function - only depends on isAuthenticated to avoid re-renders from currentUser changes
  const sendHeartbeat = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      await updateHeartbeatRef.current()
    } catch (error) {
      console.error("Failed to send presence heartbeat:", error)
    }
  }, [isAuthenticated])

  // Set offline function
  const markOffline = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      await setOfflineRef.current()
    } catch (error) {
      console.error("Failed to set user offline:", error)
    }
  }, [isAuthenticated])

  useEffect(() => {
    // Wait for initial user data before starting presence tracking
    if (!isAuthenticated || currentUser === undefined) {
      // Clear interval if user logs out
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      isInitializedRef.current = false
      return
    }

    // Only initialize once per session
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    // Send initial heartbeat immediately
    sendHeartbeat()

    // Set up heartbeat interval (2 minutes)
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // User came back to the tab - send heartbeat
        sendHeartbeat()
      }
    }

    // Handle page unload (tab/window close)
    const handleBeforeUnload = () => {
      markOffline()
    }

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      isInitializedRef.current = false
    }
    // Only depend on isAuthenticated and whether currentUser exists (not its value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUser === undefined, sendHeartbeat, markOffline])

  return {
    sendHeartbeat,
    markOffline,
  }
}
