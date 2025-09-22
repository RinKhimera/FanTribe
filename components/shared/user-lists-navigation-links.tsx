"use client"

import { useConvexAuth, useQuery } from "convex/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { api } from "@/convex/_generated/api"

export const UserListsNavigationLinks = () => {
  const pathname = usePathname()
  const { isAuthenticated } = useConvexAuth()

  // Récupérer stats souscriptions (abonnements) et abonnés
  const mySubsStats = useQuery(
    api.subscriptions.getMyContentAccessSubscriptionsStats,
    isAuthenticated ? {} : "skip",
  )
  const mySubscribersStats = useQuery(
    api.subscriptions.getMySubscribersStats,
    isAuthenticated ? {} : "skip",
  )

  const subscriptionStats = {
    users: mySubsStats?.creatorsCount || 0,
    posts: mySubsStats?.postsCount || 0,
  }
  const subscriberStats = {
    users: mySubscribersStats?.subscribersCount || 0,
    posts: mySubscribersStats?.postsCount || 0,
  }
  const blockedStats = { users: 0, posts: 0 }

  const navItems = [
    {
      href: "/user-lists/subscriptions",
      label: "Mes abonnements",
      stats: subscriptionStats,
    },
    {
      href: "/user-lists/subscribers",
      label: "Mes fans",
      stats: subscriberStats,
    },
    {
      href: "/user-lists/blocked",
      label: "Bloqués",
      stats: blockedStats,
    },
  ]

  return (
    <nav className="flex flex-col">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`h-16 p-2 transition-colors ${
            pathname === item.href
              ? "border-primary bg-primary/20 text-foreground border-l-4 font-medium"
              : "hover:bg-muted"
          }`}
        >
          <div className="flex h-full w-full items-center justify-between">
            <div className="flex flex-col">
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground text-xs">
                {mySubsStats === undefined || mySubscribersStats === undefined
                  ? "Chargement..."
                  : `${item.stats.users} utilisateur(s) • ${item.stats.posts} posts`}
              </span>
            </div>
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <span className="text-xs">
                {item.label === "Mes abonnements" ? "AB" : "FA"}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </nav>
  )
}
