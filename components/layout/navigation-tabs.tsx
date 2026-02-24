"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"
import { cn } from "@/lib/utils"

type NavItem = {
  /** URL de destination */
  href: string
  /** Label affiché */
  label: string
  /** Icône optionnelle (composant React) */
  icon?: React.ElementType
  /** Nombre pour le badge (notifications, etc.) */
  badge?: number
}

type NavigationTabsProps = {
  /** Liste des onglets */
  items: NavItem[]
  /**
   * Variante d'affichage :
   * - "grid": Grille fixe (ex: profil avec 2 colonnes)
   * - "underline": Tabs scrollables avec indicateur (ex: superuser)
   */
  variant?: "grid" | "underline"
  /** Nombre de colonnes pour la variante grid (default: nombre d'items) */
  gridCols?: number
  /** Classes additionnelles */
  className?: string
}

/**
 * NavigationTabs - Onglets de navigation réutilisables
 *
 * @example
 * // Style grille (profil)
 * <NavigationTabs
 *   items={[
 *     { href: "/user", label: "Publications" },
 *     { href: "/user/gallery", label: "Médias" },
 *   ]}
 *   variant="grid"
 * />
 *
 * @example
 * // Style underline avec icônes et badges (superuser)
 * <NavigationTabs
 *   items={[
 *     { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
 *     { href: "/admin/users", label: "Users", icon: Users, badge: 5 },
 *   ]}
 *   variant="underline"
 * />
 */
export const NavigationTabs = ({
  items,
  variant = "underline",
  gridCols,
  className,
}: NavigationTabsProps) => {
  const pathname = usePathname()

  const isActive = (href: string, index: number) => {
    // Le premier item est actif seulement si le pathname correspond exactement
    if (index === 0) {
      return pathname === href
    }
    // Les autres items sont actifs si le pathname commence par leur href
    return pathname?.startsWith(href) ?? false
  }

  if (variant === "grid") {
    return (
      <div className={cn("frosted", className)}>
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${gridCols ?? items.length}, minmax(0, 1fr))`,
          }}
        >
          {items.map((item, index) => {
            const active = isActive(item.href, index)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center py-3 text-sm transition-colors duration-200",
                  "hover:bg-primary/5",
                  active
                    ? "border-primary border-b-2 font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  // Variant "underline" - scrollable tabs avec icônes et badges
  return (
    <nav className={cn("relative", className)}>
      {/* Gradient fade indicators for scroll */}
      <div className="from-background pointer-events-none absolute top-0 left-0 z-10 h-full w-6 bg-linear-to-r to-transparent sm:hidden" />
      <div className="from-background pointer-events-none absolute top-0 right-0 z-10 h-full w-6 bg-linear-to-l to-transparent sm:hidden" />

      {/* Scrollable tabs container */}
      <div className="scrollbar-none flex overflow-x-auto px-2 pb-0">
        <div className="flex min-w-max gap-1 px-2">
          {items.map((item, index) => {
            const active = isActive(item.href, index)
            const Icon = item.icon

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
                {Icon && (
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                )}

                {/* Label */}
                <span className="whitespace-nowrap">{item.label}</span>

                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={cn(
                      "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5",
                      "text-[10px] leading-none font-bold",
                      "motion-safe:animate-in motion-safe:zoom-in-50 duration-200",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-destructive text-white",
                    )}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}

                {/* Active indicator line */}
                <div
                  className={cn(
                    "absolute right-2 bottom-0 left-2 h-0.5 rounded-t-full",
                    "transition-[opacity,background-color] duration-200",
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
  )
}
