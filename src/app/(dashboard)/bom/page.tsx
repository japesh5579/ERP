"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2, Play, Package, AlertTriangle, CheckCircle2, X, Search, Hammer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn, CATEGORY_LABELS } from "@/lib/utils"

type Material = { id: string; name: string; unit: string; currentStock: number; category: string; unitPrice: number }
type BOMItem = { id: string; quantity: number; material: Material }
type BOM = { id: string; name: string; description: string | null; items: BOMItem[] }

function buildableCount(bom: BOM): number {
  if (!bom.items.length) return 0
  return Math.floor(Math.min(...bom.items.map((i) => i.material.currentStock / i.quantity)))
}

function estimatedCost(bom: BOM): number {
  return bom.items.reduce((sum, i) => sum + i.quantity * (i.material.unitPrice ?? 0), 0)
}

export default function BOMPage() {
  const [boms, setBoms] = useState<BOM[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<BOM | null>(null)
  const [search, setSearch] = useState("")

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [lines, setLines] = useState([{ materialId: "", quantity: "" }])
  const [creating, setCreating] = useState(false)

  const [buildOpen, setBuildOpen] = useState(false)
  const [buildQty, setBuildQty] = useState("1")
  const [buildNotes, setBuildNotes] = useState("")
  const [building, setBuilding] = useState(false)
  const [stockCheck, setStockCheck] = useState<{ name: string; needed: number; available: number; unit: string; ok: boolean }[]>([])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [bRes, mRes] = await Promise.all([fetch("/api/bom"), fetch("/api/inventory")])
      const [bData, mData] = await Promise.all([bRes.json(), mRes.json()])
      setBoms(Array.isArray(bData) ? bData : [])
      setMaterials(Array.isArray(mData) ? mData : [])
    } catch { toast.error("Failed to load data") }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    if (!selected) return
    const qty = Math.max(1, Number(buildQty) || 1)
    setStockCheck(
      selected.items.map((item) => ({
        name: item.material.name,
        needed: item.quantity * qty,
        available: item.material.currentStock,
        unit: item.material.unit,
        ok: item.material.currentStock >= item.quantity * qty,
      }))
    )
  }, [selected, buildQty])

  const openBuild = (bom: BOM) => {
    setSelected(bom); setBuildQty("1"); setBuildNotes(""); setBuildOpen(true)
  }

  const handleBuild = async () => {
    if (!selected) return
    setBuilding(true)
    try {
      const res = await fetch(`/api/bom/${selected.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: Number(buildQty), notes: buildNotes }),
      })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); setBuildOpen(false); fetchAll() }
      else if (res.status === 422) toast.error("Insufficient stock — check the list below")
      else toast.error(data.error ?? "Failed to build")
    } catch { toast.error("Failed to build") }
    finally { setBuilding(false) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const valid = lines.filter((l) => l.materialId && Number(l.quantity) > 0)
    if (!name.trim()) { toast.error("Name is required"); return }
    if (valid.length === 0) { toast.error("Add at least one material"); return }
    setCreating(true)
    try {
      const res = await fetch("/api/bom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, items: valid.map((l) => ({ materialId: l.materialId, quantity: Number(l.quantity) })) }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`"${name}" created`)
        setCreateOpen(false); setName(""); setDescription(""); setLines([{ materialId: "", quantity: "" }])
        fetchAll()
      } else { toast.error(data.error ?? "Failed") }
    } catch { toast.error("Failed") }
    finally { setCreating(false) }
  }

  const handleDelete = async (bom: BOM) => {
    if (!confirm(`Delete "${bom.name}"?`)) return
    try {
      await fetch(`/api/bom/${bom.id}`, { method: "DELETE" })
      toast.success("Deleted")
      if (selected?.id === bom.id) setSelected(null)
      fetchAll()
    } catch { toast.error("Failed to delete") }
  }

  const allOk = stockCheck.length > 0 && stockCheck.every((s) => s.ok)
  const filtered = boms.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">Bill of Materials</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Product templates — click a row to view parts, then Build to deduct stock
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />New BOM
        </Button>
      </div>

      {/* ── Master-detail layout ── */}
      <div className="grid grid-cols-[280px_1fr] gap-0 border border-border rounded overflow-hidden bg-card" style={{ minHeight: 520 }}>

        {/* ── LEFT: BOM list ── */}
        <div className="border-r border-border flex flex-col">

          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="pl-8 h-8 text-[12px] bg-muted border-0"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-[12px] text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                <Package className="w-7 h-7 opacity-25" />
                <p className="text-[12px]">No templates found</p>
              </div>
            ) : (
              filtered.map((bom) => {
                const canBuild = buildableCount(bom)
                const isSelected = selected?.id === bom.id
                return (
                  <div
                    key={bom.id}
                    onClick={() => setSelected(bom)}
                    className={cn(
                      "flex items-start gap-0 px-0 border-b border-border cursor-pointer transition-colors group",
                      isSelected ? "bg-blue-50" : "hover:bg-muted/50"
                    )}
                  >
                    {/* Active bar */}
                    <div className={cn("w-0.5 self-stretch flex-shrink-0 transition-colors", isSelected ? "bg-blue-500" : "bg-transparent")} />

                    <div className="flex-1 px-3 py-2.5 min-w-0">
                      <p className={cn("text-[12px] font-semibold truncate leading-tight", isSelected ? "text-blue-700" : "text-foreground")}>
                        {bom.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">{bom.items.length} parts</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className={cn(
                          "text-[10px] font-semibold",
                          canBuild === 0 ? "text-red-600" : canBuild <= 2 ? "text-amber-600" : "text-emerald-600"
                        )}>
                          {canBuild === 0 ? "Cannot build" : `Can build ${canBuild}`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(bom) }}
                      className="self-center mr-2 p-1 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer count */}
          <div className="px-3 py-2 border-t border-border bg-muted/40">
            <p className="text-[10px] text-muted-foreground">{filtered.length} template{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* ── RIGHT: Detail view ── */}
        <div className="flex flex-col min-w-0">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <Package className="w-10 h-10 opacity-15" />
              <p className="text-[12px]">Select a template from the list to view its parts</p>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-4 bg-muted/30">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{selected.name}</p>
                  {selected.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{selected.description}</p>
                  )}
                </div>

                {/* Stats strip */}
                <div className="flex items-center gap-5 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Parts</p>
                    <p className="text-[13px] font-bold text-foreground">{selected.items.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Est. Cost / Unit</p>
                    <p className="text-[13px] font-bold text-foreground">
                      ₹{estimatedCost(selected).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Can Build</p>
                    <p className={cn(
                      "text-[13px] font-bold",
                      buildableCount(selected) === 0 ? "text-red-600" :
                      buildableCount(selected) <= 2 ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {buildableCount(selected)} units
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 px-4 text-[12px] bg-blue-600 hover:bg-blue-700"
                    onClick={() => openBuild(selected)}
                  >
                    <Hammer className="w-3.5 h-3.5 mr-1.5" />Build
                  </Button>
                </div>
              </div>

              {/* Parts table */}
              <div className="flex-1 overflow-auto">
                {selected.items.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-[12px] text-muted-foreground">
                    No materials in this template
                  </div>
                ) : (
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 sticky top-0">
                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground w-8">#</th>
                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Material</th>
                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Category</th>
                        <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Required / Unit</th>
                        <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">In Stock</th>
                        <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Shortfall</th>
                        <th className="text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item, idx) => {
                        const enough = item.material.currentStock >= item.quantity
                        const shortfall = item.quantity - item.material.currentStock
                        return (
                          <tr key={item.id} className={cn(
                            "border-b border-border/60 last:border-0 hover:bg-muted/30",
                            !enough && "bg-red-50/40"
                          )}>
                            <td className="px-4 py-2 text-muted-foreground text-[11px] tabular">{idx + 1}</td>
                            <td className="px-4 py-2.5 font-medium text-foreground">{item.material.name}</td>
                            <td className="px-4 py-2.5 text-muted-foreground text-[11px]">
                              {CATEGORY_LABELS[item.material.category] ?? item.material.category}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold tabular text-foreground">
                              {item.quantity} <span className="font-normal text-muted-foreground">{item.material.unit}</span>
                            </td>
                            <td className={cn("px-4 py-2.5 text-right tabular font-semibold", enough ? "text-emerald-600" : "text-red-600")}>
                              {item.material.currentStock} <span className="font-normal text-muted-foreground">{item.material.unit}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right tabular text-[11px] text-muted-foreground">
                              {!enough ? <span className="text-red-600 font-semibold">−{shortfall.toFixed(1)} {item.material.unit}</span> : <span className="text-emerald-600">—</span>}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {enough
                                ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                    <CheckCircle2 className="w-3 h-3" />OK
                                  </span>
                                : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                                    <AlertTriangle className="w-3 h-3" />Short
                                  </span>
                              }
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── BUILD DIALOG ── */}
      <Dialog open={buildOpen} onOpenChange={setBuildOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[14px]">
              <Hammer className="w-4 h-4 text-blue-500" />
              Build — {selected?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Quantity to Build</Label>
                <Input
                  type="number" min="1" value={buildQty}
                  onChange={(e) => setBuildQty(e.target.value)}
                  className="bg-muted h-9 text-[12px]" autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Notes (optional)</Label>
                <Input
                  placeholder="e.g. Batch #12"
                  value={buildNotes} onChange={(e) => setBuildNotes(e.target.value)}
                  className="bg-muted h-9 text-[12px]"
                />
              </div>
            </div>

            <div className="border border-border rounded overflow-hidden">
              <div className="bg-muted/60 px-3 py-1.5 border-b border-border flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Stock Check — {buildQty} unit{Number(buildQty) !== 1 ? "s" : ""}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {stockCheck.filter((s) => s.ok).length}/{stockCheck.length} ready
                </p>
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-border/50">
                {stockCheck.map((s) => (
                  <div key={s.name} className={cn(
                    "flex items-center gap-3 px-3 py-2 text-[12px]",
                    !s.ok && "bg-red-50/60"
                  )}>
                    {s.ok
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    }
                    <span className="flex-1 text-foreground truncate">{s.name}</span>
                    <span className="text-muted-foreground text-[11px] tabular">need {s.needed}</span>
                    <span className={cn("tabular font-semibold text-[11px]", s.ok ? "text-emerald-600" : "text-red-600")}>
                      have {s.available} {s.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {!allOk && (
              <div className="flex items-center gap-2 p-2.5 rounded bg-red-50 border border-red-200 text-[11px] text-red-700">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                Insufficient stock for some materials. Restock before building.
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setBuildOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleBuild}
              disabled={building || !allOk}
            >
              {building ? "Building..." : `Confirm Build × ${buildQty}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CREATE DIALOG ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[14px]">New Bill of Materials</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Product Name *</Label>
                <Input
                  placeholder="e.g. 100 KVA Three Phase Transformer"
                  value={name} onChange={(e) => setName(e.target.value)}
                  required className="bg-muted h-9 text-[12px]" autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Description</Label>
                <Input
                  placeholder="Optional"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="bg-muted h-9 text-[12px]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[11px]">Materials List *</Label>
                <Button
                  type="button" variant="outline" size="sm" className="h-7 text-[11px]"
                  onClick={() => setLines([...lines, { materialId: "", quantity: "" }])}
                >
                  <Plus className="w-3 h-3 mr-1" />Add Row
                </Button>
              </div>
              <div className="border border-border rounded overflow-hidden">
                <div className="grid grid-cols-12 gap-0 bg-muted/60 px-3 py-2 border-b border-border">
                  <div className="col-span-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">#</div>
                  <div className="col-span-7 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Material</div>
                  <div className="col-span-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Qty / Unit</div>
                  <div className="col-span-1" />
                </div>
                <div className="divide-y divide-border/50">
                  {lines.map((line, idx) => {
                    const mat = materials.find((m) => m.id === line.materialId)
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                        <div className="col-span-1 text-[11px] text-muted-foreground">{idx + 1}</div>
                        <div className="col-span-7">
                          <Select
                            value={line.materialId || "NONE"}
                            onValueChange={(v) => {
                              const u = [...lines]; u[idx] = { ...u[idx], materialId: v === "NONE" ? "" : v }; setLines(u)
                            }}
                          >
                            <SelectTrigger className="bg-background h-8 text-[11px]">
                              <SelectValue placeholder="Select material..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NONE">Select material...</SelectItem>
                              {materials.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.name} — {m.currentStock} {m.unit} in stock
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number" min="0.01" step="0.01"
                            placeholder={mat?.unit ?? "Qty"}
                            value={line.quantity}
                            onChange={(e) => {
                              const u = [...lines]; u[idx] = { ...u[idx], quantity: e.target.value }; setLines(u)
                            }}
                            className="bg-background h-8 text-[11px]"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                            disabled={lines.length === 1}
                            className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={creating}>
                {creating ? "Creating..." : "Create BOM"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
