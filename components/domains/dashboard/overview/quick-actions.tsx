"use client"

import { Mail, PenLine, Users } from "lucide-react"
import Link from "next/link"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const QuickActions = () => {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 10 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: "easeOut" },
        },
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            asChild
            variant="outline"
            className="w-full justify-start"
          >
            <Link href="/new-post">
              <PenLine className="mr-2 h-4 w-4" />
              Créer un post
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full justify-start"
          >
            <Link href="/messages">
              <Mail className="mr-2 h-4 w-4" />
              Voir les messages
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full justify-start"
          >
            <Link href="/dashboard/audience">
              <Users className="mr-2 h-4 w-4" />
              Gérer les abonnés
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
