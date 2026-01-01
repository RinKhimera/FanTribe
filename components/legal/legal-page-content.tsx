"use client"

import { motion } from "motion/react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  legalContainerVariants,
  legalHeaderVariants,
  legalQuickLinkVariants,
} from "@/lib/animations"

type QuickLink = {
  icon: LucideIcon
  title: string
  description: string
  href?: string
}

type LegalPageContentProps = {
  icon: LucideIcon
  title: string
  description: string
  quickLinks?: QuickLink[]
  children: React.ReactNode
  className?: string
}

export const LegalPageContent = ({
  icon: PageIcon,
  title,
  description,
  quickLinks,
  children,
  className,
}: LegalPageContentProps) => {
  const formattedDate = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <motion.article
      initial="initial"
      animate="animate"
      variants={legalContainerVariants}
      className={cn("max-w-none", className)}
    >
      {/* Page Header */}
      <motion.header
        variants={legalHeaderVariants}
        className={cn(
          "relative mb-12 overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-card via-card/80 to-card/60",
          "border border-border/40",
          "p-8 sm:p-10",
        )}
      >
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={cn(
              "absolute -right-16 -top-16 h-64 w-64 rounded-full",
              "bg-gradient-to-br from-primary/10 to-transparent",
              "blur-3xl",
            )}
          />
          <div
            className={cn(
              "absolute -bottom-8 -left-8 h-48 w-48 rounded-full",
              "bg-gradient-to-tr from-primary/5 to-transparent",
              "blur-2xl",
            )}
          />
          {/* Subtle grid pattern */}
          <div
            className={cn(
              "absolute inset-0 opacity-[0.015]",
              "bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)]",
              "bg-[size:32px_32px]",
            )}
          />
        </div>

        <div className="relative">
          {/* Icon and title row */}
          <div className="mb-6 flex items-center gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                "bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5",
                "border border-primary/20",
                "shadow-lg shadow-primary/10",
              )}
            >
              <PageIcon className="h-7 w-7 text-primary" />
            </motion.div>

            <div className="flex flex-col justify-center">
              <h1
                className={cn(
                  "text-3xl font-bold tracking-tight leading-tight sm:text-4xl",
                )}
              >
                {title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Dernière mise à jour : {formattedDate}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </motion.header>

      {/* Quick Navigation Links */}
      {quickLinks && quickLinks.length > 0 && (
        <motion.nav
          variants={legalContainerVariants}
          className="mb-12"
          aria-label="Navigation rapide"
        >
          <div
            className={cn(
              "grid gap-4",
              quickLinks.length === 3 && "sm:grid-cols-3",
              quickLinks.length === 4 && "sm:grid-cols-2 lg:grid-cols-4",
              quickLinks.length === 5 && "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
              quickLinks.length >= 6 && "sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {quickLinks.map((link, index) => {
              const LinkIcon = link.icon
              return (
                <motion.a
                  key={index}
                  href={link.href || `#section-${index + 1}`}
                  variants={legalQuickLinkVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className={cn(
                    "group relative overflow-hidden rounded-xl",
                    "bg-gradient-to-br from-muted/50 via-muted/30 to-transparent",
                    "border border-border/40",
                    "p-4",
                    "transition-colors duration-300",
                    "hover:border-primary/30 hover:from-primary/5 hover:via-primary/[0.02]",
                    "cursor-pointer",
                  )}
                >
                  {/* Hover glow */}
                  <div
                    className={cn(
                      "absolute inset-0 opacity-0 transition-opacity duration-300",
                      "bg-gradient-to-br from-primary/5 to-transparent",
                      "group-hover:opacity-100",
                    )}
                  />

                  <div className="relative">
                    <LinkIcon
                      className={cn(
                        "mb-2.5 h-5 w-5",
                        "text-primary/70 transition-colors duration-300",
                        "group-hover:text-primary",
                      )}
                    />
                    <h3 className="font-semibold text-foreground">
                      {link.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                </motion.a>
              )
            })}
          </div>
        </motion.nav>
      )}

      {/* Main Content */}
      <motion.div variants={legalContainerVariants} className="space-y-6">
        {children}
      </motion.div>
    </motion.article>
  )
}
