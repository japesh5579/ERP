"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import {
  Plus, Search, Package, Pencil, Trash2, MinusCircle, MoreHorizontal,
  History, TrendingUp, AlertTriangle, ArrowDownCircle, ArrowUpCircle,
  X, PlusCircle, Mic, MicOff, Bot, Send, ChevronDown,
} from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatCurrency, formatDateTime, CATEGORY_LABELS } from "@/lib/utils"
import type { RawMaterialWithVendor, Vendor } from "@/types"

const CATEGORIES = Object.entries(CATEGORY_LABELS)
const LOW_STOCK_THRESHOLD = 10

type StockStatus = "critical" | "low" | "ok"

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

function parseMaterialName(name: string) {
  const match = name.match(/^(.+?)\s*\((.+?)\)(.*)$/)
  if (!match) return { base: name, variant: null }
  return { base: match[1].trim(), variant: match[2].trim() }
}

function getStockStatus(current: number, minimum: number): StockStatus {
  if (current < minimum) return "critical"
  if (current < minimum * 1.25) return "low"
  return "ok"
}

function StockBadge({ current, minimum }: { current: number; minimum: number }) {
  const status = getStockStatus(current, minimum)
  if (status === "critical") return <Badge variant="destructive">Critical</Badge>
  if (status === "low") return <Badge variant="warning">Low</Badge>
  return <Badge variant="success">OK</Badge>
}

type Movement = {
  id: string
  type: "IN" | "OUT"
  quantity: number
  date: string
  reference: string
  notes: string | null
  balanceAfter: number
}

const EMPTY_FORM = {
  name: "", category: "", currentStock: "", unit: "",
  minimumStock: "10", unitPrice: "", location: "", description: "", vendorId: "",
}
const EMPTY_USE = { quantity: "", notes: "", transformerId: "" }
const EMPTY_RESTOCK = { quantity: "", notes: "" }

export default function InventoryPage() {
  const [materials, setMaterials] = useState<RawMaterialWithVendor[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

  // Dialogs
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [useOpen, setUseOpen] = useState(false)
  const [restockOpen, setRestockOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterialWithVendor | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)
  const [alertShown, setAlertShown] = useState(false)

  const [form, setForm] = useState(EMPTY_FORM)
  const [useForm, setUseForm] = useState(EMPTY_USE)
  const [restockForm, setRestockForm] = useState(EMPTY_RESTOCK)
  const [submitting, setSubmitting] = useState(false)

  // AI Chat
  type ChatMsg = { role: "user" | "ai"; text: string }
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role: "ai", text: "Hi! I'm your inventory assistant. Try: \"add 50 copper coil\", \"use 10 transformer oil\", or \"search copper\"." },
  ])
  const [listening, setListening] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (categoryFilter && categoryFilter !== "ALL") params.set("category", categoryFilter)
      const res = await fetch(`/api/inventory?${params}`)
      const data = await res.json()
      const list: RawMaterialWithVendor[] = Array.isArray(data) ? data : []
      setMaterials(list)

      // Show low-stock alert popup once on first load
      if (!alertShown) {
        const criticalItems = list.filter(
          (m) => m.currentStock < LOW_STOCK_THRESHOLD || m.currentStock < m.minimumStock
        )
        if (criticalItems.length > 0) {
          setAlertOpen(true)
          setAlertShown(true)
        }
      }
    } catch {
      toast.error("Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, alertShown])

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/vendors")
      const data = await res.json()
      setVendors(Array.isArray(data) ? data : [])
    } catch {}
  }

  useEffect(() => { fetchMaterials(); fetchVendors() }, [])
  useEffect(() => { fetchMaterials() }, [search, categoryFilter])

  const openHistory = async (m: RawMaterialWithVendor) => {
    setSelectedMaterial(m)
    setHistoryOpen(true)
    setMovementsLoading(true)
    setMovements([])
    try {
      const res = await fetch(`/api/inventory/${m.id}/movements`)
      const data = await res.json()
      setMovements(data.movements ?? [])
    } catch {
      toast.error("Failed to load history")
    } finally {
      setMovementsLoading(false)
    }
  }

  const openEdit = (m: RawMaterialWithVendor) => {
    setSelectedMaterial(m)
    setForm({
      name: m.name, category: m.category,
      currentStock: String(m.currentStock), unit: m.unit,
      minimumStock: String(m.minimumStock), unitPrice: String(m.unitPrice ?? ""),
      location: m.location ?? "", description: m.description ?? "",
      vendorId: m.vendorId ?? "",
    })
    setEditOpen(true)
  }

  const openUse = (m: RawMaterialWithVendor) => {
    setSelectedMaterial(m); setUseForm(EMPTY_USE); setUseOpen(true)
  }

  const openRestock = (m: RawMaterialWithVendor) => {
    setSelectedMaterial(m); setRestockForm(EMPTY_RESTOCK); setRestockOpen(true)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const res = await fetch("/api/inventory", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          currentStock: Number(form.currentStock), minimumStock: Number(form.minimumStock),
          unitPrice: Number(form.unitPrice), vendorId: form.vendorId || null,
        }),
      })
      if (res.ok) { toast.success("Material added"); setAddOpen(false); setForm(EMPTY_FORM); fetchMaterials() }
      else { const e = await res.json(); toast.error(e.error ?? "Failed") }
    } catch { toast.error("Failed to add material") }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedMaterial) return; setSubmitting(true)
    try {
      const res = await fetch(`/api/inventory/${selectedMaterial.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          currentStock: Number(form.currentStock), minimumStock: Number(form.minimumStock),
          unitPrice: Number(form.unitPrice), vendorId: form.vendorId || null,
        }),
      })
      if (res.ok) { toast.success("Material updated"); setEditOpen(false); fetchMaterials() }
      else { toast.error("Failed to update") }
    } catch { toast.error("Failed to update material") }
    finally { setSubmitting(false) }
  }

  const handleUse = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedMaterial) return; setSubmitting(true)
    try {
      const res = await fetch(`/api/inventory/${selectedMaterial.id}/use`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(useForm.quantity),
          notes: useForm.notes || null,
          transformerId: useForm.transformerId || null,
        }),
      })
      if (res.ok) {
        const remaining = selectedMaterial.currentStock - Number(useForm.quantity)
        setUseOpen(false)
        fetchMaterials()

        if (remaining < LOW_STOCK_THRESHOLD) {
          // Critical popup alert
          toast.warning(
            `⚠ Low stock: "${selectedMaterial.name}" now has only ${remaining} ${selectedMaterial.unit} left!`,
            { duration: 8000 }
          )
          setAlertOpen(true)
        } else {
          toast.success(`Recorded: −${useForm.quantity} ${selectedMaterial.unit} of ${selectedMaterial.name}`)
        }
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to record usage")
      }
    } catch { toast.error("Failed to record usage") }
    finally { setSubmitting(false) }
  }

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedMaterial) return; setSubmitting(true)
    try {
      const res = await fetch(`/api/inventory/${selectedMaterial.id}/restock`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: Number(restockForm.quantity), notes: restockForm.notes || null }),
      })
      if (res.ok) {
        toast.success(`Added +${restockForm.quantity} ${selectedMaterial.unit} to ${selectedMaterial.name}`)
        setRestockOpen(false)
        fetchMaterials()
      } else {
        const err = await res.json(); toast.error(err.error ?? "Failed")
      }
    } catch { toast.error("Failed to add stock") }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!selectedMaterial) return; setSubmitting(true)
    try {
      const res = await fetch(`/api/inventory/${selectedMaterial.id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Material deleted"); setDeleteOpen(false); fetchMaterials() }
      else { toast.error("Failed to delete") }
    } catch { toast.error("Failed to delete material") }
    finally { setSubmitting(false) }
  }

  // ── Chat command engine ─────────────────────────────────────────────────────
  const pushAI = (text: string) => {
    setChatMsgs((prev) => [...prev, { role: "ai", text }])
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
  }

  const runCommand = useCallback((raw: string) => {
    const text = raw.trim().toLowerCase()
    if (!text) return

    setChatMsgs((prev) => [...prev, { role: "user", text: raw }])
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)

    const findMaterial = (hint: string) => {
      const h = hint.toLowerCase().trim()
      const hWords = h.split(/\s+/)

      // 1. Exact match
      const exact = materials.find((m) => m.name.toLowerCase() === h)
      if (exact) return exact

      // 2. Name starts with hint
      const starts = materials.find((m) => m.name.toLowerCase().startsWith(h))
      if (starts) return starts

      // 3. Name contains hint as substring
      const sub = materials.find((m) => m.name.toLowerCase().includes(h))
      if (sub) return sub

      // 4. All hint words appear somewhere in the name (handles "copper wire" → "Copper Winding Wire")
      const allWords = materials.find((m) => {
        const mLow = m.name.toLowerCase()
        return hWords.every((w) => mLow.includes(w))
      })
      if (allWords) return allWords

      // 5. Any hint word matches a name word with levenshtein ≤ 2 (handles typos like "japash"→"japesh")
      const maxDist = h.length <= 4 ? 1 : 2
      let bestMat: typeof materials[0] | null = null
      let bestDist = maxDist + 1
      for (const m of materials) {
        const nameWords = m.name.toLowerCase().split(/\s+/)
        for (const nw of nameWords) {
          for (const hw of hWords) {
            const d = levenshtein(hw, nw)
            if (d < bestDist) { bestDist = d; bestMat = m }
          }
        }
      }
      return bestMat
    }

    const addMatch =
      text.match(/^(?:add|restock|stock)\s+(\d+\.?\d*)\s*(?:\w+\s+)?(.+)$/) ??
      text.match(/^(?:add|restock|stock)\s+(.+)\s+(\d+\.?\d*)$/)

    const useMatch =
      text.match(/^(?:use|remove|take|consume|deduct)\s+(\d+\.?\d*)\s*(?:\w+\s+)?(.+)$/) ??
      text.match(/^(?:use|remove|take|consume|deduct)\s+(.+)\s+(\d+\.?\d*)$/)

    const delMatch = text.match(/^(?:delete|del)\s+([a-z\s]+)$/)
    const searchMatch = text.match(/^(?:search|find|show)\s+(.+)$/)

    if (addMatch) {
      const qty = addMatch[1]; const hint = addMatch[2]
      const mat = findMaterial(hint)
      if (!mat) { pushAI(`❌ No material matching "${hint}" found.`); return }
      setRestockForm({ quantity: qty, notes: `Via assistant: ${raw}` })
      setSelectedMaterial(mat); setRestockOpen(true)
      pushAI(`✅ Opening restock for "${mat.name}" — quantity ${qty}. Confirm in the dialog.`)
      return
    }

    if (useMatch) {
      const qty = useMatch[1]; const hint = useMatch[2]
      const mat = findMaterial(hint)
      if (!mat) { pushAI(`❌ No material matching "${hint}" found.`); return }
      setUseForm({ quantity: qty, notes: `Via assistant: ${raw}`, transformerId: "" })
      setSelectedMaterial(mat); setUseOpen(true)
      pushAI(`✅ Opening use dialog for "${mat.name}" — quantity ${qty}. Confirm in the dialog.`)
      return
    }

    if (delMatch) {
      const hint = delMatch[1].trim()
      const mat = findMaterial(hint)
      if (!mat) { pushAI(`❌ No material matching "${hint}" found.`); return }
      setSelectedMaterial(mat); setDeleteOpen(true)
      pushAI(`⚠️ Delete dialog opened for "${mat.name}". Please confirm.`)
      return
    }

    if (searchMatch) {
      const term = searchMatch[1].trim()
      setSearch(term)
      pushAI(`🔍 Filtering inventory for "${term}".`)
      return
    }

    pushAI(`I didn't understand that. Try:\n• "add 50 copper coil"\n• "use 10 transformer oil"\n• "search copper"\n• "delete bushings"`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materials])

  const sendChat = () => {
    const text = chatInput.trim()
    if (!text) return
    setChatInput("")
    runCommand(text)
  }

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) { toast.error("Voice not supported. Use Chrome or Edge."); return }
    if (listening) { setListening(false); return }
    const rec = new SR()
    rec.lang = "en-IN"; rec.interimResults = false
    rec.onresult = (e: any) => {
      const spoken = e.results[0][0].transcript
      setChatInput(spoken)
      runCommand(spoken)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => { setListening(false); toast.error("Voice error. Try again.") }
    rec.start(); setListening(true)
  }

  const criticalMaterials = materials.filter(
    (m) => m.currentStock < LOW_STOCK_THRESHOLD || m.currentStock < m.minimumStock
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Raw Material Inventory</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track stock levels, record usage, and manage restocking
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setAddOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />Add Material
        </Button>
      </div>

      {/* Low stock warning banner */}
      {criticalMaterials.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded border border-orange-200 bg-orange-50">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-orange-700">
              {criticalMaterials.length} item{criticalMaterials.length > 1 ? "s" : ""} below minimum stock
            </p>
            <p className="text-[11px] text-orange-600/80 mt-0.5">
              {criticalMaterials.map((m) => `${m.name} (${m.currentStock} ${m.unit})`).join(" · ")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-orange-700 hover:bg-orange-100 h-7 text-[11px]"
            onClick={() => setAlertOpen(true)}
          >
            View Details
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted"
              />
            </div>
            <Select value={categoryFilter || "ALL"} onValueChange={(v) => setCategoryFilter(v === "ALL" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {CATEGORIES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-[13px]">
            <Package className="w-5 h-5 mr-2 animate-pulse" /> Loading inventory...
          </div>
        ) : materials.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-[13px]">
            No materials found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60 border-border">
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground h-9">Material Name</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground h-9">Category</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground h-9 text-right">In Stock</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground h-9 text-right">Min. Stock</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground h-9">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground h-9">Vendor</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground h-9 text-right">Unit Price</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground h-9 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((m) => {
                const status = getStockStatus(m.currentStock, m.minimumStock)
                return (
                  <TableRow key={m.id} className="border-border hover:bg-blue-50/60 transition-colors">
                    <TableCell className="py-2.5">
                      {(() => {
                        const { base, variant } = parseMaterialName(m.name)
                        return (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-foreground text-[12px]">{base}</p>
                            {variant && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 leading-none">
                                {variant}
                              </span>
                            )}
                          </div>
                        )
                      })()}
                      {m.location && <p className="text-[11px] text-muted-foreground mt-0.5">{m.location}</p>}
                    </TableCell>
                    <TableCell className="py-2.5 text-[12px] text-muted-foreground">
                      {CATEGORY_LABELS[m.category] ?? m.category}
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <span className={cn(
                        "font-bold tabular text-[13px]",
                        status === "critical" ? "text-red-600" :
                        status === "low" ? "text-orange-500" : "text-emerald-600"
                      )}>
                        {m.currentStock}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-1">{m.unit}</span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-[12px] text-muted-foreground tabular">
                      {m.minimumStock} {m.unit}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <StockBadge current={m.currentStock} minimum={m.minimumStock} />
                    </TableCell>
                    <TableCell className="py-2.5 text-[12px] text-muted-foreground">
                      {m.vendor?.name ?? "—"}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-[12px] tabular text-foreground">
                      {m.unitPrice ? formatCurrency(m.unitPrice) : "—"}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => openRestock(m)}
                        >
                          <PlusCircle className="w-3 h-3 mr-1" />Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-[11px] border-orange-300 text-orange-700 hover:bg-orange-50"
                          onClick={() => openUse(m)}
                        >
                          <MinusCircle className="w-3 h-3 mr-1" />Use
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border text-[12px]">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => openHistory(m)}>
                              <History className="w-3.5 h-3.5 mr-2" />View History
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(m)}>
                              <Pencil className="w-3.5 h-3.5 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={() => { setSelectedMaterial(m); setDeleteOpen(true) }}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ── LOW STOCK ALERT POPUP ───────────────────────────────────────────── */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="bg-card border-amber-500/30 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alert
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            The following materials have fallen below their minimum stock level and require immediate restocking:
          </p>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {criticalMaterials.map((m) => {
              const pct = Math.min(100, Math.round((m.currentStock / Math.max(m.minimumStock, 1)) * 100))
              return (
                <div key={m.id} className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <Badge variant="destructive" className="text-xs">
                      {m.currentStock < LOW_STOCK_THRESHOLD ? `< ${LOW_STOCK_THRESHOLD} units` : "Below min"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Current: <span className="text-red-400 font-semibold">{m.currentStock} {m.unit}</span></span>
                    <span>Minimum: <span className="text-foreground">{m.minimumStock} {m.unit}</span></span>
                  </div>
                  <Progress
                    value={pct}
                    className="h-1.5 [&>div]:bg-red-500"
                  />
                </div>
              )
            })}
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setAlertOpen(false)}>Dismiss</Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black"
              onClick={() => {
                setAlertOpen(false)
                if (criticalMaterials[0]) openRestock(criticalMaterials[0])
              }}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Restock Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── STOCK HISTORY DIALOG ───────────────────────────────────────────── */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Stock Movement History
            </DialogTitle>
            {selectedMaterial && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-sm text-muted-foreground">{selectedMaterial.name}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Current stock:</span>
                  <span className={cn(
                    "font-bold tabular-nums",
                    selectedMaterial.currentStock < LOW_STOCK_THRESHOLD ? "text-red-400" : "text-emerald-400"
                  )}>
                    {selectedMaterial.currentStock} {selectedMaterial.unit}
                  </span>
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-2 min-h-0">
            {movementsLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                Loading history...
              </div>
            ) : movements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <History className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No stock movements recorded yet</p>
              </div>
            ) : (
              <div className="space-y-0 border border-border rounded-lg overflow-hidden">
                {/* Legend */}
                <div className="flex items-center gap-4 px-4 py-2 bg-muted/50 border-b border-border text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" /> Stock IN (added)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ArrowDownCircle className="w-3.5 h-3.5 text-red-400" /> Stock OUT (used/sold)
                  </span>
                </div>
                {/* Rows */}
                {movements.map((mv, i) => (
                  <div
                    key={mv.id}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 border-b border-border/60 last:border-0",
                      mv.type === "IN" ? "hover:bg-emerald-500/5" : "hover:bg-red-500/5"
                    )}
                  >
                    {/* Type icon */}
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      mv.type === "IN" ? "bg-emerald-500/10" : "bg-red-500/10"
                    )}>
                      {mv.type === "IN"
                        ? <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
                        : <ArrowDownCircle className="w-4 h-4 text-red-400" />
                      }
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{mv.reference}</p>
                      {mv.notes && (
                        <p className="text-xs text-muted-foreground truncate">{mv.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(mv.date)}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className={cn(
                        "text-base font-bold tabular-nums",
                        mv.type === "IN" ? "text-emerald-400" : "text-red-400"
                      )}>
                        {mv.type === "IN" ? "+" : "−"}{mv.quantity}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {selectedMaterial?.unit}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        Balance: <span className="text-foreground font-medium">{mv.balanceAfter}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 pt-3 flex justify-between items-center border-t border-border mt-3">
            <p className="text-xs text-muted-foreground">
              {movements.length} movement{movements.length !== 1 ? "s" : ""} recorded
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setHistoryOpen(false); if (selectedMaterial) openRestock(selectedMaterial) }}>
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Add Stock
              </Button>
              <Button variant="outline" size="sm" onClick={() => setHistoryOpen(false)}>
                <X className="w-3.5 h-3.5 mr-1.5" /> Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── ADD STOCK (RESTOCK) DIALOG ─────────────────────────────────────── */}
      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <PlusCircle className="w-5 h-5" /> Add Stock
            </DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <div className="mb-4 p-3 rounded-lg bg-muted border border-border">
              <p className="text-sm font-medium text-foreground">{selectedMaterial.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Current stock:{" "}
                <span className={cn(
                  "font-semibold",
                  selectedMaterial.currentStock < LOW_STOCK_THRESHOLD ? "text-red-400" : "text-emerald-400"
                )}>
                  {selectedMaterial.currentStock} {selectedMaterial.unit}
                </span>
                <span className="mx-2 text-border">|</span>
                Minimum: <span className="text-foreground">{selectedMaterial.minimumStock} {selectedMaterial.unit}</span>
              </p>
            </div>
          )}
          <form onSubmit={handleRestock} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Quantity to Add *</Label>
              <Input
                type="number" min="0.01" step="0.01"
                value={restockForm.quantity}
                onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })}
                placeholder={`Enter quantity (${selectedMaterial?.unit})`}
                required className="bg-muted"
                autoFocus
              />
              {restockForm.quantity && selectedMaterial && (
                <p className="text-xs text-emerald-400">
                  New stock will be:{" "}
                  <span className="font-semibold">
                    {selectedMaterial.currentStock + Number(restockForm.quantity)} {selectedMaterial.unit}
                  </span>
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input
                value={restockForm.notes}
                onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                placeholder="e.g. Emergency restock, received from supplier"
                className="bg-muted"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setRestockOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? "Adding..." : `Add +${restockForm.quantity || "?"} ${selectedMaterial?.unit ?? ""}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── USE STOCK DIALOG ───────────────────────────────────────────────── */}
      <Dialog open={useOpen} onOpenChange={setUseOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <MinusCircle className="w-5 h-5" /> Use / Remove Stock
            </DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <div className="mb-4 p-3 rounded-lg bg-muted border border-border">
              <p className="text-sm font-medium text-foreground">{selectedMaterial.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Available:{" "}
                <span className={cn(
                  "font-semibold",
                  selectedMaterial.currentStock < LOW_STOCK_THRESHOLD ? "text-red-400" : "text-emerald-400"
                )}>
                  {selectedMaterial.currentStock} {selectedMaterial.unit}
                </span>
              </p>
            </div>
          )}
          <form onSubmit={handleUse} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Quantity to Use *</Label>
              <Input
                type="number" min="0.01" step="0.01"
                max={selectedMaterial?.currentStock}
                value={useForm.quantity}
                onChange={(e) => setUseForm({ ...useForm, quantity: e.target.value })}
                placeholder="Enter quantity"
                required className="bg-muted"
                autoFocus
              />
              {useForm.quantity && selectedMaterial && (
                <p className={cn(
                  "text-xs font-medium",
                  selectedMaterial.currentStock - Number(useForm.quantity) < LOW_STOCK_THRESHOLD
                    ? "text-red-400"
                    : "text-muted-foreground"
                )}>
                  Remaining after use:{" "}
                  <span className="font-semibold">
                    {Math.max(0, selectedMaterial.currentStock - Number(useForm.quantity))} {selectedMaterial.unit}
                  </span>
                  {selectedMaterial.currentStock - Number(useForm.quantity) < LOW_STOCK_THRESHOLD && (
                    <span className="ml-1">⚠ below threshold</span>
                  )}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Reason / Transformer (optional)</Label>
              <Input
                value={useForm.notes}
                onChange={(e) => setUseForm({ ...useForm, notes: e.target.value })}
                placeholder="e.g. TRF-100KVA-001 coil winding"
                className="bg-muted"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setUseOpen(false)}>Cancel</Button>
              <Button
                type="submit" disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {submitting ? "Recording..." : `Remove −${useForm.quantity || "?"} ${selectedMaterial?.unit ?? ""}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── ADD / EDIT MATERIAL DIALOG ─────────────────────────────────────── */}
      {(addOpen || editOpen) && (
        <Dialog open={addOpen || editOpen} onOpenChange={() => { setAddOpen(false); setEditOpen(false) }}>
          <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{addOpen ? "Add New Material" : "Edit Material"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={addOpen ? handleAdd : handleEdit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Material Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Copper Coil Grade A" required className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="bg-muted"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Unit *</Label>
                  <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="kg, pcs, liters..." required className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>Current Stock</Label>
                  <Input type="number" min="0" value={form.currentStock}
                    onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                    placeholder="0" className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>Minimum Stock (alert below this)</Label>
                  <Input type="number" min="0" value={form.minimumStock}
                    onChange={(e) => setForm({ ...form, minimumStock: e.target.value })}
                    placeholder="10" className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit Price (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    placeholder="0.00" className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Warehouse A, Shelf 3" className="bg-muted" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Vendor</Label>
                  <Select value={form.vendorId || "NONE"} onValueChange={(v) => setForm({ ...form, vendorId: v === "NONE" ? "" : v })}>
                    <SelectTrigger className="bg-muted"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No vendor</SelectItem>
                      {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description" className="bg-muted" />
                </div>
              </div>
              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setEditOpen(false) }}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : addOpen ? "Add Material" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── DELETE DIALOG ──────────────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Material</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="text-foreground font-medium">{selectedMaterial?.name}</span>?
            This cannot be undone.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── FLOATING AI CHAT ASSISTANT ─────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

        {/* Chat panel */}
        {chatOpen && (
          <div className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            style={{ height: 420 }}>

            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold leading-none">Inventory Assistant</p>
                <p className="text-[10px] text-blue-100 mt-0.5">
                  {listening ? "🔴 Listening..." : "Ask me anything"}
                </p>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-gray-50">
              {chatMsgs.map((msg, i) => (
                <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "ai" && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[85%] px-3 py-2 rounded-2xl text-[12px] leading-relaxed whitespace-pre-line",
                    msg.role === "user"
                      ? "bg-blue-500 text-white rounded-tr-sm"
                      : "bg-white text-gray-700 border border-gray-200 rounded-tl-sm shadow-sm"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick chips */}
            <div className="flex gap-1.5 px-3 py-1.5 overflow-x-auto bg-white border-t border-gray-100 flex-shrink-0">
              {["add 50 copper coil", "use 10 oil", "search copper"].map((chip) => (
                <button
                  key={chip}
                  onClick={() => { setChatInput(chip); runCommand(chip) }}
                  className="text-[10px] px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 whitespace-nowrap flex-shrink-0 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-gray-100 flex-shrink-0">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendChat() }}
                placeholder="Type a command..."
                className="flex-1 text-[12px] bg-gray-100 rounded-full px-3 py-1.5 outline-none border border-transparent focus:border-blue-300 focus:bg-white transition-all placeholder:text-gray-400"
              />
              <button
                onClick={toggleVoice}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                  listening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
                title={listening ? "Stop" : "Speak"}
              >
                {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={sendChat}
                disabled={!chatInput.trim()}
                className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setChatOpen((v) => !v)}
          className={cn(
            "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200",
            "bg-blue-500 hover:bg-blue-600 text-white",
            chatOpen && "rotate-0 scale-90"
          )}
          title="Inventory Assistant"
        >
          {chatOpen
            ? <X className="w-6 h-6" />
            : <Bot className="w-6 h-6" />
          }
        </button>
      </div>
    </div>
  )
}
