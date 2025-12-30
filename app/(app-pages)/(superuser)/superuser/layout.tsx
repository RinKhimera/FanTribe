"use client"

import { useQuery } from "convex/react"
import {
  AlertTriangle,
  LayoutDashboard,
  Loader2,
  Receipt,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { SuperuserSearch } from "@/components/superuser"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badgeKey?: "pendingApplications" | "pendingReports"
}

const navItems: NavItem[] = [
  {
    href: "/superuser",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/superuser/creator-applications",
    label: "Candidatures",
    icon: UserPlus,
    badgeKey: "pendingApplications",
  },
  {
    href: "/superuser/reports",
    label: "Signalements",
    icon: AlertTriangle,
    badgeKey: "pendingReports",
  },
  {
    href: "/superuser/transactions",
    label: "Transactions",
    icon: Receipt,
  },
]

export default function SuperuserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { currentUser, isLoading } = useCurrentUser()
  const router = useRouter()
  const pathname = usePathname()

  // Real-time counts for notification badges
  const counts = useQuery(
    api.superuser.getSuperuserCounts,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  // Redirect non-superusers to home
  useEffect(() => {
    if (!isLoading && currentUser && currentUser.accountType !== "SUPERUSER") {
      router.push("/")
    }
  }, [currentUser, isLoading, router])

  const isActive = (href: string) => {
    if (href === "/superuser") {
      return pathname === "/superuser"
    }
    return pathname?.startsWith(href)
  }

  // État de chargement
  if (isLoading || currentUser === undefined) {
    return (
      <div className="border-muted flex h-full min-h-screen w-full items-center justify-center border-r border-l">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground text-lg">
            Vérification des permissions...
          </p>
        </div>
      </div>
    )
  }

  // Redirection en cours pour les utilisateurs non autorisés
  if (!currentUser || currentUser.accountType !== "SUPERUSER") {
    return (
      <div className="border-muted flex h-full min-h-screen w-full items-center justify-center border-r border-l">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground text-lg">
            Redirection en cours...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-muted flex h-full min-h-screen w-full flex-col border-r border-l">
      {/* Sticky Header with Navigation */}
      <header className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
        {/* Top bar: Title + Search */}
        <div className="flex items-center justify-between gap-4 px-4 py-3">
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

          <SuperuserSearch />
        </div>

        {/* Navigation Tabs */}
        <nav className="relative">
          {/* Gradient fade indicators for scroll */}
          <div className="from-background pointer-events-none absolute top-0 left-0 z-10 h-full w-6 bg-linear-to-r to-transparent sm:hidden" />
          <div className="from-background pointer-events-none absolute top-0 right-0 z-10 h-full w-6 bg-linear-to-l to-transparent sm:hidden" />

          {/* Scrollable tabs container */}
          <div className="scrollbar-none flex overflow-x-auto px-2 pb-0">
            <div className="flex min-w-max gap-1 px-2">
              {navItems.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                const badgeCount = item.badgeKey
                  ? (counts?.[item.badgeKey] ?? 0)
                  : 0

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium",
                      "transition-colors duration-200",
                      "rounded-t-lg",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {/* Icon */}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                      strokeWidth={active ? 2.5 : 2}
                    />

                    {/* Label */}
                    <span className="whitespace-nowrap">{item.label}</span>

                    {/* Badge */}
                    {badgeCount > 0 && (
                      <span
                        className={cn(
                          "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5",
                          "text-[10px] leading-none font-bold",
                          "animate-in zoom-in-50 duration-200",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-destructive text-white",
                        )}
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}

                    {/* Active indicator line */}
                    <div
                      className={cn(
                        "absolute right-2 bottom-0 left-2 h-0.5 rounded-t-full",
                        "transition-all duration-200",
                        active
                          ? "bg-primary opacity-100"
                          : "bg-primary opacity-0 group-hover:opacity-30",
                      )}
                    />
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content - Full Width */}
      <main className="flex-1 overflow-y-auto max-lg:pb-16">{children}</main>
    </div>
  )
}
