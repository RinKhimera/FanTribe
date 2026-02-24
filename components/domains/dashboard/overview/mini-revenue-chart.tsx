"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer } from "@/components/domains/dashboard/shared/chart-container"

interface MiniRevenueChartProps {
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
              {entry.dataKey === "subscriptionRevenue"
                ? "Abonnements"
                : "Pourboires"}
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

export const MiniRevenueChart = ({ data }: MiniRevenueChartProps) => {
  const hasData = data.trends.some((t) => t.total > 0)

  return (
    <ChartContainer
      title="Évolution des revenus"
      subtitle="6 derniers mois — abonnements et pourboires"
      isEmpty={!hasData}
      emptyMessage="Pas encore de revenus à afficher"
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart
          data={data.trends}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradientSubs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientTips" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            className="text-muted-foreground"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Area
            type="monotone"
            dataKey="subscriptionRevenue"
            stackId="1"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#gradientSubs)"
          />
          <Area
            type="monotone"
            dataKey="tipRevenue"
            stackId="1"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#gradientTips)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
