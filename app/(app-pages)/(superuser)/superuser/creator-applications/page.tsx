"use client"

import { useQuery } from "convex/react"
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  FileText,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  UserX,
  Users,
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
import { detectRiskFactors } from "@/lib/validators/detect-risk-factors"

const filterDefinitions: FilterDefinition[] = [
  {
    key: "status",
    label: "Statut",
    type: "multi-select",
    options: [
      { value: "pending", label: "En attente" },
      { value: "approved", label: "Approuvé" },
      { value: "rejected", label: "Rejeté" },
    ],
  },
  {
    key: "risk",
    label: "Risque",
    type: "select",
    options: [
      { value: "with-risk", label: "Avec risque" },
      { value: "no-risk", label: "Sans risque" },
    ],
  },
]

const statusConfig = {
  pending: {
    label: "En attente",
    variant: "secondary" as const,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  approved: {
    label: "Approuvé",
    variant: "default" as const,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  rejected: {
    label: "Rejeté",
    variant: "destructive" as const,
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
}

export default function CreatorApplicationsPage() {
  const { currentUser } = useCurrentUser()
  const { getFilterAll, getFilter } = useSuperuserFilters()

  const allApplications = useQuery(
    api.creatorApplications.getAllApplications,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  // Create stable dependency key from applications data
  const applicationsKey =
    allApplications?.map((a) => `${a._id}-${a.status}`).join(",") ?? ""

  // Process and filter applications
  const { filteredApplications, stats, riskyPendingCount } = useMemo(() => {
    if (!allApplications) {
      return { filteredApplications: [], stats: null, riskyPendingCount: 0 }
    }

    // Add risk info to each application
    const applicationsWithRisk = allApplications.map((app) => ({
      ...app,
      riskFactors: detectRiskFactors(app, allApplications),
    }))

    // Calculate stats
    const stats = {
      total: allApplications.length,
      pending: allApplications.filter((a) => a.status === "pending").length,
      approved: allApplications.filter((a) => a.status === "approved").length,
      rejected: allApplications.filter((a) => a.status === "rejected").length,
    }

    const riskyPendingCount = applicationsWithRisk.filter(
      (a) => a.status === "pending" && a.riskFactors.length > 0,
    ).length

    // Apply filters
    const statusFilters = getFilterAll("status")
    const riskFilter = getFilter("risk")

    let filtered = applicationsWithRisk

    if (statusFilters.length > 0) {
      filtered = filtered.filter((app) => statusFilters.includes(app.status))
    }

    if (riskFilter === "with-risk") {
      filtered = filtered.filter((app) => app.riskFactors.length > 0)
    } else if (riskFilter === "no-risk") {
      filtered = filtered.filter((app) => app.riskFactors.length === 0)
    }

    // Sort: pending first, then by date desc
    filtered.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1
      if (a.status !== "pending" && b.status === "pending") return 1
      return b.submittedAt - a.submittedAt
    })

    return { filteredApplications: filtered, stats, riskyPendingCount }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationsKey, getFilterAll, getFilter])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const isLoading = !allApplications

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 space-y-4 p-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Total"
            value={stats?.total ?? 0}
            icon={Users}
            isLoading={isLoading}
          />
          <StatCard
            label="En attente"
            value={stats?.pending ?? 0}
            icon={FileText}
            color="amber"
            isLoading={isLoading}
          />
          <StatCard
            label="Approuvées"
            value={stats?.approved ?? 0}
            icon={UserCheck}
            color="emerald"
            isLoading={isLoading}
          />
          <StatCard
            label="Rejetées"
            value={stats?.rejected ?? 0}
            icon={UserX}
            color="rose"
            isLoading={isLoading}
          />
        </div>

        {/* Risk Alert */}
        {riskyPendingCount > 0 && (
          <Alert className="border-orange-500/30 bg-orange-500/5">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-orange-700 dark:text-orange-400">
              <span className="font-semibold">{riskyPendingCount}</span>{" "}
              candidature(s) en attente présente(nt) des facteurs de risque
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
            ) : filteredApplications.length === 0 ? (
              <EmptyState />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-75">Candidat</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Risque</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Docs</TableHead>
                    <TableHead className="w-12.5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application, idx) => {
                    const status =
                      statusConfig[application.status] ?? statusConfig.pending
                    const hasRisk = application.riskFactors.length > 0

                    return (
                      <TableRow
                        key={application._id}
                        className={cn(
                          "group cursor-pointer transition-colors",
                          hasRisk &&
                            application.status === "pending" &&
                            "bg-orange-500/5 hover:bg-orange-500/10",
                        )}
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        <TableCell>
                          <Link
                            href={`/superuser/creator-applications/${application._id}`}
                            className="flex items-center gap-3"
                          >
                            <Avatar className="h-9 w-9 border">
                              <AvatarImage src={application.user?.image} />
                              <AvatarFallback className="text-xs font-medium">
                                {application.personalInfo.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium">
                                  {application.personalInfo.fullName}
                                </p>
                                {/* Badge tentative multiple */}
                                {(application.attemptNumber ?? 1) > 1 && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "shrink-0 text-[10px] font-semibold",
                                      (application.attemptNumber ?? 1) >= 3
                                        ? "border-red-500/30 bg-red-500/10 text-red-600"
                                        : "border-orange-500/30 bg-orange-500/10 text-orange-600"
                                    )}
                                  >
                                    <RefreshCw className="mr-1 h-2.5 w-2.5" aria-hidden="true" />
                                    Tentative #{application.attemptNumber}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground truncate text-xs">
                                @{application.user?.username} •{" "}
                                {application.user?.email}
                              </p>
                            </div>
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
                        <TableCell>
                          {hasRisk ? (
                            <Badge
                              variant="outline"
                              className="border-orange-500/30 bg-orange-500/10 font-medium text-orange-600"
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />
                              {application.riskFactors.length}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                            {formatDate(application.submittedAt)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="text-muted-foreground flex items-center gap-1 text-sm">
                            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                            {application.identityDocuments.length}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/superuser/creator-applications/${application._id}`}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                              aria-label="Voir la candidature"
                            >
                              <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
        {!isLoading && filteredApplications.length > 0 && (
          <p className="text-muted-foreground text-center text-xs">
            {filteredApplications.length} résultat(s)
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
  color?: "amber" | "emerald" | "rose"
  isLoading?: boolean
}) {
  const colorClasses = {
    amber: "text-amber-500",
    emerald: "text-emerald-500",
    rose: "text-rose-500",
  }

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <div
          className={cn("text-muted-foreground", color && colorClasses[color])}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
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
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-muted/50 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <FileText className="text-muted-foreground h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mb-1 font-medium">Aucune candidature</h3>
      <p className="text-muted-foreground text-sm">
        Aucune candidature ne correspond aux filtres sélectionnés.
      </p>
    </div>
  )
}
