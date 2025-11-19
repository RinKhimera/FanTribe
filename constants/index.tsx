import {
  Bell,
  Bookmark,
  CircleUserRound,
  DollarSign,
  Home,
  Mail,
  Sparkles,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavLink {
  id: string
  title: string
  href: string | ((username?: string) => string)
  icon: LucideIcon
  badge?: (counts: {
    unreadMessages: number
    unreadNotifications: number
  }) => number | null
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
    href: "/user-lists",
    icon: Users,
  },
  {
    id: "income",
    title: "Revenus",
    href: "/income",
    icon: DollarSign,
  },
  {
    id: "profile",
    title: "Profil",
    href: (username?: string) => (username ? `/${username}` : "/profile"),
    icon: CircleUserRound,
  },
  {
    id: "superuser",
    title: "Administration",
    href: "/superuser",
    icon: Sparkles,
  },
]
