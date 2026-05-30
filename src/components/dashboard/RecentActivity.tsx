"use client"

import { Factory, Package, ClipboardCheck, Truck, Activity } from "lucide-react"

type ActivityItem = {
  id: string
  type: string
  message: string
  time: string
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  production: { icon: Factory,       label: "Production", color: "text-blue-600" },
  inventory:  { icon: Package,       label: "Inventory",  color: "text-emerald-600" },
  quality:    { icon: ClipboardCheck, label: "Quality",   color: "text-orange-500" },
  dispatch:   { icon: Truck,         label: "Dispatch",   color: "text-violet-600" },
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  })
}

export function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/60">
        <Activity className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Recent Activity
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-[12px] text-muted-foreground">
          No recent activity
        </div>
      ) : (
        <div className="divide-y divide-border">
          {activities.map((item) => {
            const cfg = TYPE_CONFIG[item.type] ?? { icon: Activity, label: item.type, color: "text-muted-foreground" }
            const Icon = cfg.icon
            return (
              <div key={item.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-blue-50/40 transition-colors">
                <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${cfg.color}`} strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-foreground leading-snug">{item.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(item.time)}</p>
                </div>
                <span className="text-[9px] font-semibold uppercase text-muted-foreground/60 mt-0.5 flex-shrink-0">
                  {cfg.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
