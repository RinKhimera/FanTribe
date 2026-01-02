"use client"

import { useCallback, useEffect, useState } from "react"

const BUNNY_ORIGIN = "https://iframe.mediadelivery.net"
const PLAYERJS_CONTEXT = "player.js"
const PLAYERJS_VERSION = "0.0.11"

interface UseBunnyPlayerControlOptions {
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  enabled?: boolean
}

interface UseBunnyPlayerControlResult {
  pause: () => void
  play: () => void
  isReady: boolean
}

export function useBunnyPlayerControl(
  options: UseBunnyPlayerControlOptions
): UseBunnyPlayerControlResult {
  const { iframeRef, enabled = true } = options
  const [isReady, setIsReady] = useState(false)

  // Listen for ready event from Bunny player (Player.js protocol)
  useEffect(() => {
    if (!enabled) return

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== BUNNY_ORIGIN) return

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data

        // Player.js ready event format
        if (data.context === PLAYERJS_CONTEXT && data.event === "ready") {
          setIsReady(true)
        }
      } catch {
        // Ignore non-JSON messages
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [enabled])

  const sendCommand = useCallback(
    (method: string) => {
      if (!iframeRef.current?.contentWindow) return

      // Player.js spec format
      const message = {
        context: PLAYERJS_CONTEXT,
        version: PLAYERJS_VERSION,
        method,
      }

      iframeRef.current.contentWindow.postMessage(
        JSON.stringify(message),
        BUNNY_ORIGIN
      )
    },
    [iframeRef]
  )

  const pause = useCallback(() => sendCommand("pause"), [sendCommand])
  const play = useCallback(() => sendCommand("play"), [sendCommand])

  return { pause, play, isReady }
}
