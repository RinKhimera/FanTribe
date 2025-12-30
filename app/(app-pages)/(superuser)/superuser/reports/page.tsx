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
import { SuperuserFiltersBar, type FilterDefinition } from "@/components/superuser"
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
      { value: "reviewing", label: "En révision" },
      { value: "resolved", label: "Résolu" },
      { value: "rejected", label: "Rejeté" },
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
    label: "En révision",
    className: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  },
  resolved: {
    label: "Résolu",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  rejected: {
    label: "Rejeté",
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20",
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
  const reportsKey = allReports?.map((r) => `${r._id}-${r.status}`).join(",") ?? ""

  const { filteredReports, urgentCount } = useMemo(() => {
    if (!allReports) {
      return { filteredReports: [], urgentCount: 0 }
    }

    const statusFilters = getFilterAll("status")
    const typeFilters = getFilterAll("type")
    const reasonFilters = getFilterAll("reason")

    let filtered = [...allReports]

    if (statusFilters.length > 0) {
      filtered = filtered.filter((r) => statusFilters.includes(r.status))
    }

    if (typeFilters.length > 0) {
      filtered = filtered.filter((r) => typeFilters.includes(r.type))
    }

    if (reasonFilters.length > 0) {
      filtered = filtered.filter((r) => reasonFilters.includes(r.reason))
    }

    // Sort: pending first, then reviewing, then by date desc
    filtered.sort((a, b) => {
      const statusOrder = { pending: 0, reviewing: 1, resolved: 2, rejected: 3 }
      const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 4
      const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 4
      if (aOrder !== bOrder) return aOrder - bOrder
      return b.createdAt - a.createdAt
    })

    const urgentCount = allReports.filter(
      (r) => r.status === "pending" && ["harassment", "violence", "hate_speech"].includes(r.reason)
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

  const getContentPreview = (report: NonNullable<typeof allReports>[number]) => {
    if (report.type === "user" && report.reportedUser) {
      return `@${report.reportedUser.username || report.reportedUser.name}`
    }
    if (report.type === "post" && report.reportedPost) {
      return report.reportedPost.content?.slice(0, 60) + (report.reportedPost.content?.length > 60 ? "..." : "") || "Post sans texte"
    }
    if (report.type === "comment" && report.reportedComment) {
      return report.reportedComment.content?.slice(0, 60) + (report.reportedComment.content?.length > 60 ? "..." : "") || "Commentaire"
    }
    return "Contenu supprimé"
  }

  const isLoading = !allReports || !reportsStats

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 space-y-4 p-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="En attente"
            value={reportsStats?.pending ?? 0}
            icon={Flag}
            color="amber"
            isLoading={isLoading}
          />
          <StatCard
            label="En révision"
            value={reportsStats?.reviewing ?? 0}
            icon={ShieldAlert}
            color="sky"
            isLoading={isLoading}
          />
          <StatCard
            label="Résolus"
            value={reportsStats?.resolved ?? 0}
            icon={Flag}
            color="emerald"
            isLoading={isLoading}
          />
          <StatCard
            label="Rejetés"
            value={reportsStats?.rejected ?? 0}
            icon={Flag}
            color="rose"
            isLoading={isLoading}
          />
        </div>

        {/* Urgent Alert */}
        {urgentCount > 0 && (
          <Alert className="border-red-500/30 bg-red-500/5">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 dark:text-red-400">
              <span className="font-semibold">{urgentCount}</span>{" "}
              signalement(s) urgent(s) en attente (harcèlement, violence, discours de haine)
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
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="w-[140px]">Motif</TableHead>
                    <TableHead className="hidden lg:table-cell">Signalé par</TableHead>
                    <TableHead>Contenu</TableHead>
                    <TableHead className="w-[110px]">Statut</TableHead>
                    <TableHead className="hidden md:table-cell w-[100px]">Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report, idx) => {
                    const status = statusConfig[report.status as keyof typeof statusConfig] ?? statusConfig.pending
                    const type = typeConfig[report.type as keyof typeof typeConfig] ?? typeConfig.user
                    const TypeIcon = type.icon
                    const isUrgent = report.status === "pending" &&
                      ["harassment", "violence", "hate_speech"].includes(report.reason)

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
                              className={cn("gap-1 font-medium", type.className)}
                            >
                              <TypeIcon className="h-3 w-3" />
                              <span className="hidden sm:inline">{type.label}</span>
                            </Badge>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/superuser/reports/${report._id}`}>
                            <div className="flex items-center gap-1.5">
                              {isUrgent && (
                                <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                              )}
                              <span className="text-sm font-medium truncate max-w-[120px]">
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
                            <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                              @{report.reporter?.username || "inconnu"}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/superuser/reports/${report._id}`}>
                            <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
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
                          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
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
    <div className="p-4 space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-7 rounded-full hidden lg:block" />
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
