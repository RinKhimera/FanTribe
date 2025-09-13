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

const SubscriptionsPage = () => {
  const pathname = usePathname()
  const { isAuthenticated } = useConvexAuth()
  const [filter, setFilter] = useState("all")

  const subsStats = useQuery(
    api.subscriptions.getMyContentAccessSubscriptionsStats,
    isAuthenticated ? {} : "skip",
  )
  const subscriptions = subsStats?.subscriptions || []

  const tabs = [
    { label: "Abonnements", path: "/user-lists/subscriptions" },
    { label: "Fans", path: "/user-lists/subscribers" },
    { label: "Bloqués", path: "/user-lists/blocked" },
  ]

  const handleFilterChange = (value: string) => {
    setFilter(value)
  }

  // Filtrer les utilisateurs selon le statut
  const getFilteredUsers = () => {
    if (!subsStats) return []
    switch (filter) {
      case "all":
        return subscriptions
      case "active":
        return subscriptions.filter((s: any) => s.status === "active")
      case "expired":
        return subscriptions.filter((s: any) => s.status === "expired")
      default:
        return []
    }
  }

  const renderContent = () => {
    // Si les données sont en cours de chargement
    if (subsStats === undefined) {
      return (
        <div className="flex justify-center p-8">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      )
    }

    const filteredUsers = getFilteredUsers()

    if (filteredUsers.length === 0) {
      return (
        <div className="border-muted rounded-lg border p-4">
          <p className="text-muted-foreground text-center">
            Aucun abonnement à afficher
          </p>
        </div>
      )
    }

    return (
      <div className="@container">
        <div className="grid gap-3 @lg:grid-cols-2">
          {filteredUsers.map((sub: any) => {
            const details = sub.creatorUser
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
                isSubscribed={sub.status === "active"}
                onSubscribe={() =>
                  console.log(`Toggle subscription for ${details.username}`)
                }
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
                className="data-[state=active]:bg-primary/60 data-[state=active]:text-primary-foreground flex-1"
              >
                <Link href={tab.path}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Select defaultValue="all" onValueChange={handleFilterChange}>
          <SelectTrigger className="mb-4 w-full">
            <SelectValue placeholder="Filtrer les abonnements" />
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

export default SubscriptionsPage
