"use client"

import { useQuery } from "convex/react"
import { Crown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ConversationProps } from "@/types"

export const GroupMembersDialog = ({
  conversation,
}: {
  conversation: ConversationProps
}) => {
  const groupMembers = useQuery(api.conversations.getGroupMembers, {
    conversationId: conversation?._id as Id<"conversations">,
  })

  return (
    <Dialog>
      <DialogTrigger>
        <p className="text-muted-foreground text-left text-xs">
          Voir les membres
        </p>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="my-2">Membres participants</DialogTitle>
          <DialogDescription>
            <div className="flex flex-col gap-3">
              {groupMembers?.map((groupMember) => (
                <div
                  key={groupMember._id}
                  className={`flex items-center gap-3 rounded p-2`}
                >
                  <Avatar className="overflow-visible">
                    {groupMember.isOnline && (
                      <div className="border-foreground absolute top-0 right-0 h-2 w-2 rounded-full border-2 bg-green-500" />
                    )}
                    <AvatarImage
                      src={groupMember.image}
                      className="rounded-full object-cover"
                    />
                    <AvatarFallback>
                      <div className="bg-gray-tertiary h-full w-full animate-pulse rounded-full"></div>
                    </AvatarFallback>
                  </Avatar>

                  <div className="w-full">
                    <div className="flex items-center gap-2">
                      <h3 className="text-md font-medium">
                        {groupMember.name || groupMember.email.split("@")[0]}
                      </h3>
                      {groupMember._id === conversation?.admin && (
                        <Crown size={16} className="text-yellow-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
