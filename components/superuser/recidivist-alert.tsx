"use client"

import { useQuery } from "convex/react"
import {
  AlertTriangle,
  FileText,
  MessageSquare,
  TrendingUp,
  User,
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

interface RecidivistAlertProps {
  userId: Id<"users">
  username?: string
}

const reasonLabels: Record<string, string> = {
  spam: "Spam",
  harassment: "Harcèlement",
  inappropriate_content: "Contenu inapproprié",
  fake_account: "Faux compte",
  copyright: "Droits d'auteur",
  violence: "Violence",
  hate_speech: "Discours de haine",
  other: "Autre",
}

const typeIcons = {
  user: User,
  post: FileText,
  comment: MessageSquare,
}

export const RecidivistAlert = ({ userId, username }: RecidivistAlertProps) => {
  const reportHistory = useQuery(api.reports.getReportHistoryForUser, { userId })

  // Loading state
  if (reportHistory === undefined) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  // No data or no reports
  if (!reportHistory || reportHistory.totalReports === 0) {
    return null
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <Card className={cn(reportHistory.isRecidivist && "border-amber-500/30")}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          Historique des signalements
          {reportHistory.isRecidivist && (
            <Badge
              variant="outline"
              className="ml-2 gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600"
            >
              <AlertTriangle className="h-3 w-3" />
              Récidiviste
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recidivist warning */}
        {reportHistory.isRecidivist && (
          <Alert className="border-amber-500/30 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-600">
              Utilisateur signalé plusieurs fois
            </AlertTitle>
            <AlertDescription className="text-amber-600/80">
              {username ? `@${username}` : "Cet utilisateur"} a été signalé{" "}
              <strong>{reportHistory.totalReports} fois</strong>. Considérez un
              avertissement ou un bannissement.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="text-xs">Utilisateur</span>
            </div>
            <p className="mt-1 text-lg font-semibold">
              {reportHistory.userReports}
            </p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-xs">Publications</span>
            </div>
            <p className="mt-1 text-lg font-semibold">
              {reportHistory.postReports}
            </p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-xs">Commentaires</span>
            </div>
            <p className="mt-1 text-lg font-semibold">
              {reportHistory.commentReports}
            </p>
          </div>
        </div>

        {/* Recent reports */}
        {reportHistory.recentReports.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Signalements récents
            </p>
            <div className="space-y-2">
              {reportHistory.recentReports.slice(0, 5).map((report) => {
                const TypeIcon = typeIcons[report.type as keyof typeof typeIcons] || User
                return (
                  <Link
                    key={report._id}
                    href={`/superuser/reports/${report._id}`}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-2.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {reasonLabels[report.reason] || report.reason}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Par {report.reporterName} • {formatDate(report.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        report.status === "pending" &&
                          "border-amber-500/20 bg-amber-500/10 text-amber-600",
                        report.status === "reviewing" &&
                          "border-sky-500/20 bg-sky-500/10 text-sky-600",
                        report.status === "resolved" &&
                          "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
                        report.status === "rejected" &&
                          "border-rose-500/20 bg-rose-500/10 text-rose-600"
                      )}
                    >
                      {report.status === "pending" && "En attente"}
                      {report.status === "reviewing" && "En révision"}
                      {report.status === "resolved" && "Résolu"}
                      {report.status === "rejected" && "Rejeté"}
                    </Badge>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
