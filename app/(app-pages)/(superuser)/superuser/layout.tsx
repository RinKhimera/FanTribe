"use client"

import { useQuery } from "convex/react"
import {
  AlertTriangle,
  Ban,
  LayoutDashboard,
  Loader2,
  Receipt,
  UserPlus,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import { NavigationTabs, PageContainer } from "@/components/layout"
import { SuperuserSearch } from "@/components/superuser"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export default function SuperuserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentUser, isLoading } = useCurrentUser()
  const router = useRouter()

  // Real-time counts for notification badges
  const counts = useQuery(
    api.superuser.getSuperuserCounts,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )
  const pendingApplications = counts?.pendingApplications ?? 0
  const pendingReports = counts?.pendingReports ?? 0

  // Redirect non-superusers to home
  useEffect(() => {
    if (!isLoading && currentUser && currentUser.accountType !== "SUPERUSER") {
      router.push("/")
    }
  }, [currentUser, isLoading, router])

  // Build navigation items with dynamic badges
  const navItems = useMemo(() => [
    {
      href: "/superuser",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/superuser/creator-applications",
      label: "Candidatures",
      icon: UserPlus,
      badge: pendingApplications,
    },
    {
      href: "/superuser/reports",
      label: "Signalements",
      icon: AlertTriangle,
      badge: pendingReports,
    },
    {
      href: "/superuser/bans",
      label: "Bans",
      icon: Ban,
    },
    {
      href: "/superuser/transactions",
      label: "Transactions",
      icon: Receipt,
    },
  ], [pendingApplications, pendingReports])

  // État de chargement
  if (isLoading || currentUser === undefined) {
    return (
      <PageContainer hideHeader contentClassName="items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground text-lg">
            Vérification des permissions...
          </p>
        </div>
      </PageContainer>
    )
  }

  // Redirection en cours pour les utilisateurs non autorisés
  if (!currentUser || currentUser.accountType !== "SUPERUSER") {
    return (
      <PageContainer hideHeader contentClassName="items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground text-lg">
            Redirection en cours...
          </p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      headerContent={
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-primary text-xs font-bold tracking-tight">
              SU
            </span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight sm:text-lg">
              Administration
            </h1>
            <p className="text-muted-foreground hidden text-xs sm:block">
              Panel de gestion
            </p>
          </div>
        </div>
      }
      headerRightAction={<SuperuserSearch />}
      secondaryBar={<NavigationTabs items={navItems} variant="underline" />}
    >
      <main className="flex-1 overflow-y-auto max-lg:pb-16">{children}</main>
    </PageContainer>
  )
}
