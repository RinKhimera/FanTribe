"use client"

import { api } from "@/convex/_generated/api"
import { useConvexAuth, useQuery } from "convex/react"
import { ConversationBox } from "./conversation-box"

export const ConversationsList = () => {
  const { isAuthenticated } = useConvexAuth()

  const conversations = useQuery(
    api.conversations.getMyConversations,
    isAuthenticated ? undefined : "skip",
  )

  return (
    <div className="mb-3 flex max-h-[80%] flex-col gap-0 overflow-auto">
      {conversations?.map((conversation) => (
        <ConversationBox key={conversation._id} conversation={conversation} />
      ))}
      {conversations?.length === 0 && (
        <>
          <p className="mt-3 px-3 text-center text-lg text-muted-foreground">
            C&apos;est vide ici..
          </p>
          <p className="mt-3 px-3 text-center text-lg text-muted-foreground">
            Nous comprenons que vous êtes introverti, mais vous devez commencer
            quelque part 😊
          </p>
        </>
      )}
    </div>
  )
}
