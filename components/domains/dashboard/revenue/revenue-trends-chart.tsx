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

interface RevenueTrendsChartProps {
  data: {
    trends: {
      month: string
      subscriptionRevenue: number
      tipRevenue: number
      total: number
    }[]
    currency: string
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

const formatAmount = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

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
    subscriptionRevenue: "Abonnements",
    tipRevenue: "Pourboires",
    total: "Total",
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
          <span className="font-semibold">
            {formatAmount(entry.value)} XAF
          </span>
        </div>
      ))}
    </div>
  )
}

export const RevenueTrendsChart = ({ data }: RevenueTrendsChartProps) => {
  const hasData = data.trends.some((t) => t.total > 0)

  return (
    <ChartContainer
      title="Tendances des revenus"
      subtitle="12 derniers mois"
      isEmpty={!hasData}
      emptyMessage="Pas encore de données de revenus"
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={data.trends}
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
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) =>
              v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
            }
            className="text-muted-foreground"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Line
            type="monotone"
            dataKey="subscriptionRevenue"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="tipRevenue"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#a855f7"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
