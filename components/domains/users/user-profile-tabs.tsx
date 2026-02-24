"use client"

import { useMemo } from "react"
import { NavigationTabs, SecondaryBar } from "@/components/layout"

type UserProfileTabsProps = {
  username: string
  accountType: "USER" | "CREATOR" | "SUPERUSER"
}

export const UserProfileTabs = ({ username, accountType }: UserProfileTabsProps) => {
  const isCreator = accountType === "CREATOR" || accountType === "SUPERUSER"

  const navItems = useMemo(
    () =>
      isCreator
        ? [
            { href: `/${username}`, label: "Publications" },
            { href: `/${username}/gallery`, label: "Médias" },
          ]
        : [
            { href: `/${username}`, label: "J'aime" },
            { href: `/${username}/subscriptions`, label: "Abonnements" },
          ],
    [username, isCreator],
  )

  return (
    <SecondaryBar topOffset="53px">
      <NavigationTabs items={navItems} variant="grid" />
    </SecondaryBar>
  )
}
