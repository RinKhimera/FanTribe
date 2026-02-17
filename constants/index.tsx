import {
  Bell,
  Bookmark,
  CircleUserRound,
  Home,
  LayoutDashboard,
  Mail,
  Settings,
  Sparkles,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface BadgeCounts {
  unreadMessages: number
  unreadNotifications: number
  // Admin counts (uniquement pour SUPERUSER)
  pendingApplications?: number
  pendingReports?: number
}

export interface NavLink {
  id: string
  title: string
  href: string | ((username?: string) => string)
  icon: LucideIcon
  badge?: (counts: BadgeCounts) => number | null
  mobileQuickAccess?: boolean
}

export const navigationLinks: NavLink[] = [
  {
    id: "home",
    title: "Accueil",
    href: "/",
    icon: Home,
    mobileQuickAccess: true,
  },
  {
    id: "notifications",
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
    badge: (counts) =>
      counts.unreadNotifications > 0 ? counts.unreadNotifications : null,
    mobileQuickAccess: true,
  },
  {
    id: "messages",
    title: "Messages",
    href: "/messages",
    icon: Mail,
    badge: (counts) =>
      counts.unreadMessages > 0 ? counts.unreadMessages : null,
    mobileQuickAccess: true,
  },
  {
    id: "collections",
    title: "Collections",
    href: "/collections",
    icon: Bookmark,
  },
  {
    id: "subscriptions",
    title: "Abonnements",
    href: "/subscriptions",
    icon: Users,
  },
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "profile",
    title: "Profil",
    href: (username?: string) => (username ? `/${username}` : "/profile"),
    icon: CircleUserRound,
  },
  {
    id: "account",
    title: "Paramètres",
    href: "/account",
    icon: Settings,
  },
  {
    id: "superuser",
    title: "Administration",
    href: "/superuser",
    icon: Sparkles,
    badge: (counts) => {
      const total =
        (counts.pendingApplications ?? 0) + (counts.pendingReports ?? 0)
      return total > 0 ? total : null
    },
  },
]
