"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { ClipboardList, ArrowDownCircle, Package, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CATEGORY_LABELS } from "@/lib/utils"

type UsageLog = {
  id: string
  quantity: number
  usedAt: string
  notes: string | null
  material: { id: string; name: string; unit: string; category: string }
  user: { id: string; name: string } | null
}

export default function MyUsagePage() {
  const [logs, setLogs] = useState<UsageLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/usage-logs?take=50")
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch { toast.error("Failed to load activity") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // Group by date
  const grouped: Record<string, UsageLog[]> = {}
  logs.forEach((log) => {
    const date = new Date(log.usedAt).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(log)
  })

  // Total items used today
  const today = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })
  const todayLogs = grouped[today] ?? []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">My Activity</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Your material usage history</p>
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Today summary */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
        <p className="text-sm font-medium text-blue-100">Today's Usage</p>
        <div className="flex items-end justify-between mt-2">
          <div>
            <p className="text-4xl font-bold">{todayLogs.length}</p>
            <p className="text-sm text-blue-200 mt-0.5">item{todayLogs.length !== 1 ? "s" : ""} recorded</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <ArrowDownCircle className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">No activity yet</p>
          <p className="text-sm mt-1">Go to Inventory to record your first usage</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, dateLogs]) => (
            <div key={date}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 px-1">{date}</p>
              <div className="space-y-2">
                {dateLogs.map((log) => (
                  <div key={log.id} className="bg-white rounded-2xl border border-border p-3.5 flex items-start gap-3 animate-fade-in">
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Package className="w-4.5 h-4.5 text-red-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground text-sm truncate">{log.material.name}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-red-600 font-bold tabular-nums">−{log.quantity}</span>
                          <span className="text-xs text-muted-foreground">{log.material.unit}</span>
                        </div>
                      </div>
                      {log.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">{log.notes}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] py-0">
                          {CATEGORY_LABELS[log.material.category] ?? log.material.category}
                        </Badge>
                        <p className="text-[11px] text-muted-foreground/70">
                          {new Date(log.usedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
