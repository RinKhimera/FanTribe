"use client"

import { Preloaded, usePreloadedQuery } from "convex/react"
import { BarChart3, DollarSign, FileText, Users } from "lucide-react"
import { PageContainer } from "@/components/layout"
import { NavigationTabs } from "@/components/layout/navigation-tabs"
import { api } from "@/convex/_generated/api"

type DashboardShellProps = {
  preloadedUser: Preloaded<typeof api.users.getCurrentUser>
  children: React.ReactNode
}

const navItems = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: BarChart3 },
  { href: "/dashboard/revenue", label: "Revenus", icon: DollarSign },
  { href: "/dashboard/content", label: "Contenu", icon: FileText },
  { href: "/dashboard/audience", label: "Abonnés", icon: Users },
]

export const DashboardShell = ({
  preloadedUser,
  children,
}: DashboardShellProps) => {
  const currentUser = usePreloadedQuery(preloadedUser)

  if (!currentUser) return null

  return (
    <PageContainer
      title="Dashboard"
      secondaryBar={
        <NavigationTabs items={navItems} variant="underline" />
      }
    >
      {children}
    </PageContainer>
  )
}
