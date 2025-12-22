import Image from "next/image"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageProps } from "@/types"

type ChatBubbleAvatarProps = {
  message: MessageProps
  isMember: boolean
  isGroup: boolean | undefined
}

export const ChatBubbleAvatar = ({
  isGroup,
  isMember,
  message,
}: ChatBubbleAvatarProps) => {
  if (!isGroup || !message.sender) return null

  return (
    <Avatar className="relative overflow-visible">
      {message.sender.isOnline && isMember && (
        <div className="border-foreground absolute top-0 right-0 h-2 w-2 rounded-full border-2 bg-green-500" />
      )}
      <Image
        src={message.sender.image}
        width={100}
        height={100}
        alt={message.sender.name || "Profile image"}
        className="size-8 rounded-full object-cover"
      />
      <AvatarFallback className="h-8 w-8">
        <div className="animate-pulse rounded-full bg-gray-500"></div>
      </AvatarFallback>
    </Avatar>
  )
}
