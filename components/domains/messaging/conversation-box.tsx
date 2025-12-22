"use client"

import { ImageIcon, Users, VideoIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { formatDate } from "@/lib/formatters"
import { MessageSeenSvg } from "@/lib/svgs"
import { ConversationProps } from "@/types"

export const ConversationBox = ({
  conversation,
}: {
  conversation: ConversationProps
}) => {
  const params = useParams()
  const router = useRouter()

  const conversationImage = conversation?.groupImage || conversation?.image
  const conversationName = conversation?.groupName || conversation?.name
  const lastMessage = conversation?.lastMessage
  const lastMessageType = lastMessage?.messageType
  const hasUnreadMessages = conversation?.hasUnreadMessages
  const unreadCount = conversation?.unreadCount || 0

  const { currentUser } = useCurrentUser()

  return (
    <>
      <div
        onClick={() => router.push(`/messages/${conversation?._id}`)}
        className={`flex cursor-pointer items-center gap-2 border-b p-3 transition ${hasUnreadMessages ? "bg-blue-900/10 font-semibold" : "hover:bg-muted/60"} ${conversation?._id === params.id ? "bg-muted" : ""}`}
      >
        <Avatar className="relative overflow-visible border border-gray-900">
          {conversation?.isOnline && (
            <div className="border-foreground absolute top-0 right-0 h-2.5 w-2.5 rounded-full border-2 bg-green-500" />
          )}
          <AvatarImage
            src={conversationImage}
            className="rounded-full object-cover"
          />
          <AvatarFallback>
            <div className="h-full w-full animate-pulse rounded-full"></div>
          </AvatarFallback>
        </Avatar>

        <div className="w-full">
          <div className="flex items-center">
            <h3
              className={`text-sm lg:text-sm ${hasUnreadMessages ? "font-bold" : "font-medium"}`}
            >
              {conversationName}
            </h3>

            {/* Badge pour le nombre de messages non lus */}
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 flex h-5 w-5 items-center justify-center rounded-full p-0"
              >
                {unreadCount}
              </Badge>
            )}

            <span className="text-muted-foreground ml-auto text-xs lg:text-sm">
              {lastMessage?._creationTime || conversation?.lastActivityTime
                ? formatDate(
                    lastMessage?._creationTime ||
                      conversation?.lastActivityTime ||
                      0,
                  )
                : ""}
            </span>
          </div>
          <p
            className={`mt-1 flex items-center gap-1 text-sm ${hasUnreadMessages ? "text-foreground font-medium" : "text-muted-foreground"}`}
          >
            {lastMessage?.sender === currentUser?._id ? <MessageSeenSvg /> : ""}
            {conversation?.isGroup && <Users size={16} />}
            {!lastMessage && "Démarrer une conversation"}
            {lastMessageType === "text" ? (
              (lastMessage?.content as string)?.length > 30 ? (
                <span className="text-sm">
                  {(lastMessage?.content as string)?.slice(0, 30)}...
                </span>
              ) : (
                <span className="text-sm">{lastMessage?.content}</span>
              )
            ) : null}
            {lastMessageType === "image" && <ImageIcon size={16} />}
            {lastMessageType === "video" && <VideoIcon size={16} />}
          </p>
        </div>
      </div>
    </>
  )
}
