"use client"

import { useQuery } from "convex/react"
import {
  CSSProperties,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { ConversationProps, MessageProps, UserProps } from "@/types"
import { MessageBox } from "./message-box"

type MessagesListProps = {
  conversation: ConversationProps
  currentUser: UserProps
}

export const MessagesList = ({
  conversation,
  currentUser,
}: MessagesListProps) => {
  const [cursor, setCursor] = useState<number | undefined>(undefined)
  const [allMessages, setAllMessages] = useState<MessageProps[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isReadyToShow, setIsReadyToShow] = useState(false)
  const [reachedOldestMessages, setReachedOldestMessages] = useState(false)

  const nextOlderMessagesStartPointRef = useRef<number | undefined>(undefined)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isInitialLoadRef = useRef(true)
  const scrollHeightRef = useRef<number>(0)

  const messagesData = useQuery(api.messages.getMessages, {
    conversation: conversation!._id,
    cursor: cursor,
    limit: 30,
  })

  // Déstructurer pour avoir des dépendances stables
  const messages = messagesData?.messages
  const dataHasMore = messagesData?.hasMore
  const dataCursor = messagesData?.cursor

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
      nextOlderMessagesStartPointRef.current = dataCursor
    },
  )

  const handleOlderMessages = useEffectEvent((olderBatch: MessageProps[]) => {
    setAllMessages((prev) => [...olderBatch, ...prev])

    if (!dataHasMore) {
      setReachedOldestMessages(true)
    }
    setHasMore(!!dataHasMore)
    setIsLoadingMore(false)
    nextOlderMessagesStartPointRef.current = dataCursor
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
              prevAllMessages[i].read !== newAllMessages[i].read
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
    },
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

  // Style du conteneur (mémorisé)
  const containerStyle = useMemo<CSSProperties>(
    () => ({
      visibility: isReadyToShow ? "visible" : "hidden",
      transition: "visibility 0s",
    }),
    [isReadyToShow],
  )

  // Liste des messages (mémorisée pour éviter les re-renders inutiles)
  const messagesList = useMemo(
    () =>
      allMessages.map((message, index) => (
        <div key={message._id}>
          <MessageBox
            currentUser={currentUser}
            conversation={conversation}
            message={message}
            previousMessage={index > 0 ? allMessages[index - 1] : undefined}
          />
        </div>
      )),
    [allMessages, currentUser, conversation],
  )

  return (
    <div
      ref={containerRef}
      className="relative h-full flex-1 overflow-auto pt-3"
      style={containerStyle}
    >
      <div className="mx-5 flex flex-col gap-3">
        {/* Bouton pour charger plus de messages */}
        {hasMore && !isLoadingMore && !reachedOldestMessages && (
          <div className="my-2 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
              className="text-xs"
            >
              {isLoadingMore
                ? "Chargement..."
                : "Charger les messages précédents"}
            </Button>
          </div>
        )}

        {/* Liste des messages */}
        {messagesList}

        {/* Référence pour le scroll */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
