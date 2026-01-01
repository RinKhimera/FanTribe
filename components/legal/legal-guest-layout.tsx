"use client"

import { motion } from "motion/react"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const legalPages = [
  { href: "/terms", label: "Conditions" },
  { href: "/privacy", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
]

type LegalGuestLayoutProps = {
  children: React.ReactNode
}

export const LegalGuestLayout = ({ children }: LegalGuestLayoutProps) => {
  const pathname = usePathname()

  return (
    <div className="bg-background relative min-h-screen">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div
          className={cn(
            "absolute -left-[20%] top-0 h-[600px] w-[600px] rounded-full",
            "bg-gradient-to-br from-primary/8 via-primary/4 to-transparent",
            "blur-3xl",
          )}
        />
        <div
          className={cn(
            "absolute -right-[10%] top-[30%] h-[500px] w-[500px] rounded-full",
            "bg-gradient-to-bl from-primary/6 via-transparent to-transparent",
            "blur-3xl",
          )}
        />
        <div
          className={cn(
            "absolute -bottom-[10%] left-[30%] h-[400px] w-[400px] rounded-full",
            "bg-gradient-to-t from-primary/5 to-transparent",
            "blur-3xl",
          )}
        />

        {/* Subtle grid overlay */}
        <div
          className={cn(
            "absolute inset-0 opacity-[0.02]",
            "bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)]",
            "bg-[size:48px_48px]",
          )}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "sticky top-0 z-50",
          "border-b border-border/40",
          "bg-background/70 backdrop-blur-xl",
          "supports-[backdrop-filter]:bg-background/50",
        )}
      >
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className={cn(
              "group flex items-center gap-2",
              "transition-opacity duration-200 hover:opacity-80",
            )}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Image
                src="/images/logo.svg"
                alt="FanTribe Logo"
                width={120}
                height={120}
                priority
              />
            </motion.div>
          </Link>

          {/* Navigation tabs */}
          <nav className="hidden items-center gap-1 sm:flex">
            {legalPages.map((page) => {
              const isActive = pathname === page.href
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className={cn(
                    "relative px-3 py-1.5 text-sm font-medium",
                    "rounded-full transition-colors duration-200",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {page.label}
                  {isActive && (
                    <motion.div
                      layoutId="legal-nav-indicator"
                      className={cn(
                        "absolute inset-0 -z-10 rounded-full",
                        "bg-muted/60",
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

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            <Link href="/auth/sign-in">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-muted-foreground",
                  "hover:text-foreground hover:bg-muted/50",
                )}
              >
                Se connecter
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  className={cn(
                    "rounded-full",
                    "bg-primary hover:bg-primary/90",
                    "shadow-md shadow-primary/20",
                  )}
                >
                  S&apos;inscrire
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Link
            href="/"
            className={cn(
              "group mb-8 inline-flex items-center gap-2",
              "text-sm text-muted-foreground",
              "transition-colors duration-200 hover:text-foreground",
            )}
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Retour à l&apos;accueil
          </Link>
        </motion.div>

        {/* Mobile navigation */}
        <motion.nav
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mb-8 flex gap-2 overflow-x-auto pb-2 sm:hidden"
        >
          {legalPages.map((page) => {
            const isActive = pathname === page.href
            return (
              <Link
                key={page.href}
                href={page.href}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium",
                  "border transition-all duration-200",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {page.label}
              </Link>
            )
          })}
        </motion.nav>

        {/* Content wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="relative border-t border-border/40 py-8"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FanTribe. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {legalPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className={cn(
                    "text-sm text-muted-foreground",
                    "transition-colors duration-200 hover:text-primary",
                    pathname === page.href && "text-foreground",
                  )}
                >
                  {page.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
