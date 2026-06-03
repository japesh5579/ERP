"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Search, ClipboardList, Package, User, ArrowDownCircle, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CATEGORY_LABELS, formatDateTime } from "@/lib/utils"

type UsageLog = {
  id: string
  quantity: number
  usedAt: string
  notes: string | null
  usedBy: string | null
  material: { id: string; name: string; unit: string; category: string }
  user: { id: string; name: string; role: string } | null
}

export default function UsageHistoryPage() {
  const [logs, setLogs] = useState<UsageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/usage-logs?take=100")
      if (res.status === 403) { toast.error("Admin access required"); return }
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch { toast.error("Failed to load usage history") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const filtered = logs.filter((log) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      log.material.name.toLowerCase().includes(q) ||
      (log.user?.name ?? log.usedBy ?? "").toLowerCase().includes(q) ||
      (log.notes ?? "").toLowerCase().includes(q)
    )
  })

  // Group by date for cleaner display
  const grouped: Record<string, UsageLog[]> = {}
  filtered.forEach((log) => {
    const date = new Date(log.usedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(log)
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Usage History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Track which worker used which material and when</p>
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-border p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-xs text-muted-foreground">Total Entries</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{logs.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground">Active Workers</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {new Set(logs.map((l) => l.user?.id ?? l.usedBy).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by material, worker, or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 bg-white border-border"
        />
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
          <ClipboardList className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">{search ? "No results found" : "No usage recorded yet"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, dateLogs]) => (
            <div key={date}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 px-1">{date}</p>
              <div className="space-y-2">
                {dateLogs.map((log) => {
                  const workerName = log.user?.name ?? log.usedBy ?? "Unknown"
                  const workerInitials = workerName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
                  return (
                    <div key={log.id} className="bg-white rounded-2xl border border-border p-3.5 flex items-start gap-3 animate-fade-in">
                      {/* Worker avatar */}
                      <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                        {workerInitials}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{log.material.name}</p>
                            <p className="text-xs text-muted-foreground">
                              by <span className="font-medium text-foreground">{workerName}</span>
                              {log.user?.role === "ADMIN" && <span className="ml-1 text-blue-600">(Admin)</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-red-600 font-bold text-sm tabular-nums">−{log.quantity}</span>
                            <span className="text-xs text-muted-foreground">{log.material.unit}</span>
                          </div>
                        </div>
                        {log.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{log.notes}</p>
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
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
