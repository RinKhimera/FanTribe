"use client"

import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Id } from "@/convex/_generated/dataModel"
import { type Currency, formatDualCurrency } from "@/lib/services/currency"

interface Transaction {
  _id: Id<"transactions">
  _creationTime: number
  amount: number
  currency: string
  provider: string
  providerTransactionId: string
  creator: {
    _id: Id<"users">
    name: string
    username?: string
    image: string
  } | null
  subscriber: {
    _id: Id<"users">
    name: string
    username?: string
    image: string
  } | null
}

interface TransactionsTableProps {
  transactions: Transaction[]
  isLoading: boolean
}

type SortField =
  | "date"
  | "creator"
  | "subscriber"
  | "provider"
  | "currency"
  | "amount"
type SortOrder = "asc" | "desc"

const SortIcon = ({
  field,
  sortField,
  sortOrder,
}: {
  field: SortField
  sortField: SortField
  sortOrder: SortOrder
}) => {
  if (sortField !== field) {
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }
  return sortOrder === "asc" ? (
    <ArrowUp className="ml-2 h-4 w-4" />
  ) : (
    <ArrowDown className="ml-2 h-4 w-4" />
  )
}

export function TransactionsTable({
  transactions,
  isLoading,
}: TransactionsTableProps) {
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  // Fonction de tri
  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "date":
          comparison = a._creationTime - b._creationTime
          break
        case "creator":
          comparison = (a.creator?.name || "").localeCompare(
            b.creator?.name || "",
          )
          break
        case "subscriber":
          comparison = (a.subscriber?.name || "").localeCompare(
            b.subscriber?.name || "",
          )
          break
        case "provider":
          comparison = a.provider.localeCompare(b.provider)
          break
        case "currency":
          comparison = a.currency.localeCompare(b.currency)
          break
        case "amount":
          comparison = a.amount - b.amount
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return sorted
  }, [transactions, sortField, sortOrder])

  // Gérer le clic sur un header pour trier
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle l'ordre si même colonne
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Nouvelle colonne : tri ascendant par défaut
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const getProviderBadge = (provider: string) => {
    if (provider.toLowerCase() === "stripe") {
      return <Badge variant="default">Stripe</Badge>
    }
    if (provider.toLowerCase() === "cinetpay") {
      return <Badge variant="secondary">CinetPay</Badge>
    }
    return <Badge variant="outline">{provider}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        <p>Aucune transaction trouvée pour les filtres sélectionnés.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("date")}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Date
                    <SortIcon
                      field="date"
                      sortField={sortField}
                      sortOrder={sortOrder}
                    />
                  </Button>
                </TableHead>
                <TableHead className="min-w-[150px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("creator")}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Créatrice
                    <SortIcon
                      field="creator"
                      sortField={sortField}
                      sortOrder={sortOrder}
                    />
                  </Button>
                </TableHead>
                <TableHead className="hidden min-w-[150px] md:table-cell">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("subscriber")}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Abonné
                    <SortIcon
                      field="subscriber"
                      sortField={sortField}
                      sortOrder={sortOrder}
                    />
                  </Button>
                </TableHead>
                <TableHead className="w-[120px]">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("provider")}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    <span className="hidden lg:inline">Fournisseur</span>
                    <span className="lg:hidden">Fournisseur</span>
                    <SortIcon
                      field="provider"
                      sortField={sortField}
                      sortOrder={sortOrder}
                    />
                  </Button>
                </TableHead>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("currency")}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Devise
                    <SortIcon
                      field="currency"
                      sortField={sortField}
                      sortOrder={sortOrder}
                    />
                  </Button>
                </TableHead>
                <TableHead className="w-[180px] text-right">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("amount")}
                    className="ml-auto h-auto p-0 font-medium hover:bg-transparent"
                  >
                    Montant
                    <SortIcon
                      field="amount"
                      sortField={sortField}
                      sortOrder={sortOrder}
                    />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>
                        {new Date(transaction._creationTime).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(transaction._creationTime, {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={transaction.creator?.image} />
                        <AvatarFallback>
                          {transaction.creator?.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {transaction.creator?.name}
                        </span>
                        {transaction.creator?.username && (
                          <span className="text-muted-foreground text-xs">
                            @{transaction.creator.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={transaction.subscriber?.image}
                          width={20}
                          height={20}
                          className="aspect-square object-cover"
                        />
                        <AvatarFallback>
                          {transaction.subscriber?.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {transaction.subscriber?.name}
                        </span>
                        {transaction.subscriber?.username && (
                          <span className="text-muted-foreground text-xs">
                            @{transaction.subscriber.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getProviderBadge(transaction.provider)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{transaction.currency}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatDualCurrency(
                      transaction.amount,
                      transaction.currency.toUpperCase() as Currency,
                      true,
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
