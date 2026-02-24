"use client"

import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Id } from "@/convex/_generated/dataModel"

interface TransactionsFiltersProps {
  dateRange: {
    startDate: number
    endDate: number
  }
  onDateRangeChange: (range: { startDate: number; endDate: number }) => void
  selectedCreatorId?: Id<"users">
  onCreatorChange: (creatorId: Id<"users"> | undefined) => void
  selectedProvider?: string
  onProviderChange: (provider: string | undefined) => void
  creators: Array<{
    _id: Id<"users">
    name: string
    username?: string
    image: string
  }>
}

// Périodes prédéfinies
const PRESET_RANGES = [
  { label: "2 dernières semaines", days: 14 },
  { label: "Dernier mois", days: 30 },
  { label: "3 derniers mois", days: 90 },
  { label: "6 derniers mois", days: 180 },
  { label: "Dernière année", days: 365 },
]

export function TransactionsFilters({
  dateRange,
  onDateRangeChange,
  selectedCreatorId,
  onCreatorChange,
  selectedProvider,
  onProviderChange,
  creators,
}: TransactionsFiltersProps) {
  const handlePresetChange = (days: string) => {
    const daysNum = parseInt(days)
    const now = Date.now()
    onDateRangeChange({
      startDate: now - daysNum * 24 * 60 * 60 * 1000,
      endDate: now,
    })
  }

  const getCurrentPreset = () => {
    const daysDiff = Math.floor(
      (dateRange.endDate - dateRange.startDate) / (24 * 60 * 60 * 1000),
    )
    const preset = PRESET_RANGES.find((r) => r.days === daysDiff)
    return preset ? preset.days.toString() : "14"
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Filtre de période */}
          <div className="space-y-2">
            <Label htmlFor="period" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Période
            </Label>
            <Select
              value={getCurrentPreset()}
              onValueChange={handlePresetChange}
            >
              <SelectTrigger id="period">
                <SelectValue placeholder="Sélectionner une période" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_RANGES.map((range) => (
                  <SelectItem key={range.days} value={range.days.toString()}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre par créatrice */}
          <div className="space-y-2">
            <Label htmlFor="creator">Créatrice</Label>
            <Select
              value={selectedCreatorId || "all"}
              onValueChange={(value) =>
                onCreatorChange(
                  value === "all" ? undefined : (value as Id<"users">),
                )
              }
            >
              <SelectTrigger id="creator">
                <SelectValue placeholder="Toutes les créatrices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les créatrices</SelectItem>
                {creators.map((creator) => (
                  <SelectItem key={creator._id} value={creator._id}>
                    {creator.name}{" "}
                    {creator.username ? `(@${creator.username})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre par moyen de paiement */}
          <div className="space-y-2">
            <Label htmlFor="provider">Moyen de paiement</Label>
            <Select
              value={selectedProvider || "all"}
              onValueChange={(value) =>
                onProviderChange(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Tous les moyens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les moyens</SelectItem>
                <SelectItem value="stripe">Stripe (Cartes)</SelectItem>
                <SelectItem value="cinetpay">CinetPay (OM/MOMO)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bouton de réinitialisation */}
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onDateRangeChange({
                startDate: Date.now() - 14 * 24 * 60 * 60 * 1000,
                endDate: Date.now(),
              })
              onCreatorChange(undefined)
              onProviderChange(undefined)
            }}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
