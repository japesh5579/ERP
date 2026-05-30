"use client"

import {
  Package, AlertTriangle, Factory, CheckCircle2,
  ClipboardCheck, Truck, TrendingUp, Clock,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

type Props = {
  totalMaterials: number
  lowStockCount: number
  activeProductions: number
  completedThisMonth: number
  pendingQC: number
  dispatchesToday: number
  totalRevenue: number
  pendingRevenue?: number
  stockAlertCount?: number
}

export function StatsCards({
  totalMaterials, lowStockCount, activeProductions, completedThisMonth,
  pendingQC, dispatchesToday, totalRevenue, pendingRevenue = 0, stockAlertCount = 0,
}: Props) {
  const cards = [
    {
      label: "Total Materials",
      value: totalMaterials,
      sub: lowStockCount > 0 ? `${lowStockCount} low stock` : "All stocked",
      icon: Package,
      alert: lowStockCount > 0,
    },
    {
      label: "Active Production",
      value: activeProductions,
      sub: "In progress",
      icon: Factory,
      alert: false,
    },
    {
      label: "Completed (Month)",
      value: completedThisMonth,
      sub: "This month",
      icon: CheckCircle2,
      alert: false,
    },
    {
      label: "Pending QC",
      value: pendingQC,
      sub: pendingQC > 0 ? "Awaiting approval" : "Queue clear",
      icon: ClipboardCheck,
      alert: pendingQC > 0,
    },
    {
      label: "Dispatched Today",
      value: dispatchesToday,
      sub: "Shipments",
      icon: Truck,
      alert: false,
    },
    {
      label: "Stock Alerts",
      value: stockAlertCount,
      sub: "Below minimum",
      icon: AlertTriangle,
      alert: stockAlertCount > 0,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      sub: "Collected",
      icon: TrendingUp,
      alert: false,
      currency: true,
    },
    {
      label: "Outstanding",
      value: formatCurrency(pendingRevenue),
      sub: "Pending invoices",
      icon: Clock,
      alert: pendingRevenue > 0,
      currency: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="bg-card border border-border rounded p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {card.label}
              </p>
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  card.alert ? "text-orange-500" : "text-muted-foreground/50"
                )}
                strokeWidth={1.5}
              />
            </div>

            <p className={cn(
              "text-2xl font-bold tabular leading-none",
              card.alert ? "text-orange-600" : "text-foreground"
            )}>
              {card.value}
            </p>

            <p className={cn(
              "text-[11px] leading-none",
              card.alert ? "text-orange-500" : "text-muted-foreground"
            )}>
              {card.sub}
            </p>
          </div>
        )
      })}
    </div>
  )
}
