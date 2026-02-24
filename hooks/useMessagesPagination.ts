"use client"

import { useQuery } from "convex/react"
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { MessageProps } from "@/types"

type UseMessagesPaginationOptions = {
  conversationId: Id<"conversations">
  limit?: number
}

type UseMessagesPaginationReturn = {
  messages: MessageProps[]
  hasMore: boolean
  isLoadingMore: boolean
  isReady: boolean
  reachedOldest: boolean
  loadMoreMessages: () => void
  scrollToBottom: () => void
  scrollToBottomInstant: () => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  showScrollToBottom: boolean
}

export function useMessagesPagination({
  conversationId,
  limit = 30,
}: UseMessagesPaginationOptions): UseMessagesPaginationReturn {
  // --- State ---
  const [cursor, setCursor] = useState<number | undefined>(undefined)
  const [allMessages, setAllMessages] = useState<MessageProps[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isReadyToShow, setIsReadyToShow] = useState(false)
  const [reachedOldestMessages, setReachedOldestMessages] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)

  // --- Refs ---
  const nextOlderMessagesStartPointRef = useRef<number | undefined>(undefined)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isInitialLoadRef = useRef(true)
  const scrollHeightRef = useRef<number>(0)

  // --- Query ---
  const messagesData = useQuery(api.messaging.getMessages, {
    conversationId,
    cursor: cursor,
    limit,
  })

  const messages = messagesData?.messages as MessageProps[] | undefined
  const dataHasMore = messagesData?.hasMore
  const dataCursor = messagesData?.nextCursor

  // --- Scroll functions ---
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && !isInitialLoadRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  const scrollToBottomInstant = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" })
    }
  }, [])

  // Gérer le scroll pour afficher/masquer le bouton "scroll to bottom"
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200
    setShowScrollToBottom(!isNearBottom && allMessages.length > 5)
  }, [allMessages.length])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true })
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  // Scroll initial après chargement des messages
  useEffect(() => {
    if (isInitialLoadRef.current && allMessages.length > 0) {
      setTimeout(() => {
        scrollToBottomInstant()
        isInitialLoadRef.current = false
        setIsReadyToShow(true)
      }, 0)
    }
  }, [allMessages, scrollToBottomInstant])

  // --- useEffectEvent handlers ---
  const handleInitialMessages = useEffectEvent(
    (initialMessages: MessageProps[]) => {
      setAllMessages(initialMessages)
      setHasMore(!!dataHasMore)
      nextOlderMessagesStartPointRef.current = dataCursor ?? undefined
    },
  )

  const handleOlderMessages = useEffectEvent((olderBatch: MessageProps[]) => {
    setAllMessages((prev) => [...olderBatch, ...prev])

    if (!dataHasMore) {
      setReachedOldestMessages(true)
    }
    setHasMore(!!dataHasMore)
    setIsLoadingMore(false)
    nextOlderMessagesStartPointRef.current = dataCursor ?? undefined
    setCursor(undefined)
  })

  const handleRealtimeUpdate = useEffectEvent(
    (latestPageFromServer: MessageProps[]) => {
      setAllMessages((prevAllMessages) => {
        const boundaryTimestamp =
          latestPageFromServer.length > 0
            ? latestPageFromServer[0]._creationTime
            : Date.now()

        const strictlyOlderMessages = prevAllMessages.filter(
          (m) => m._creationTime < boundaryTimestamp,
        )

        const newAllMessages = [
          ...strictlyOlderMessages,
          ...latestPageFromServer,
        ]

        if (prevAllMessages.length === newAllMessages.length) {
          let identical = true
          for (let i = 0; i < newAllMessages.length; i++) {
            if (
              prevAllMessages[i]._id !== newAllMessages[i]._id ||
              prevAllMessages[i].isEdited !== newAllMessages[i].isEdited ||
              prevAllMessages[i].isDeleted !== newAllMessages[i].isDeleted ||
              prevAllMessages[i].reactions?.length !==
                newAllMessages[i].reactions?.length
            ) {
              identical = false
              break
            }
          }
          if (identical) {
            return prevAllMessages
          }
        }

        const shouldScroll =
          newAllMessages.length > prevAllMessages.length ||
          (newAllMessages.length > 0 &&
            prevAllMessages.length > 0 &&
            newAllMessages[newAllMessages.length - 1]._id !==
              prevAllMessages[prevAllMessages.length - 1]._id) ||
          (prevAllMessages.length === 0 && newAllMessages.length > 0)

        if (shouldScroll) {
          setTimeout(() => {
            scrollToBottom()
          }, 50)
        }
        return newAllMessages
      })
      setHasMore(!!dataHasMore)
    },
  )

  // --- Effects ---

  // Effet principal pour gérer les messages (initial + updates)
  useEffect(() => {
    if (!messages) return

    if (isInitialLoadRef.current) {
      handleInitialMessages(messages || [])
    } else if (cursor === undefined) {
      handleRealtimeUpdate(messages || [])
    }
  }, [messages, cursor])

  // Fonction pour charger plus de messages
  const loadMoreMessages = useCallback(() => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)

    if (containerRef.current) {
      scrollHeightRef.current = containerRef.current.scrollHeight
    }

    if (nextOlderMessagesStartPointRef.current !== undefined) {
      setCursor(nextOlderMessagesStartPointRef.current)
    } else {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore])

  // Effet pour gérer le chargement de messages plus anciens
  useEffect(() => {
    if (cursor && messages && !isInitialLoadRef.current) {
      if (isLoadingMore) {
        handleOlderMessages(messages || [])
      }
    }
  }, [messages, cursor, isLoadingMore])

  // Preserve scroll position after loading older messages
  useEffect(() => {
    if (!isLoadingMore && scrollHeightRef.current > 0) {
      if (containerRef.current) {
        const newScrollHeight = containerRef.current.scrollHeight
        const scrollDifference = newScrollHeight - scrollHeightRef.current
        containerRef.current.scrollTop = scrollDifference
      }
      scrollHeightRef.current = 0
    }
  }, [allMessages, isLoadingMore])

  return {
    messages: allMessages,
    hasMore,
    isLoadingMore,
    isReady: isReadyToShow,
    reachedOldest: reachedOldestMessages,
    loadMoreMessages,
    scrollToBottom,
    scrollToBottomInstant,
    messagesEndRef,
    containerRef,
    showScrollToBottom,
  }
}
