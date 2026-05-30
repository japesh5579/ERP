"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft, CheckCircle2, Circle, Factory, FlaskConical,
  Package, ChevronRight, RefreshCw, AlertTriangle, Plus, Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  cn, formatDate, formatDateTime, STAGE_LABELS, STAGE_ORDER, CATEGORY_LABELS,
  TEST_TYPE_LABELS, getStageProgress,
} from "@/lib/utils"

type Transformer = {
  id: string
  modelNumber: string
  serialNumber: string | null
  kvaRating: number
  voltageRatio: string
  phaseType: string
  batchNumber: string | null
  currentStage: string
  status: string
  notes: string | null
  deadline: string | null
  createdAt: string
  completedAt: string | null
  engineer: { id: string; name: string; email: string; role: string } | null
  client: { id: string; name: string; email: string; phone: string } | null
  qualityTests: {
    id: string
    testType: string
    result: string
    voltage: number | null
    current: number | null
    temperature: number | null
    resistance: number | null
    loadLoss: number | null
    noLoadLoss: number | null
    notes: string | null
    faultLog: string | null
    testedAt: string
    engineer: { id: string; name: string }
  }[]
  stageHistory: {
    id: string
    stage: string
    enteredAt: string
    exitedAt: string | null
    notes: string | null
  }[]
  materialUsages: {
    id: string
    quantity: number
    usedAt: string
    notes: string | null
    material: { id: string; name: string; unit: string; category: string }
  }[]
  dispatch: {
    id: string
    invoiceNumber: string
    deliveryStatus: string
    dispatchDate: string | null
    client: { name: string }
  } | null
}

function getResultBadge(result: string) {
  switch (result) {
    case "PASS": return <Badge variant="success">Pass</Badge>
    case "FAIL": return <Badge variant="destructive">Fail</Badge>
    case "CONDITIONAL_PASS": return <Badge variant="warning">Conditional Pass</Badge>
    default: return <Badge variant="outline">{result}</Badge>
  }
}

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

export default function ProductionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [transformer, setTransformer] = useState<Transformer | null>(null)
  const [loading, setLoading] = useState(true)
  const [stageOpen, setStageOpen] = useState(false)
  const [newStage, setNewStage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [usageOpen, setUsageOpen] = useState(false)
  const [usageItems, setUsageItems] = useState([{ materialId: "", quantity: "", notes: "" }])
  const [allMaterials, setAllMaterials] = useState<{ id: string; name: string; unit: string; currentStock: number }[]>([])
  const [usageSubmitting, setUsageSubmitting] = useState(false)

  const fetchTransformer = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/production/${params.id}`)
      if (!res.ok) throw new Error("Not found")
      const data = await res.json()
      setTransformer(data)
      setNewStage(data.currentStage)
    } catch {
      toast.error("Failed to load transformer")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransformer()
    fetch("/api/inventory").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setAllMaterials(d)
    }).catch(() => {})
  }, [params.id])

  const handleStageUpdate = async () => {
    if (!transformer || !newStage) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/production/${transformer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStage: newStage }),
      })
      if (res.ok) {
        toast.success("Stage updated successfully")
        setStageOpen(false)
        fetchTransformer()
      } else {
        toast.error("Failed to update stage")
      }
    } catch {
      toast.error("Failed to update stage")
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogUsage = async () => {
    const valid = usageItems.filter((i) => i.materialId && Number(i.quantity) > 0)
    if (valid.length === 0) { toast.error("Add at least one item with quantity"); return }
    setUsageSubmitting(true)
    try {
      const res = await fetch(`/api/production/${transformer?.id}/material-usage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: valid.map((i) => ({
            materialId: i.materialId,
            quantity: Number(i.quantity),
            notes: i.notes || undefined,
          })),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`${valid.length} material(s) logged — stock updated`)
        setUsageOpen(false)
        setUsageItems([{ materialId: "", quantity: "", notes: "" }])
        fetchTransformer()
        // Refresh material list so stock numbers stay current
        fetch("/api/inventory").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setAllMaterials(d) }).catch(() => {})
      } else if (res.status === 422) {
        toast.error("Insufficient stock: " + (data.details as string[]).join("; "))
      } else {
        toast.error(data.error ?? "Failed to log usage")
      }
    } catch {
      toast.error("Failed to log usage")
    } finally {
      setUsageSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Factory className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading transformer details...</p>
        </div>
      </div>
    )
  }

  if (!transformer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-8 h-8 text-amber-400" />
        <p className="text-muted-foreground">Transformer not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  const currentStageIdx = STAGE_ORDER.indexOf(transformer.currentStage as (typeof STAGE_ORDER)[number])
  const progress = getStageProgress(transformer.currentStage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{transformer.modelNumber}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {transformer.serialNumber ? `Serial: ${transformer.serialNumber}` : "No serial number"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(transformer.status)}
          <Button onClick={() => setStageOpen(true)} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Stage
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "kVA Rating", value: `${transformer.kvaRating} kVA` },
          { label: "Voltage Ratio", value: transformer.voltageRatio },
          { label: "Phase Type", value: transformer.phaseType === "THREE_PHASE" ? "Three Phase" : "Single Phase" },
          { label: "Batch Number", value: transformer.batchNumber ?? "—" },
          { label: "Assigned Engineer", value: transformer.engineer?.name ?? "Unassigned" },
          { label: "Client", value: transformer.client?.name ?? "—" },
          { label: "Deadline", value: transformer.deadline ? formatDate(transformer.deadline) : "—" },
          { label: "Created", value: formatDate(transformer.createdAt) },
        ].map(({ label, value }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="text-sm font-semibold text-foreground mt-1">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notes */}
      {transformer.notes && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-foreground">{transformer.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Stage Timeline */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Factory className="w-4 h-4 text-primary" />
            Production Timeline
            <span className="ml-auto text-muted-foreground font-normal text-xs">{progress}% complete</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Stage steps */}
          <div className="relative">
            {/* Connector line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-border hidden sm:block" style={{ zIndex: 0 }} />
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {STAGE_ORDER.map((stage, idx) => {
                const completed = idx < currentStageIdx
                const current = idx === currentStageIdx
                return (
                  <div key={stage} className="flex flex-col items-center gap-2 relative" style={{ zIndex: 1 }}>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                        completed
                          ? "bg-emerald-400/20 border-emerald-400"
                          : current
                          ? "bg-primary/20 border-primary"
                          : "bg-muted border-border"
                      )}
                    >
                      {completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : current ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-[10px] text-center leading-tight",
                        current ? "text-primary font-semibold" : completed ? "text-emerald-400" : "text-muted-foreground"
                      )}
                    >
                      {STAGE_LABELS[stage]}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Material Usage */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            Material Usage
            <Badge variant="outline" className="ml-1 text-xs">{transformer.materialUsages.length} records</Badge>
            <Button
              size="sm" variant="outline"
              className="ml-auto h-7 text-xs"
              onClick={() => { setUsageItems([{ materialId: "", quantity: "", notes: "" }]); setUsageOpen(true) }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Log Usage
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          {transformer.materialUsages.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground">
              <p className="text-sm">No materials recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Material</TableHead>
                  <TableHead className="text-muted-foreground">Category</TableHead>
                  <TableHead className="text-muted-foreground">Quantity</TableHead>
                  <TableHead className="text-muted-foreground">Notes</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transformer.materialUsages.map((u) => (
                  <TableRow key={u.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">{u.material.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {CATEGORY_LABELS[u.material.category] ?? u.material.category}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-foreground">
                      {u.quantity} {u.material.unit}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.notes ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(u.usedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quality Tests */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-400" />
            Quality Tests
            <Badge variant="outline" className="ml-auto text-xs">{transformer.qualityTests.length} tests</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          {transformer.qualityTests.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground">
              <p className="text-sm">No quality tests recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Test Type</TableHead>
                  <TableHead className="text-muted-foreground">Result</TableHead>
                  <TableHead className="text-muted-foreground">Voltage (V)</TableHead>
                  <TableHead className="text-muted-foreground">Temp (°C)</TableHead>
                  <TableHead className="text-muted-foreground">Resistance (Ω)</TableHead>
                  <TableHead className="text-muted-foreground">Engineer</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transformer.qualityTests.map((t) => (
                  <TableRow key={t.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">
                      {TEST_TYPE_LABELS[t.testType] ?? t.testType}
                    </TableCell>
                    <TableCell>{getResultBadge(t.result)}</TableCell>
                    <TableCell className="text-sm font-mono text-foreground">{t.voltage ?? "—"}</TableCell>
                    <TableCell className="text-sm font-mono text-foreground">{t.temperature ?? "—"}</TableCell>
                    <TableCell className="text-sm font-mono text-foreground">{t.resistance ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.engineer.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(t.testedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Stage History */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-primary" />
            Stage History
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          {transformer.stageHistory.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground">
              <p className="text-sm">No stage history available</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Stage</TableHead>
                  <TableHead className="text-muted-foreground">Entered At</TableHead>
                  <TableHead className="text-muted-foreground">Exited At</TableHead>
                  <TableHead className="text-muted-foreground">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transformer.stageHistory.map((h) => (
                  <TableRow key={h.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">
                      {STAGE_LABELS[h.stage] ?? h.stage}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(h.enteredAt)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {h.exitedAt ? formatDateTime(h.exitedAt) : (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{h.notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Log Material Usage Dialog */}
      <Dialog open={usageOpen} onOpenChange={setUsageOpen}>
        <DialogContent className="bg-card border-border max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Material Usage</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">
            Stock will be deducted automatically when you save.
          </p>

          <div className="space-y-3 mt-2">
            {/* Column headers */}
            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-1">
              <div className="col-span-5">Material</div>
              <div className="col-span-3">Quantity</div>
              <div className="col-span-3">Notes</div>
              <div className="col-span-1" />
            </div>

            {usageItems.map((item, idx) => {
              const mat = allMaterials.find((m) => m.id === item.materialId)
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <Select
                      value={item.materialId || "NONE"}
                      onValueChange={(v) => {
                        const updated = [...usageItems]
                        updated[idx] = { ...updated[idx], materialId: v === "NONE" ? "" : v }
                        setUsageItems(updated)
                      }}
                    >
                      <SelectTrigger className="bg-muted h-9 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Select material...</SelectItem>
                        {allMaterials.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} ({m.currentStock} {m.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mat && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                        In stock: {mat.currentStock} {mat.unit}
                      </p>
                    )}
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number" min="0.01" step="0.01"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...usageItems]
                        updated[idx] = { ...updated[idx], quantity: e.target.value }
                        setUsageItems(updated)
                      }}
                      className="bg-muted h-9 text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      placeholder="Notes (opt.)"
                      value={item.notes}
                      onChange={(e) => {
                        const updated = [...usageItems]
                        updated[idx] = { ...updated[idx], notes: e.target.value }
                        setUsageItems(updated)
                      }}
                      className="bg-muted h-9 text-xs"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center pt-1.5">
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="h-7 w-7 text-red-400/50 hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => setUsageItems(usageItems.filter((_, i) => i !== idx))}
                      disabled={usageItems.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}

            <Button
              type="button" variant="outline" size="sm"
              onClick={() => setUsageItems([...usageItems, { materialId: "", quantity: "", notes: "" }])}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Material
            </Button>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setUsageOpen(false)}>Cancel</Button>
            <Button onClick={handleLogUsage} disabled={usageSubmitting}>
              {usageSubmitting ? "Saving..." : "Log & Deduct Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Update Dialog */}
      <Dialog open={stageOpen} onOpenChange={setStageOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Production Stage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted border border-border">
              <p className="text-sm font-medium text-foreground">{transformer.modelNumber}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current: {STAGE_LABELS[transformer.currentStage]}
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
