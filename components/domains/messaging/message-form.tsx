"use client"

import { useMutation } from "convex/react"
import EmojiPicker, { Theme } from "emoji-picker-react"
import { Mic, Send, Smile } from "lucide-react"
import { useParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config/logger"
import { ConversationProps, UserProps } from "@/types"
import { MediaPopover } from "./media-popover"

type MessageFormProps = {
  conversation: ConversationProps
  currentUser: UserProps
}

export const MessageForm = ({
  currentUser,
  conversation,
}: MessageFormProps) => {
  const params = useParams()

  const [msgText, setMsgText] = useState("")

  const sendTextMessage = useMutation(api.messages.sendTextMessage)

  const handleSendTextMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!currentUser?._id) return

    try {
      await sendTextMessage({
        content: msgText,
        conversation: params.id as Id<"conversations">,
        sender: currentUser._id,
      })

      setMsgText("")
    } catch (error) {
      logger.error("Failed to send message", error, {
        conversationId: params.id,
      })
      toast.error("Une erreur s'est produite !", {
        description:
          "Votre message n'a pas été envoyé. Veuillez vérifier votre connexion internet et réessayer",
      })
    }
  }

  return (
    <div className="sticky bottom-0 z-10 w-full">
      <div className="bg-muted/60 flex items-center gap-4 p-2">
        <div className="relative ml-2 flex gap-2">
          {/* Emoji Picker */}
          <Popover>
            <PopoverTrigger>
              <Smile className="text-muted-foreground transition hover:text-white" />
            </PopoverTrigger>
            <PopoverContent
              className="w-auto"
              sideOffset={20}
              alignOffset={-17}
              align="start"
            >
              <EmojiPicker
                theme={Theme.AUTO}
                onEmojiClick={(emojiObject) => {
                  setMsgText((prev) => prev + emojiObject.emoji)
                }}
              />
            </PopoverContent>
          </Popover>

          {/* Photos & Videos Picker */}
          <MediaPopover conversation={conversation} />
          {/* <Plus className="text-muted-foreground" /> */}
        </div>
        <form onSubmit={handleSendTextMessage} className="flex w-full gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Ecrivez un message..."
              className="bg-gray-tertiary w-full rounded-lg py-2 text-sm shadow-xs focus-visible:ring-transparent"
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
            />
          </div>
          <div className="mr-4 flex items-center gap-3">
            {msgText.length > 0 ? (
              <Button
                type="submit"
                size={"sm"}
                className="text-foreground bg-transparent hover:bg-transparent"
              >
                <Send />
              </Button>
            ) : (
              <Button
                type="submit"
                size={"sm"}
                className="text-foreground bg-transparent hover:bg-transparent"
              >
                <Mic className="text-muted-foreground transition hover:text-white" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
