"use client"

import { useConvexAuth, useQuery } from "convex/react"
import { PenLine } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { UserInfoPopover } from "@/components/shared/user-info-popover"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { NavLink, navigationLinks } from "@/constants"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { MobileNavigation } from "./mobile-navigation"

type LeftSidebarProps = {
  currentUser: Doc<"users">
}

/**
 * LeftSidebar - Barre de navigation latérale gauche
 *
 * Features :
 * - Navigation principale avec icônes et labels
 * - Badges pour notifications non lues
 * - Bouton "Publier" contextuel (créateur/utilisateur)
 * - Responsive : icônes seules sur tablet, cachée sur mobile
 * - Sticky pour rester visible au scroll
 */
export const LeftSidebar = ({ currentUser }: LeftSidebarProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated } = useConvexAuth()

  // Compteurs de notifications non lues
  const unreadCountsData = useQuery(
    api.notifications.getUnreadCounts,
    isAuthenticated ? undefined : "skip",
  )

  const unreadCounts = {
    unreadMessages: unreadCountsData?.unreadMessagesCount || 0,
    unreadNotifications: unreadCountsData?.unreadNotificationsCount || 0,
  }

  // Filtrer les liens selon le type de compte
  const filteredNavigationLinks = navigationLinks.filter((link) => {
    const superuserOnlyLinks = ["superuser", "messages"]
    const creatorOnlyLinks = ["income"]

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

  // Résoudre les hrefs dynamiques
  const getHref = (link: NavLink) => {
    if (typeof link.href === "function") {
      return link.href(currentUser?.username)
    }
    return link.href
  }

  // Navigation vers la page de publication
  const handlePublishClick = () => {
    if (
      currentUser?.accountType === "CREATOR" ||
      currentUser?.accountType === "SUPERUSER"
    ) {
      router.push("/new-post")
    } else {
      router.push("/be-creator")
    }
  }

  return (
    <>
      {/* Sidebar Desktop/Tablet */}
      <aside
        className={cn(
          "sticky top-0 h-screen",
          "flex flex-col items-stretch",
          "w-(--sidebar-left-width)",
          "pr-(--sidebar-left-padding)",
          // Masquer sur mobile
          "max-[500px]:hidden",
          // Alignement sur tablet
          "max-lg:items-end",
          // Marge gauche sur grand écran
          "lg:ml-5",
        )}
      >
        <nav className="mt-4 flex h-full w-full flex-col space-y-5 font-semibold max-lg:items-center lg:min-w-[230px]">
          {/* Liens de navigation */}
          {filteredNavigationLinks.map((link) => {
            const IconComponent = link.icon
            const badgeValue = link.badge ? link.badge(unreadCounts) : null
            const href = getHref(link)
            const isActive = pathname === href

            return (
              <Link
                key={`desktop-${link.id}`}
                href={href}
                className={cn(
                  buttonVariants({ variant: "navLink" }),
                  "flex w-fit items-center gap-6 rounded-3xl text-xl transition",
                  "hover:bg-foreground/10 hover:text-primary",
                  !isActive && "text-muted-foreground",
                )}
              >
                <div className="relative">
                  <IconComponent className="size-6!" />
                  {badgeValue && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                    >
                      {badgeValue}
                    </Badge>
                  )}
                </div>
                <span className="max-lg:hidden">{link.title}</span>
              </Link>
            )
          })}

          {/* Bouton Publier - Desktop */}
          <Button
            className="bg-primary hover:bg-primary/80 w-full rounded-full px-5 py-6 text-xl max-lg:hidden"
            onClick={handlePublishClick}
          >
            Publier
          </Button>

          {/* Bouton Publier - Tablet (icône seule) */}
          <Button
            className="bg-primary hover:bg-primary/80 w-fit rounded-full p-3 text-xl transition lg:hidden"
            onClick={handlePublishClick}
          >
            <PenLine className="size-6" />
          </Button>
        </nav>

        {/* User info popover en bas */}
        {currentUser && <UserInfoPopover currentUser={currentUser} />}
      </aside>

      {/* Navigation Mobile (bottom bar) */}
      {isAuthenticated && <MobileNavigation />}
    </>
  )
}
