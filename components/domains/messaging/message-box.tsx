"use client"

import { CheckCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import ReactPlayer from "react-player"
import { FullscreenImageViewer } from "@/components/shared/fullscreen-image-viewer"
import { ConversationProps, MessageProps, UserProps } from "@/types"
import { ChatBubbleAvatar } from "./chat-bubble-avatar"
import { DateIndicator } from "./date-indicator"

type MessageBoxProps = {
  conversation: ConversationProps
  currentUser: UserProps
  message: MessageProps
  previousMessage?: MessageProps
}

export const MessageBox = ({
  currentUser,
  conversation,
  message,
  previousMessage,
}: MessageBoxProps) => {
  const [open, setOpen] = useState(false)

  const renderMessageContent = () => {
    switch (message.messageType) {
      case "text":
        return <TextMessage message={message} />
      case "image":
        return (
          <ImageMessage message={message} handleClick={() => setOpen(true)} />
        )
      case "video":
        return <VideoMessage message={message} />
      default:
        return null
    }
  }

  const date = new Date(message._creationTime)
  const hour = date.getHours().toString().padStart(2, "0")
  const minute = date.getMinutes().toString().padStart(2, "0")
  const time = `${hour}:${minute}`

  const isMember = message.sender
    ? conversation!.participants.includes(message.sender._id)
    : false
  const isGroup = conversation?.isGroup
  const isFromCurrentUser = message.sender?._id === currentUser?._id

  if (!isFromCurrentUser) {
    return (
      <>
        <DateIndicator message={message} previousMessage={previousMessage} />
        <div className="flex w-2/3 gap-1">
          <ChatBubbleAvatar
            message={message}
            isMember={isMember}
            isGroup={isGroup}
          />
          <div className="bg-accent relative z-20 flex max-w-fit flex-col rounded-3xl rounded-bl-md px-4 py-2 shadow-md">
            {renderMessageContent()}
            <MessageTime time={time} isFromCurrentUser={isFromCurrentUser} />
          </div>
        </div>
        {message.messageType === "image" && (
          <FullscreenImageViewer
            medias={[message.content]}
            index={0}
            open={open}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <DateIndicator message={message} previousMessage={previousMessage} />
      <div className="ml-auto flex w-2/3 gap-1">
        <div className="bg-muted relative z-20 ml-auto flex max-w-fit flex-col rounded-3xl rounded-br-md px-4 py-1.5 shadow-md">
          {renderMessageContent()}
          <MessageTime
            time={time}
            isFromCurrentUser={isFromCurrentUser}
            isRead={message.read}
          />
        </div>
      </div>
      {message.messageType === "image" && (
        <FullscreenImageViewer
          medias={[message.content]}
          index={0}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

const TextMessage = ({ message }: { message: MessageProps }) => {
  const isLink = /^(ftp|http|https):\/\/[^ "]+$/.test(message.content)

  return (
    <div>
      {isLink ? (
        <Link
          href={message.content}
          target="_blank"
          rel="noopener noreferrer"
          className={`mr-2 text-blue-400 underline`}
        >
          {message.content}
        </Link>
      ) : (
        <p className={`mr-2`}>{message.content}</p>
      )}
    </div>
  )
}

const ImageMessage = ({
  message,
  handleClick,
}: {
  message: MessageProps
  handleClick: () => void
}) => {
  return (
    <div className="relative m-2">
      <Image
        src={message.content}
        className="cursor-pointer rounded object-cover"
        alt="image"
        width={500}
        height={500}
        onClick={handleClick}
      />
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const VideoMessage = ({ message }: { message: MessageProps }) => {
  return (
    <ReactPlayer
      // url={message.content}
      width="250px"
      height="250px"
      controls={true}
      // light={true}
    />
  )
}

const MessageTime = ({
  time,
  isFromCurrentUser,
  isRead = false,
}: {
  time: string
  isFromCurrentUser: boolean
  isRead?: boolean
}) => {
  return (
    <div className="mt-1 flex items-center gap-1 self-end text-[12px]">
      <span>{time}</span>
      {isFromCurrentUser && (
        <CheckCheck
          size={14}
          className={isRead ? "text-blue-500" : "text-gray-400"}
          strokeWidth={2}
        />
      )}
    </div>
  )
}
