"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer } from "@/components/domains/dashboard/shared/chart-container"

interface SubscriberGrowthChartProps {
  data: {
    growth: {
      month: string
      newSubscribers: number
      activeSubscribers: number
    }[]
  }
}

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan",
  "02": "Fév",
  "03": "Mar",
  "04": "Avr",
  "05": "Mai",
  "06": "Juin",
  "07": "Juil",
  "08": "Aoû",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Déc",
}

const formatMonthLabel = (month: string) => {
  const parts = month.split("-")
  return MONTH_LABELS[parts[1]] ?? parts[1]
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

  const labelMap: Record<string, string> = {
    newSubscribers: "Nouveaux",
    activeSubscribers: "Actifs",
  }

  return (
    <div className="bg-popover border-border rounded-lg border p-3 shadow-lg">
      <p className="text-muted-foreground mb-2 text-xs font-medium">
        {label ? formatMonthLabel(label) : ""}
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
              {labelMap[entry.dataKey] ?? entry.dataKey}
            </span>
          </div>
          <span className="font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export const SubscriberGrowthChart = ({
  data,
}: SubscriberGrowthChartProps) => {
  const hasData = data.growth.some(
    (g) => g.newSubscribers > 0 || g.activeSubscribers > 0,
  )

  return (
    <ChartContainer
      title="Croissance des abonnés"
      subtitle="6 derniers mois"
      isEmpty={!hasData}
      emptyMessage="Pas encore de données de croissance"
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data.growth}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border/40"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonthLabel}
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
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Line
            type="monotone"
            dataKey="activeSubscribers"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 2 }}
            activeDot={{ r: 5, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="newSubscribers"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 2 }}
            activeDot={{ r: 5, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center gap-6 pt-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Actifs</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Nouveaux</span>
        </div>
      </div>
    </ChartContainer>
  )
}
