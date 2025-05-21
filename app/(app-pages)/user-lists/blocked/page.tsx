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

const BlockedPage = () => {
  const pathname = usePathname()
  const [filter, setFilter] = useState("all")

  // Récupération des utilisateurs bloqués depuis Convex
  const { isAuthenticated } = useConvexAuth()
  const blockedUsers = useQuery(
    api.follows.getCurrentUserBlockedUsers,
    isAuthenticated ? undefined : "skip",
  )

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
    if (!blockedUsers) return []

    // Filtrer d'abord les utilisateurs bloqués qui ont les détails nécessaires
    const validBlockedUsers = blockedUsers.filter(
      (blockedUser) => blockedUser.blockedUserDetails && blockedUser.block,
    )

    switch (filter) {
      case "all":
        return validBlockedUsers
      case "recent":
        // Trie par date de blocage (du plus récent au plus ancien)
        return [...validBlockedUsers].sort(
          (a, b) =>
            new Date(b.block._creationTime).getTime() -
            new Date(a.block._creationTime).getTime(),
        )
      case "alphabetical":
        // Trie par ordre alphabétique du nom
        return [...validBlockedUsers].sort((a, b) =>
          a.blockedUserDetails!.name.localeCompare(b.blockedUserDetails!.name),
        )
      default:
        return validBlockedUsers
    }
  }

  const renderContent = () => {
    // Si les données sont en cours de chargement
    if (blockedUsers === undefined) {
      return (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    const filteredUsers = getFilteredUsers()

    if (filteredUsers.length === 0) {
      return (
        <div className="rounded-lg border border-muted p-4">
          <p className="text-center text-muted-foreground">
            Aucun utilisateur bloqué pour le moment
          </p>
        </div>
      )
    }

    return (
      <div className="@container">
        <div className="@lg:grid-cols-2 grid gap-3">
          {filteredUsers.map((blockedUser) => {
            // Le filtrage précédent garantit que blockedUserDetails n'est pas null ici
            const details = blockedUser.blockedUserDetails!

            return (
              <UserListsCard
                key={blockedUser.block._id}
                user={{
                  id: details._id,
                  name: details.name,
                  username: details.username || "",
                  avatarUrl: details.image,
                  bannerUrl: details.imageBanner || "",
                }}
                isBlockedPage={true}
                onSubscribe={() => {
                  // Appeler la mutation de déblocage AVANT de la faire
                  console.log(`Débloquer ${details.username}`)
                }}
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
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Link href={tab.path}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Select defaultValue="all" onValueChange={handleFilterChange}>
          <SelectTrigger className="mb-4 w-full">
            <SelectValue placeholder="Filtrer les utilisateurs bloqués" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Tout</SelectItem>
              <SelectItem value="recent">Les plus récents</SelectItem>
              <SelectItem value="alphabetical">Ordre alphabétique</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {renderContent()}
      </div>
    </div>
  )
}

export default BlockedPage
