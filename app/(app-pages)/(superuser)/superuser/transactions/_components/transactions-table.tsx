"use client"

import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Id } from "@/convex/_generated/dataModel"

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

export function TransactionsTable({ transactions, isLoading }: TransactionsTableProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucune transaction trouvée pour les filtres sélectionnés.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Créatrice</TableHead>
            <TableHead>Abonné</TableHead>
            <TableHead>Moyen de paiement</TableHead>
            <TableHead>Devise</TableHead>
            <TableHead className="text-right">Montant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction._id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>
                    {new Date(transaction._creationTime).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground">
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
                    <span className="font-medium">{transaction.creator?.name}</span>
                    {transaction.creator?.username && (
                      <span className="text-xs text-muted-foreground">
                        @{transaction.creator.username}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={transaction.subscriber?.image} />
                    <AvatarFallback>
                      {transaction.subscriber?.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{transaction.subscriber?.name}</span>
                    {transaction.subscriber?.username && (
                      <span className="text-xs text-muted-foreground">
                        @{transaction.subscriber.username}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>{getProviderBadge(transaction.provider)}</TableCell>
              <TableCell>
                <Badge variant="outline">{transaction.currency}</Badge>
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(transaction.amount, transaction.currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
