"use client"

import { BarChart3, PenLine } from "lucide-react"
import Link from "next/link"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"

interface EmptyDashboardProps {
  title?: string
  description?: string
  showCreatePost?: boolean
}

export function EmptyDashboard({
  title = "Bienvenue sur votre dashboard",
  description = "Commencez à publier du contenu pour voir vos statistiques apparaître ici.",
  showCreatePost = true,
}: EmptyDashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="bg-muted/50 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl">
        <BarChart3 aria-hidden="true" className="text-muted-foreground h-10 w-10" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        {description}
      </p>
      {showCreatePost && (
        <Button asChild className="mt-6" size="lg">
          <Link href="/new-post">
            <PenLine className="mr-2 h-4 w-4" />
            Créer un post
          </Link>
        </Button>
      )}
    </motion.div>
  )
}
