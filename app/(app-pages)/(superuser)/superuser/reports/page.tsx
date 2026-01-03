"use client"

import { useQuery } from "convex/react"
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  Flag,
  MessageSquare,
  ShieldAlert,
  User,
} from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"
import {
  type FilterDefinition,
  SuperuserFiltersBar,
} from "@/components/superuser"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useSuperuserFilters } from "@/hooks/useSuperuserFilters"
import { cn } from "@/lib/utils"

const filterDefinitions: FilterDefinition[] = [
  {
    key: "status",
    label: "Statut",
    type: "multi-select",
    options: [
      { value: "pending", label: "En attente" },
      { value: "resolved", label: "Traité" },
    ],
  },
  {
    key: "type",
    label: "Type",
    type: "multi-select",
    options: [
      { value: "user", label: "Utilisateur" },
      { value: "post", label: "Publication" },
      { value: "comment", label: "Commentaire" },
    ],
  },
  {
    key: "reason",
    label: "Motif",
    type: "multi-select",
    options: [
      { value: "spam", label: "Spam" },
      { value: "harassment", label: "Harcèlement" },
      { value: "inappropriate_content", label: "Contenu inapproprié" },
      { value: "fake_account", label: "Faux compte" },
      { value: "copyright", label: "Droits d'auteur" },
      { value: "violence", label: "Violence" },
      { value: "hate_speech", label: "Discours de haine" },
      { value: "other", label: "Autre" },
    ],
  },
]

const statusConfig = {
  pending: {
    label: "En attente",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  reviewing: {
    label: "Traité",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  resolved: {
    label: "Traité",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  rejected: {
    label: "Traité",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
}

const typeConfig = {
  user: {
    label: "Utilisateur",
    icon: User,
    className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  },
  post: {
    label: "Publication",
    icon: MessageSquare,
    className: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  },
  comment: {
    label: "Commentaire",
    icon: MessageSquare,
    className: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20",
  },
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

export default function ReportsPage() {
  const { currentUser } = useCurrentUser()
  const { getFilterAll } = useSuperuserFilters()

  const allReports = useQuery(
    api.reports.getAllReports,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  const reportsStats = useQuery(
    api.reports.getReportsStats,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  // Create stable dependency key from reports data
  const reportsKey =
    allReports?.map((r) => `${r._id}-${r.status}`).join(",") ?? ""

  const { filteredReports, urgentCount } = useMemo(() => {
    if (!allReports) {
      return { filteredReports: [], urgentCount: 0 }
    }

    const statusFilters = getFilterAll("status")
    const typeFilters = getFilterAll("type")
    const reasonFilters = getFilterAll("reason")

    let filtered = [...allReports]

    if (statusFilters.length > 0) {
      filtered = filtered.filter((r) => {
        // "resolved" filter matches all non-pending statuses
        if (statusFilters.includes("resolved")) {
          return (
            statusFilters.includes(r.status) ||
            (r.status !== "pending" &&
              ["reviewing", "resolved", "rejected"].includes(r.status))
          )
        }
        return statusFilters.includes(r.status)
      })
    }

    if (typeFilters.length > 0) {
      filtered = filtered.filter((r) => typeFilters.includes(r.type))
    }

    if (reasonFilters.length > 0) {
      filtered = filtered.filter((r) => reasonFilters.includes(r.reason))
    }

    // Sort: pending first, then resolved (all treated), then by date desc
    filtered.sort((a, b) => {
      const aIsPending = a.status === "pending" ? 0 : 1
      const bIsPending = b.status === "pending" ? 0 : 1
      if (aIsPending !== bIsPending) return aIsPending - bIsPending
      return b.createdAt - a.createdAt
    })

    const urgentCount = allReports.filter(
      (r) =>
        r.status === "pending" &&
        ["harassment", "violence", "hate_speech"].includes(r.reason),
    ).length

    return { filteredReports: filtered, urgentCount }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsKey, getFilterAll])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const getContentPreview = (
    report: NonNullable<typeof allReports>[number],
  ) => {
    if (report.type === "user" && report.reportedUser) {
      return `@${report.reportedUser.username || report.reportedUser.name}`
    }
    if (report.type === "post" && report.reportedPost) {
      return (
        report.reportedPost.content?.slice(0, 60) +
          (report.reportedPost.content?.length > 60 ? "..." : "") ||
        "Post sans texte"
      )
    }
    if (report.type === "comment" && report.reportedComment) {
      return (
        report.reportedComment.content?.slice(0, 60) +
          (report.reportedComment.content?.length > 60 ? "..." : "") ||
        "Commentaire"
      )
    }
    return "Contenu supprimé"
  }

  const isLoading = !allReports || !reportsStats

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 space-y-4 p-4">
        {/* Stats Summary - Simplified to 2 stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="En attente"
            value={reportsStats?.pending ?? 0}
            icon={Flag}
            color="amber"
            isLoading={isLoading}
          />
          <StatCard
            label="Traités"
            value={
              (reportsStats?.reviewing ?? 0) +
              (reportsStats?.resolved ?? 0) +
              (reportsStats?.rejected ?? 0)
            }
            icon={ShieldAlert}
            color="emerald"
            isLoading={isLoading}
          />
        </div>

        {/* Urgent Alert */}
        {urgentCount > 0 && (
          <Alert className="border-red-500/30 bg-red-500/5">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 dark:text-red-400">
              <span className="font-semibold">{urgentCount}</span>{" "}
              signalement(s) urgent(s) en attente (harcèlement, violence,
              discours de haine)
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <SuperuserFiltersBar filters={filterDefinitions} />

        {/* Table */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : filteredReports.length === 0 ? (
              <EmptyState />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-25">Type</TableHead>
                    <TableHead className="w-35">Motif</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Signalé par
                    </TableHead>
                    <TableHead>Contenu</TableHead>
                    <TableHead className="w-27.5">Statut</TableHead>
                    <TableHead className="hidden w-25 md:table-cell">
                      Date
                    </TableHead>
                    <TableHead className="w-12.5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report, idx) => {
                    const status =
                      statusConfig[
                        report.status as keyof typeof statusConfig
                      ] ?? statusConfig.pending
                    const type =
                      typeConfig[report.type as keyof typeof typeConfig] ??
                      typeConfig.user
                    const TypeIcon = type.icon
                    const isUrgent =
                      report.status === "pending" &&
                      ["harassment", "violence", "hate_speech"].includes(
                        report.reason,
                      )

                    return (
                      <TableRow
                        key={report._id}
                        className={cn(
                          "group cursor-pointer transition-colors",
                          isUrgent && "bg-red-500/5 hover:bg-red-500/10",
                        )}
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        <TableCell>
                          <Link
                            href={`/superuser/reports/${report._id}`}
                            className="flex items-center"
                          >
                            <Badge
                              variant="outline"
                              className={cn(
                                "gap-1 font-medium",
                                type.className,
                              )}
                            >
                              <TypeIcon className="h-3 w-3" />
                              <span className="hidden sm:inline">
                                {type.label}
                              </span>
                            </Badge>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/superuser/reports/${report._id}`}>
                            <div className="flex items-center gap-1.5">
                              {isUrgent && (
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                              )}
                              <span className="max-w-30 truncate text-sm font-medium">
                                {reasonLabels[report.reason] || report.reason}
                              </span>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Link
                            href={`/superuser/reports/${report._id}`}
                            className="flex items-center gap-2"
                          >
                            <Avatar className="h-7 w-7 border">
                              <AvatarImage src={report.reporter?.image} />
                              <AvatarFallback className="text-[10px] font-medium">
                                {report.reporter?.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground max-w-25 truncate text-sm">
                              @{report.reporter?.username || "inconnu"}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/superuser/reports/${report._id}`}>
                            <p className="text-muted-foreground line-clamp-1 max-w-50 text-sm">
                              {getContentPreview(report)}
                            </p>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("font-medium", status.className)}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(report.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/superuser/reports/${report._id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Results count */}
        {!isLoading && filteredReports.length > 0 && (
          <p className="text-muted-foreground text-center text-xs">
            {filteredReports.length} résultat(s)
          </p>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: "amber" | "sky" | "emerald" | "rose"
  isLoading?: boolean
}) {
  const colorClasses = {
    amber: "text-amber-500",
    sky: "text-sky-500",
    emerald: "text-emerald-500",
    rose: "text-rose-500",
  }

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <div className={cn("text-muted-foreground", colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          {isLoading ? (
            <Skeleton className="h-6 w-8" />
          ) : (
            <p className="text-xl font-bold">{value}</p>
          )}
          <p className="text-muted-foreground text-xs">{label}</p>
        </div>
      </div>
    </Card>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="hidden h-7 w-7 rounded-full lg:block" />
          <div className="flex-1">
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-muted/50 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <Flag className="text-muted-foreground h-6 w-6" />
      </div>
      <h3 className="mb-1 font-medium">Aucun signalement</h3>
      <p className="text-muted-foreground text-sm">
        Aucun signalement ne correspond aux filtres sélectionnés.
      </p>
    </div>
  )
}
