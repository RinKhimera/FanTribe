"use client"

import { useQuery } from "convex/react"
import { SubscriptionDialog } from "@/components/profile/subscription-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"

type SubscriptionSidebarProps = {
  currentUserId: Id<"users"> | undefined | null
  userProfile: Doc<"users">
}

export const SubscriptionSidebar = ({
  userProfile,
  currentUserId,
}: SubscriptionSidebarProps) => {
  const subscriptionStatus = useQuery(api.subscriptions.getFollowSubscription, {
    creatorId: userProfile._id,
    subscriberId: currentUserId!,
  })
  return (
    <div className="mt-4">
      <Card className="w-full bg-transparent">
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
          <CardDescription>
            Abonnez-vous pour accéder à ses contenus exclusifs
          </CardDescription>
        </CardHeader>
        <CardContent className="-mt-6">
          {subscriptionStatus ? (
            (() => {
              switch (subscriptionStatus.status) {
                case "expired":
                  return (
                    <SubscriptionDialog
                      userProfile={userProfile}
                      type="renew"
                    />
                  )
                case "canceled":
                  return (
                    <SubscriptionDialog
                      userProfile={userProfile}
                      type="subscribe"
                    />
                  )
                case "active":
                  return (
                    <SubscriptionDialog
                      userProfile={userProfile}
                      type="unsubscribe"
                    />
                  )
                default:
                  return (
                    <SubscriptionDialog
                      userProfile={userProfile}
                      type="subscribe"
                    />
                  )
              }
            })()
          ) : (
            <SubscriptionDialog userProfile={userProfile} type="subscribe" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
