"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { Menu as MenuIcon, PenLine } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { NavLink, navigationLinks } from "@/constants"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { cn } from "@/lib/utils"
import { UserInfoPopover } from "./user-info-popover"

export const MobileMenu = () => {
  const pathname = usePathname()
  const router = useRouter()

  const { currentUser } = useCurrentUser()
  const { isAuthenticated } = useConvexAuth()

  const [isOpen, setIsOpen] = useState(false)

  const unreadCountsData = useQuery(
    api.notifications.getUnreadCounts,
    isAuthenticated ? undefined : "skip",
  )

  const unreadCounts = {
    unreadMessages: unreadCountsData?.unreadMessagesCount || 0,
    unreadNotifications: unreadCountsData?.unreadNotificationsCount || 0,
  }

  // Liens réservés aux superusers et créateurs
  const filteredNavigationLinks = navigationLinks.filter((link) => {
    const superuserOnlyLinks = ["superuser"]
    const creatorOnlyLinks = ["dashboard"]

    if (superuserOnlyLinks.includes(link.id)) {
      return currentUser?.accountType === "SUPERUSER"
    }

    if (creatorOnlyLinks.includes(link.id)) {
      return (
        currentUser?.accountType === "CREATOR" ||
        currentUser?.accountType === "SUPERUSER"
      )
    }

    return true
  })

  // Filtrer les liens rapides pour la barre inférieure
  const quickAccessLinks = filteredNavigationLinks.filter(
    (link) => link.mobileQuickAccess,
  )
  // S'assurer qu'on a au maximum 3 liens rapides + le bouton menu
  const displayedQuickAccessLinks = quickAccessLinks.slice(0, 3)

  const getHref = (link: NavLink) => {
    if (typeof link.href === "function") {
      return link.href(currentUser?.username)
    }
    return link.href
  }

  // Fonction pour gérer la navigation depuis le Sheet
  const handleSheetNavigation = (href: string) => {
    setIsOpen(false)
    setTimeout(() => {
      router.push(href)
    }, 150)
  }

  // Fonction pour gérer le clic sur le bouton "Publier"
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
    <section className="fixed bottom-0 z-30 h-16 w-full border-t border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60 min-[500px]:hidden">
      <div className="flex h-full items-center justify-around px-1">
        {displayedQuickAccessLinks.map((link) => {
          const IconComponent = link.icon
          const badgeValue = link.badge ? link.badge(unreadCounts) : null
          const href = getHref(link)

          return (
            <Link
              key={`quick-${link.id}`}
              href={href}
              className={cn(
                "flex h-full flex-1 flex-col items-center justify-center rounded-lg p-1 text-center",
                pathname === href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative">
                <IconComponent className="size-6" />
                {badgeValue && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[9px]"
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

        {/* Déclencheur du Sheet pour le menu complet */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-full flex-1 flex-col items-center justify-center rounded-lg p-1 text-muted-foreground hover:text-foreground"
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

            <nav className="flex-1 overflow-y-auto px-2 py-3">
              <div className="flex flex-col space-y-1">
                {filteredNavigationLinks.map((link) => {
                  const IconComponent = link.icon
                  const badgeValue = link.badge
                    ? link.badge(unreadCounts)
                    : null
                  const href = getHref(link)

                  return (
                    <Button
                      key={`sheet-${link.id}`}
                      variant="ghost"
                      className={cn(
                        "text-md flex h-12 items-center justify-start space-x-4 rounded-lg px-3 py-2",
                        pathname === href
                          ? "bg-accent font-semibold text-accent-foreground"
                          : "text-foreground hover:bg-accent/70",
                      )}
                      onClick={() => handleSheetNavigation(href)}
                    >
                      <div className="relative">
                        <IconComponent className="size-5" />
                        {badgeValue && (
                          <Badge
                            variant="destructive"
                            className="absolute -right-2.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[9px]"
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
            </nav>

            {currentUser && (
              <div className="mt-auto space-y-4 border-t p-4">
                <Button
                  className="w-full rounded-full bg-primary py-3 text-lg font-semibold hover:bg-primary/80"
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
    </section>
  )
}
