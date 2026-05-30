"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts"
import { STAGE_LABELS, formatCurrency } from "@/lib/utils"

type Props = {
  monthlyOutput: { month: string; count: number; revenue: number }[]
  productionByStage: { stage: string; count: number }[]
}

const PIE_COLORS = ["#0070F2", "#0099E5", "#00B4CC", "#00C896", "#38A169", "#E76500", "#BB0000", "#6B7ABA"]

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="border border-border bg-card px-3 py-2 shadow text-[11px] rounded">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">Units: <span className="font-semibold text-foreground">{payload[0]?.value}</span></p>
    </div>
  )
}

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="border border-border bg-card px-3 py-2 shadow text-[11px] rounded">
      <p className="font-semibold text-foreground">{STAGE_LABELS[item.payload.stage] ?? item.name}</p>
      <p className="text-muted-foreground">Count: <span className="font-semibold text-foreground">{item.value}</span></p>
    </div>
  )
}

export function ProductionChart({ monthlyOutput, productionByStage }: Props) {
  const stageData = productionByStage
    .filter((s) => s.count > 0)
    .map((s) => ({ ...s, name: STAGE_LABELS[s.stage] ?? s.stage }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* Bar chart */}
      <div className="lg:col-span-2 bg-card border border-border rounded p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-4">
          Monthly Production Output
        </p>
        {monthlyOutput.length === 0 ? (
          <div className="flex h-44 items-center justify-center text-[12px] text-muted-foreground">
            No production data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyOutput} margin={{ top: 0, right: 4, left: -16, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 14% 87%)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "hsl(210 8% 46%)", fontSize: 10 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(210 8% 46%)", fontSize: 10 }}
                axisLine={false} tickLine={false} width={24}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: "hsl(211 100% 47% / 0.06)" }} />
              <Bar dataKey="count" name="Units" fill="#0070F2" radius={[2, 2, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie chart */}
      <div className="bg-card border border-border rounded p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-4">
          Production by Stage
        </p>
        {stageData.length === 0 ? (
          <div className="flex h-44 items-center justify-center text-[12px] text-muted-foreground">
            No active production
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={stageData}
                cx="50%" cy="42%"
                innerRadius={42} outerRadius={68}
                paddingAngle={2}
                dataKey="count" nameKey="name"
                stroke="transparent"
              >
                {stageData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                formatter={(v) => <span style={{ color: "hsl(210 8% 46%)", fontSize: 10 }}>{v}</span>}
                iconSize={7} iconType="circle"
                wrapperStyle={{ paddingTop: 6 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
