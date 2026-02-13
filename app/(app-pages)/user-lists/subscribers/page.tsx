"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { UserListsCard } from "@/components/shared/user-lists-card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/convex/_generated/api"

const SubscribersPage = () => {
  const pathname = usePathname()
  const { isAuthenticated } = useConvexAuth()
  const [filter, setFilter] = useState("all")

  // Nouvelle query stats + liste abonnés (subscribers)
  const subsStats = useQuery(
    api.subscriptions.getMySubscribersStats,
    isAuthenticated ? {} : "skip",
  )
  const subscribers = subsStats?.subscribers || []

  const tabs = [
    { label: "Abonnements", path: "/user-lists/subscriptions" },
    { label: "Fans", path: "/user-lists/subscribers" },
    { label: "Bloqués", path: "/user-lists/blocked" },
  ]

  // Filtrer les utilisateurs selon le statut
  const getFilteredUsers = () => {
    if (!subsStats) return []
    switch (filter) {
      case "all":
        return subscribers
      case "active":
        return subscribers.filter((s) => s.status === "active")
      case "expired":
        return subscribers.filter((s) => s.status === "expired")
      default:
        return []
    }
  }

  const renderContent = () => {
    // Si les données sont en cours de chargement
    if (subsStats === undefined) {
      return (
        <div className="flex justify-center p-8">
          <Loader2 className="text-primary h-8 w-8 animate-spin" aria-hidden="true" />
        </div>
      )
    }

    const filteredUsers = getFilteredUsers()

    if (filteredUsers.length === 0) {
      return (
        <div className="border-muted rounded-lg border p-4">
          <p className="text-muted-foreground text-center">
            Aucun abonné pour le moment
          </p>
        </div>
      )
    }

    return (
      <div className="@container">
        <div className="grid gap-3 @lg:grid-cols-2">
          {filteredUsers.map((sub) => {
            const details = sub.subscriberUser
            if (!details) return null
            return (
              <UserListsCard
                key={sub._id}
                user={{
                  id: details._id,
                  name: details.name,
                  username: details.username || "",
                  avatarUrl: details.image,
                  bannerUrl: details.imageBanner || "",
                }}
                mode="subscription-list"
                subscriptionStatus={sub.status === "active" ? "subscribed" : "unsubscribed"}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full justify-center p-4">
      <div className="w-full max-w-4xl">
        <Tabs defaultValue={pathname} className="mb-4 lg:hidden">
          <TabsList className="w-full">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.path}
                value={tab.path}
                asChild
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1"
              >
                <Link href={tab.path}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Select defaultValue="all" onValueChange={setFilter}>
          <SelectTrigger className="mb-4 w-full" aria-label="Filtrer les abonnés">
            <SelectValue placeholder="Filtrer les abonnés" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Tout</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="expired">Expirés</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {renderContent()}
      </div>
    </div>
  )
}

export default SubscribersPage
