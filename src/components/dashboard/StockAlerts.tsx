"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { CATEGORY_LABELS } from "@/lib/utils"
import { cn } from "@/lib/utils"

type StockAlertItem = {
  id: string
  name: string
  currentStock: number
  minimumStock: number
  unit: string
  category: string
}

export function StockAlerts({ alerts }: { alerts: StockAlertItem[] }) {
  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/60">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Stock Alerts
          </span>
          {alerts.length > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
              {alerts.length}
            </span>
          )}
        </div>
        <Link href="/inventory" className="text-[11px] text-blue-600 hover:underline">
          View All →
        </Link>
      </div>

      {/* Table */}
      {alerts.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-[12px] text-muted-foreground">
          All stock levels are healthy
        </div>
      ) : (
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wide">Material</th>
              <th className="text-right px-4 py-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wide">In Stock</th>
              <th className="text-right px-4 py-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wide">Min.</th>
              <th className="text-center px-4 py-2 font-semibold text-muted-foreground text-[10px] uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => {
              const critical = a.currentStock === 0 || a.currentStock < a.minimumStock * 0.5
              return (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-orange-50/50">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-foreground leading-tight">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[a.category] ?? a.category}</p>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={cn("font-bold tabular", critical ? "text-red-600" : "text-orange-500")}>
                      {a.currentStock}
                    </span>
                    <span className="text-muted-foreground ml-0.5">{a.unit}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground tabular">
                    {a.minimumStock} {a.unit}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn(
                      "inline-block px-2 py-0.5 rounded text-[10px] font-semibold",
                      critical
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                    )}>
                      {critical ? "Critical" : "Low"}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
