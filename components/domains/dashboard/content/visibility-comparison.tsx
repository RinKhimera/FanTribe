"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer } from "@/components/domains/dashboard/shared/chart-container"

interface VisibilityComparisonProps {
  publicPerformance: {
    count: number
    avgEngagement: number
  }
  subscribersOnlyPerformance: {
    count: number
    avgEngagement: number
  }
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-popover border-border rounded-lg border p-3 shadow-lg">
      <p className="text-muted-foreground mb-2 text-xs font-medium">
        {label}
      </p>
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          className="flex items-center justify-between gap-4 text-sm"
        >
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {entry.dataKey === "posts" ? "Posts" : "Moy. engagement"}
            </span>
          </div>
          <span className="font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export const VisibilityComparison = ({
  publicPerformance,
  subscribersOnlyPerformance,
}: VisibilityComparisonProps) => {
  const hasData =
    publicPerformance.count > 0 || subscribersOnlyPerformance.count > 0

  const data = [
    {
      name: "Public",
      posts: publicPerformance.count,
      engagement: publicPerformance.avgEngagement,
    },
    {
      name: "Abonnés",
      posts: subscribersOnlyPerformance.count,
      engagement: subscribersOnlyPerformance.avgEngagement,
    },
  ]

  return (
    <ChartContainer
      title="Public vs Abonnés"
      subtitle="Comparaison de performance"
      isEmpty={!hasData}
      emptyMessage="Publiez des posts pour comparer"
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border/40"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            className="text-muted-foreground"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            className="text-muted-foreground"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar
            dataKey="posts"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            barSize={28}
          />
          <Bar
            dataKey="engagement"
            fill="#a855f7"
            radius={[4, 4, 0, 0]}
            barSize={28}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center gap-6 pt-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="h-2.5 w-2.5 rounded bg-blue-500" />
          <span className="text-muted-foreground">Nombre de posts</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="h-2.5 w-2.5 rounded bg-purple-500" />
          <span className="text-muted-foreground">Moy. engagement</span>
        </div>
      </div>
    </ChartContainer>
  )
}
