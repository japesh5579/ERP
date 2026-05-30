"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Plus, Search, Factory, Eye, MoreHorizontal, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatDate, STAGE_LABELS, STAGE_ORDER, getStageProgress } from "@/lib/utils"
import type { TransformerWithRelations, User } from "@/types"

type FilterTab = "ALL" | "IN_PRODUCTION" | "ON_HOLD" | "COMPLETED" | "DISPATCHED"

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "ALL" },
  { label: "In Production", value: "IN_PRODUCTION" },
  { label: "On Hold", value: "ON_HOLD" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Dispatched", value: "DISPATCHED" },
]

function getStatusBadge(status: string) {
  switch (status) {
    case "IN_PRODUCTION": return <Badge variant="default">In Production</Badge>
    case "ON_HOLD": return <Badge variant="warning">On Hold</Badge>
    case "COMPLETED": return <Badge variant="success">Completed</Badge>
    case "DISPATCHED": return <Badge className="bg-violet-400/10 text-violet-400 border-transparent">Dispatched</Badge>
    case "REJECTED": return <Badge variant="destructive">Rejected</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

function getStageBadge(stage: string) {
  const idx = STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number])
  let className = ""
  if (idx <= 1) className = "text-blue-400 bg-blue-400/10 border-transparent"
  else if (idx <= 4) className = "text-amber-400 bg-amber-400/10 border-transparent"
  else if (idx >= 6) className = "text-emerald-400 bg-emerald-400/10 border-transparent"
  else className = "text-primary bg-primary/10 border-transparent"
  return (
    <Badge className={className}>
      {STAGE_LABELS[stage] ?? stage}
    </Badge>
  )
}

const EMPTY_FORM = {
  modelNumber: "",
  kvaRating: "",
  voltageRatio: "",
  phaseType: "THREE_PHASE",
  batchNumber: "",
  deadline: "",
  engineerId: "",
  clientName: "",
  notes: "",
}

export default function ProductionPage() {
  const [transformers, setTransformers] = useState<TransformerWithRelations[]>([])
  const [engineers, setEngineers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL")

  const [addOpen, setAddOpen] = useState(false)
  const [stageOpen, setStageOpen] = useState(false)
  const [selectedTransformer, setSelectedTransformer] = useState<TransformerWithRelations | null>(null)
  const [newStage, setNewStage] = useState("")
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchTransformers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab !== "ALL") params.set("status", activeTab)
      if (search) params.set("search", search)
      const res = await fetch(`/api/production?${params}`)
      const data = await res.json()
      setTransformers(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Failed to load production data")
    } finally {
      setLoading(false)
    }
  }

  const fetchEngineers = async () => {
    try {
      const res = await fetch("/api/users")
      if (!res.ok) return // Non-admin: gracefully skip
      const data = await res.json()
      setEngineers(
        Array.isArray(data)
          ? data.filter((u: User) =>
              ["PRODUCTION_MANAGER", "QUALITY_ENGINEER", "SUPER_ADMIN"].includes(u.role)
            )
          : []
      )
    } catch {}
  }

  useEffect(() => { fetchTransformers(); fetchEngineers() }, [])
  useEffect(() => { fetchTransformers() }, [activeTab, search])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelNumber: form.modelNumber,
          kvaRating: Number(form.kvaRating),
          voltageRatio: form.voltageRatio,
          phaseType: form.phaseType,
          batchNumber: form.batchNumber || null,
          deadline: form.deadline || null,
          engineerId: form.engineerId || null,
          notes: form.notes || null,
        }),
      })
      if (res.ok) {
        toast.success("Transformer added to production")
        setAddOpen(false)
        setForm(EMPTY_FORM)
        fetchTransformers()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to create transformer")
      }
    } catch {
      toast.error("Failed to create transformer")
    } finally {
      setSubmitting(false)
    }
  }

  const handleStageUpdate = async () => {
    if (!selectedTransformer || !newStage) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/production/${selectedTransformer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStage: newStage }),
      })
      if (res.ok) {
        toast.success("Stage updated successfully")
        setStageOpen(false)
        fetchTransformers()
      } else {
        toast.error("Failed to update stage")
      }
    } catch {
      toast.error("Failed to update stage")
    } finally {
      setSubmitting(false)
    }
  }

  const openStageDialog = (t: TransformerWithRelations) => {
    setSelectedTransformer(t)
    setNewStage(t.currentStage)
    setStageOpen(true)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Production Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track transformers through each production stage
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setAddOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          New Transformer
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          {/* Filter tabs */}
          <div className="flex gap-1 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === tab.value
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by model number, batch, voltage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <Factory className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                <p className="text-sm">Loading production data...</p>
              </div>
            </div>
          ) : transformers.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <Factory className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No transformers found</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Model No.</TableHead>
                  <TableHead className="text-muted-foreground">kVA</TableHead>
                  <TableHead className="text-muted-foreground">Voltage Ratio</TableHead>
                  <TableHead className="text-muted-foreground">Phase</TableHead>
                  <TableHead className="text-muted-foreground">Current Stage</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Engineer</TableHead>
                  <TableHead className="text-muted-foreground">Deadline</TableHead>
                  <TableHead className="text-muted-foreground">Client</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transformers.map((t) => {
                  const progress = getStageProgress(t.currentStage)
                  return (
                    <TableRow key={t.id} className="border-border hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{t.modelNumber}</p>
                          {t.batchNumber && (
                            <p className="text-xs text-muted-foreground">Batch: {t.batchNumber}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground font-mono">{t.kvaRating} kVA</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.voltageRatio}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.phaseType === "THREE_PHASE" ? "3-Phase" : "1-Phase"}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-32">
                          {getStageBadge(t.currentStage)}
                          <div className="mt-1.5 h-1 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/70 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{progress}%</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.engineer?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.deadline ? formatDate(t.deadline) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.client?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem asChild>
                              <Link href={`/production/${t.id}`} className="flex items-center cursor-pointer">
                                <Eye className="w-4 h-4 mr-2 text-primary" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => openStageDialog(t)}
                            >
                              <RefreshCw className="w-4 h-4 mr-2 text-amber-400" />
                              Update Stage
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Transformer Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Transformer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Model Number *</Label>
                <Input
                  value={form.modelNumber}
                  onChange={(e) => setForm({ ...form, modelNumber: e.target.value })}
                  placeholder="e.g. TRF-2024-001"
                  required
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label>kVA Rating *</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.kvaRating}
                  onChange={(e) => setForm({ ...form, kvaRating: e.target.value })}
                  placeholder="e.g. 100"
                  required
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Voltage Ratio *</Label>
                <Input
                  value={form.voltageRatio}
                  onChange={(e) => setForm({ ...form, voltageRatio: e.target.value })}
                  placeholder="e.g. 11kV/433V"
                  required
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phase Type</Label>
                <Select value={form.phaseType} onValueChange={(v) => setForm({ ...form, phaseType: v })}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THREE_PHASE">Three Phase</SelectItem>
                    <SelectItem value="SINGLE_PHASE">Single Phase</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Batch Number</Label>
                <Input
                  value={form.batchNumber}
                  onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                  placeholder="e.g. BATCH-2024-A"
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="bg-muted"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Assign Engineer</Label>
                <Select value={form.engineerId || "NONE"} onValueChange={(v) => setForm({ ...form, engineerId: v === "NONE" ? "" : v })}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue placeholder="Select engineer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No engineer</SelectItem>
                    {engineers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes"
                  className="bg-muted"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Transformer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stage Update Dialog */}
      <Dialog open={stageOpen} onOpenChange={setStageOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Production Stage</DialogTitle>
          </DialogHeader>
          {selectedTransformer && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted border border-border">
                <p className="text-sm font-medium text-foreground">{selectedTransformer.modelNumber}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Current: {STAGE_LABELS[selectedTransformer.currentStage]}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>New Stage</Label>
                <Select value={newStage} onValueChange={setNewStage}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_ORDER.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {STAGE_LABELS[stage]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setStageOpen(false)}>Cancel</Button>
                <Button onClick={handleStageUpdate} disabled={submitting}>
                  {submitting ? "Updating..." : "Update Stage"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
