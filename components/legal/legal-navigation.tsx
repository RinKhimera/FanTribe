"use client"

import { Cookie, FileText, Shield } from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const legalPages = [
  {
    href: "/terms",
    label: "Conditions",
    icon: FileText,
  },
  {
    href: "/privacy",
    label: "Confidentialité",
    icon: Shield,
  },
  {
    href: "/cookies",
    label: "Cookies",
    icon: Cookie,
  },
]

export const LegalNavigation = () => {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {legalPages.map((page) => {
        const isActive = pathname === page.href
        const Icon = page.icon

        return (
          <Link
            key={page.href}
            href={page.href}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-1.5",
              "rounded-full text-sm font-medium",
              "transition-colors duration-200",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{page.label}</span>
            {isActive && (
              <motion.div
                layoutId="legal-nav-tab"
                className={cn(
                  "absolute inset-0 -z-10 rounded-full",
                  "bg-muted/70",
                )}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
