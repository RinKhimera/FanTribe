"use client"

import { Preloaded, usePreloadedQuery } from "convex/react"
import { Bell, Lock, Settings, User } from "lucide-react"
import { PageContainer } from "@/components/layout"
import { NavigationTabs } from "@/components/layout/navigation-tabs"
import { api } from "@/convex/_generated/api"

type AccountShellProps = {
  preloadedUser: Preloaded<typeof api.users.getCurrentUser>
  children: React.ReactNode
}

export const AccountShell = ({
  preloadedUser,
  children,
}: AccountShellProps) => {
  const currentUser = usePreloadedQuery(preloadedUser)

  if (!currentUser) return null

  const navItems = [
    { href: "/account", label: "Profil & Identité", icon: User },
    { href: "/account/preferences", label: "Préférences", icon: Settings },
    { href: "/account/notifications", label: "Notifications", icon: Bell },
    { href: "/account/security", label: "Sécurité", icon: Lock },
  ]

  return (
    <PageContainer
      title="Paramètres"
      secondaryBar={<NavigationTabs items={navItems} variant="underline" />}
    >
      {children}
    </PageContainer>
  )
}
