"use client"

import { TrendingUp } from "lucide-react"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const CommissionInfo = () => {
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
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
            Comment fonctionnent vos revenus ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="border-primary/20 rounded-lg border p-4">
              <h3 className="font-semibold">Votre part</h3>
              <p className="text-primary text-2xl font-bold">70%</p>
              <p className="text-muted-foreground text-sm">
                De chaque abonnement et pourboire
              </p>
            </div>
            <div className="border-muted rounded-lg border p-4">
              <h3 className="font-semibold">Commission plateforme</h3>
              <p className="text-muted-foreground text-2xl font-bold">30%</p>
              <p className="text-muted-foreground text-sm">
                Pour l&apos;hébergement et les services
              </p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="mb-2 font-semibold">Calendrier de paiement</h3>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>
                • Les paiements sont effectués le{" "}
                <strong>dernier jeudi de chaque mois</strong>
              </li>
              <li>
                • Vous recevez 70% du montant total de vos abonnements et
                pourboires du mois
              </li>
              <li>• Les paiements sont automatiques et sécurisés</li>
              <li>
                • Le prochain paiement inclut toutes les transactions depuis
                le dernier paiement mensuel
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
