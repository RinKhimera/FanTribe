"use client"

import { useMemo } from "react"
import { NavigationTabs, SecondaryBar } from "@/components/layout"

type UserProfileTabsProps = {
  username: string
}

export const UserProfileTabs = ({ username }: UserProfileTabsProps) => {
  const navItems = useMemo(
    () => [
      { href: `/${username}`, label: "Publications" },
      { href: `/${username}/gallery`, label: "Médias" },
    ],
    [username],
  )

  return (
    <SecondaryBar topOffset="53px">
      <NavigationTabs items={navItems} variant="grid" />
    </SecondaryBar>
  )
}
