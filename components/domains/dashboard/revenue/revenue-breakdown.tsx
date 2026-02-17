"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { ChartContainer } from "@/components/domains/dashboard/shared/chart-container"

interface RevenueBreakdownProps {
  subscriptionRevenue: number
  tipRevenue: number
}

const COLORS = ["#3b82f6", "#f59e0b"]

const formatAmount = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>
}) => {
  if (!active || !payload?.length) return null

  const entry = payload[0]
  return (
    <div className="bg-popover border-border rounded-lg border p-3 shadow-lg">
      <div className="flex items-center gap-2 text-sm">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: entry.payload.fill }}
        />
        <span className="text-muted-foreground">{entry.name}</span>
        <span className="font-semibold">
          {formatAmount(entry.value)} XAF
        </span>
      </div>
    </div>
  )
}

export const RevenueBreakdown = ({
  subscriptionRevenue,
  tipRevenue,
}: RevenueBreakdownProps) => {
  const total = subscriptionRevenue + tipRevenue
  const hasData = total > 0

  const data = [
    { name: "Abonnements", value: subscriptionRevenue },
    { name: "Pourboires", value: tipRevenue },
  ]

  const subsPercent =
    hasData ? Math.round((subscriptionRevenue / total) * 100) : 0
  const tipsPercent = hasData ? 100 - subsPercent : 0

  return (
    <ChartContainer
      title="Répartition"
      subtitle="Abonnements vs Pourboires"
      isEmpty={!hasData}
      emptyMessage="Pas encore de revenus"
    >
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex gap-6 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">
              Abonnements ({subsPercent}%)
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">
              Pourboires ({tipsPercent}%)
            </span>
          </div>
        </div>
      </div>
    </ChartContainer>
  )
}
