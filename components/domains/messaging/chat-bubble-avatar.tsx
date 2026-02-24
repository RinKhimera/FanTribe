import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageProps } from "@/types"

type ChatBubbleAvatarProps = {
  message: MessageProps
}

export const ChatBubbleAvatar = ({ message }: ChatBubbleAvatarProps) => {
  if (!message.sender) return null

  return (
    <Avatar className="relative h-8 w-8 overflow-visible">
      <AvatarImage
        src={message.sender.image}
        sizes="32px"
        alt={message.sender.name || "Profile image"}
      />
      <AvatarFallback className="h-8 w-8">
        <div className="h-full w-full animate-pulse rounded-full bg-muted" />
      </AvatarFallback>
    </Avatar>
  )
}
