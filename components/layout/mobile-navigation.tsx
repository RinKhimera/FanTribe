"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { Menu as MenuIcon, PenLine } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { UserInfoPopover } from "@/components/shared/user-info-popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { BadgeCounts, NavLink, navigationLinks } from "@/constants"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { cn } from "@/lib/utils"

/**
 * MobileNavigation - Barre de navigation mobile (bottom bar)
 *
 * Features :
 * - Barre fixe en bas de l'écran sur mobile
 * - 3 liens d'accès rapide + bouton menu
 * - Sheet latéral avec navigation complète
 * - Bouton "Publier" dans le menu
 */
export const MobileNavigation = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser } = useCurrentUser()
  const { isAuthenticated } = useConvexAuth()
  const [isOpen, setIsOpen] = useState(false)

  // Compteurs de notifications
  const unreadCountsData = useQuery(
    api.notifications.getUnreadCounts,
    isAuthenticated ? undefined : "skip",
  )

  // Compteurs admin (uniquement pour SUPERUSER)
  const superuserCountsData = useQuery(
    api.superuser.getSuperuserCounts,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  const unreadCounts: BadgeCounts = {
    unreadMessages: unreadCountsData?.unreadMessagesCount || 0,
    unreadNotifications: unreadCountsData?.unreadNotificationsCount || 0,
    pendingApplications: superuserCountsData?.pendingApplications,
    pendingReports: superuserCountsData?.pendingReports,
  }

  // Filtrer les liens selon le type de compte
  const filteredNavigationLinks = navigationLinks.filter((link) => {
    const superuserOnlyLinks = ["superuser", "messages"]
    if (superuserOnlyLinks.includes(link.id)) {
      return currentUser?.accountType === "SUPERUSER"
    }
    return true
  })

  // Liens d'accès rapide (max 3 pour la bottom bar)
  const quickAccessLinks = filteredNavigationLinks
    .filter((link) => link.mobileQuickAccess)
    .slice(0, 3)

  // Résoudre les hrefs dynamiques
  const getHref = (link: NavLink) => {
    if (typeof link.href === "function") {
      return link.href(currentUser?.username)
    }
    return link.href
  }

  // Navigation depuis le Sheet
  const handleSheetNavigation = (href: string) => {
    setIsOpen(false)
    setTimeout(() => router.push(href), 150)
  }

  // Clic sur "Publier"
  const handlePublishClick = () => {
    setIsOpen(false)
    setTimeout(() => {
      if (
        currentUser?.accountType === "CREATOR" ||
        currentUser?.accountType === "SUPERUSER"
      ) {
        router.push("/new-post")
      } else {
        router.push("/be-creator")
      }
    }, 150)
  }

  return (
    <nav
      className={cn(
        "fixed bottom-0 z-30 w-full",
        "h-(--mobile-nav-height)",
        "border-border border-t",
        "bg-background/95 backdrop-blur-sm",
        "supports-backdrop-filter:bg-background/60",
        // Afficher uniquement sur mobile
        "min-[500px]:hidden",
      )}
    >
      <div className="flex h-full items-center justify-around px-1">
        {/* Liens d'accès rapide */}
        {quickAccessLinks.map((link) => {
          const IconComponent = link.icon
          const badgeValue = link.badge ? link.badge(unreadCounts) : null
          const href = getHref(link)
          const isActive = pathname === href

          return (
            <Link
              key={`quick-${link.id}`}
              href={href}
              className={cn(
                "flex h-full flex-1 flex-col items-center justify-center",
                "rounded-lg p-1 text-center",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative">
                <IconComponent className="size-6" />
                {badgeValue && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[9px]"
                  >
                    {badgeValue}
                  </Badge>
                )}
              </div>
              <span className="mt-0.5 truncate text-[10px] leading-tight">
                {link.title}
              </span>
            </Link>
          )
        })}

        {/* Bouton Menu - ouvre le Sheet */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground flex h-full flex-1 flex-col items-center justify-center rounded-lg p-1"
              aria-label="Ouvrir le menu"
            >
              <MenuIcon className="size-6" />
              <span className="mt-0.5 text-[10px]">Menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className="flex w-[300px] flex-col p-0 sm:w-[320px]"
          >
            <SheetHeader className="border-b p-4">
              <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
            </SheetHeader>

            {/* Navigation complète */}
            <div className="flex-1 overflow-y-auto px-2 py-3">
              <div className="flex flex-col space-y-1">
                {filteredNavigationLinks.map((link) => {
                  const IconComponent = link.icon
                  const badgeValue = link.badge
                    ? link.badge(unreadCounts)
                    : null
                  const href = getHref(link)
                  const isActive = pathname === href

                  return (
                    <Button
                      key={`sheet-${link.id}`}
                      variant="ghost"
                      className={cn(
                        "text-md flex h-12 items-center justify-start space-x-4 rounded-lg px-3 py-2",
                        isActive
                          ? "bg-accent text-accent-foreground font-semibold"
                          : "text-foreground hover:bg-accent/70",
                      )}
                      onClick={() => handleSheetNavigation(href)}
                    >
                      <div className="relative">
                        <IconComponent className="size-5" />
                        {badgeValue && (
                          <Badge
                            variant="destructive"
                            className="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[9px]"
                          >
                            {badgeValue}
                          </Badge>
                        )}
                      </div>
                      <span>{link.title}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Footer avec bouton Publier et User Info */}
            {currentUser && (
              <div className="mt-auto space-y-4 border-t p-4">
                <Button
                  className="bg-primary hover:bg-primary/80 w-full rounded-full py-3 text-lg font-semibold"
                  onClick={handlePublishClick}
                >
                  <PenLine className="mr-2 size-5" />
                  Publier
                </Button>
                <div className="flex justify-center">
                  <UserInfoPopover
                    currentUser={currentUser}
                    onNavigate={() => setIsOpen(false)}
                  />
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
