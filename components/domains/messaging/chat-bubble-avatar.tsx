import Image from "next/image"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageProps } from "@/types"

type ChatBubbleAvatarProps = {
  message: MessageProps
}

export const ChatBubbleAvatar = ({ message }: ChatBubbleAvatarProps) => {
  if (!message.sender) return null

  return (
    <Avatar className="relative h-8 w-8 overflow-visible">
      <Image
        src={message.sender.image}
        width={32}
        height={32}
        alt={message.sender.name || "Profile image"}
        className="rounded-full object-cover"
      />
      <AvatarFallback className="h-8 w-8">
        <div className="h-full w-full animate-pulse rounded-full bg-muted" />
      </AvatarFallback>
    </Avatar>
  )
}
