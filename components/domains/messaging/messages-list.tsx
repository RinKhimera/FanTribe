"use client"

import { useQuery } from "convex/react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { MessageProps } from "@/types"
import { MessageBox } from "./message-box"

type MessagesListProps = {
  conversationId: Id<"conversations">
  currentUser: Doc<"users"> | null
}

export const MessagesList = ({
  conversationId,
  currentUser,
}: MessagesListProps) => {
  const [cursor, setCursor] = useState<number | undefined>(undefined)
  const [allMessages, setAllMessages] = useState<MessageProps[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isReadyToShow, setIsReadyToShow] = useState(false)
  const [reachedOldestMessages, setReachedOldestMessages] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)

  const nextOlderMessagesStartPointRef = useRef<number | undefined>(undefined)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isInitialLoadRef = useRef(true)
  const scrollHeightRef = useRef<number>(0)

  const messagesData = useQuery(api.messaging.getMessages, {
    conversationId,
    cursor: cursor,
    limit: 30,
  })

  // Déstructurer pour avoir des dépendances stables
  const messages = messagesData?.messages as MessageProps[] | undefined
  const dataHasMore = messagesData?.hasMore
  const dataCursor = messagesData?.nextCursor

  // Fonctions de scroll (mémorisées)
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

  // useEffectEvent pour les mises à jour de state
  const handleInitialMessages = useEffectEvent(
    (initialMessages: MessageProps[]) => {
      setAllMessages(initialMessages)
      setHasMore(!!dataHasMore)
      nextOlderMessagesStartPointRef.current = dataCursor ?? undefined
    }
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

  // useEffectEvent pour la mise à jour des messages en temps réel
  const handleRealtimeUpdate = useEffectEvent(
    (latestPageFromServer: MessageProps[]) => {
      setAllMessages((prevAllMessages) => {
        const boundaryTimestamp =
          latestPageFromServer.length > 0
            ? latestPageFromServer[0]._creationTime
            : Date.now()

        const strictlyOlderMessages = prevAllMessages.filter(
          (m) => m._creationTime < boundaryTimestamp
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

        // Si les messages ont changé, déterminer si un scroll est nécessaire
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
    }
  )

  // Effet principal pour gérer les messages (initial + updates)
  useEffect(() => {
    if (!messages) return

    if (isInitialLoadRef.current) {
      handleInitialMessages(messages || [])
    } else if (cursor === undefined) {
      handleRealtimeUpdate(messages || [])
    }
  }, [messages, cursor])

  // Fonction pour charger plus de messages (mémorisée)
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

  // Effet pour gérer le chargement de messages plus anciens (quand cursor est défini)
  useEffect(() => {
    if (cursor && messages && !isInitialLoadRef.current) {
      if (isLoadingMore) {
        handleOlderMessages(messages || [])
      }
    }
  }, [messages, cursor, isLoadingMore])

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

  const containerStyle = {
    visibility: isReadyToShow ? ("visible" as const) : ("hidden" as const),
    transition: "visibility 0s",
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full flex-1 overflow-auto"
      style={containerStyle}
    >
      <div className="mx-4 flex flex-col gap-2 py-4">
        {/* Bouton pour charger plus de messages */}
        <AnimatePresence>
          {hasMore && !reachedOldestMessages && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-center py-2"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMoreMessages}
                disabled={isLoadingMore}
                className="gap-2 rounded-full border border-white/10 bg-white/5 text-xs hover:bg-white/10"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Chargement…
                  </>
                ) : (
                  <>
                    <ChevronUp size={14} />
                    Messages précédents
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicateur début de conversation */}
        {reachedOldestMessages && allMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2 py-6 text-center"
          >
            <div className="h-px w-16 bg-linear-to-r from-transparent via-amber-500/30 to-transparent" />
            <span className="text-xs text-muted-foreground">
              Début de la conversation
            </span>
          </motion.div>
        )}

        {/* Liste des messages */}
        {allMessages.map((message, index) => (
          <motion.div
            key={message._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MessageBox
              currentUser={currentUser}
              message={message}
              previousMessage={index > 0 ? allMessages[index - 1] : undefined}
            />
          </motion.div>
        ))}

        {/* Référence pour le scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Bouton scroll to bottom */}
      <AnimatePresence>
        {showScrollToBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToBottom}
            aria-label="Défiler vers le bas"
            className="absolute bottom-4 right-4 z-10 flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/80 text-foreground shadow-lg backdrop-blur-sm transition-colors hover:bg-black/90"
          >
            <ChevronDown size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
