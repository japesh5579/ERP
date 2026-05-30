"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Search, FlaskConical, MoreHorizontal, Trash2 } from "lucide-react"
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
import { formatDate, TEST_TYPE_LABELS } from "@/lib/utils"
import type { QualityTestWithRelations } from "@/types"

const TEST_TYPES = Object.entries(TEST_TYPE_LABELS)

const RESULTS = [
  { value: "PASS", label: "Pass" },
  { value: "FAIL", label: "Fail" },
  { value: "CONDITIONAL_PASS", label: "Conditional Pass" },
]

function getResultBadge(result: string) {
  switch (result) {
    case "PASS": return <Badge variant="success">Pass</Badge>
    case "FAIL": return <Badge variant="destructive">Fail</Badge>
    case "CONDITIONAL_PASS": return <Badge variant="warning">Conditional Pass</Badge>
    default: return <Badge variant="outline">{result}</Badge>
  }
}

type Transformer = { id: string; modelNumber: string; serialNumber: string | null }

const EMPTY_FORM = {
  transformerId: "",
  testType: "",
  result: "",
  voltage: "",
  current: "",
  temperature: "",
  resistance: "",
  loadLoss: "",
  noLoadLoss: "",
  notes: "",
  faultLog: "",
}

export default function QualityPage() {
  const [tests, setTests] = useState<QualityTestWithRelations[]>([])
  const [transformers, setTransformers] = useState<Transformer[]>([])
  const [loading, setLoading] = useState(true)

  const [testTypeFilter, setTestTypeFilter] = useState("")
  const [resultFilter, setResultFilter] = useState("")
  const [search, setSearch] = useState("")

  const [addOpen, setAddOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState<QualityTestWithRelations | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchTests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (testTypeFilter && testTypeFilter !== "ALL") params.set("testType", testTypeFilter)
      if (resultFilter && resultFilter !== "ALL") params.set("result", resultFilter)
      const res = await fetch(`/api/quality?${params}`)
      const data = await res.json()
      setTests(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Failed to load quality tests")
    } finally {
      setLoading(false)
    }
  }

  const fetchTransformers = async () => {
    try {
      const res = await fetch("/api/production")
      const data = await res.json()
      setTransformers(
        Array.isArray(data)
          ? data.map((t: { id: string; modelNumber: string; serialNumber: string | null }) => ({
              id: t.id,
              modelNumber: t.modelNumber,
              serialNumber: t.serialNumber,
            }))
          : []
      )
    } catch {}
  }

  useEffect(() => { fetchTests(); fetchTransformers() }, [])
  useEffect(() => { fetchTests() }, [testTypeFilter, resultFilter])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transformerId: form.transformerId,
          testType: form.testType,
          result: form.result,
          voltage: form.voltage ? Number(form.voltage) : null,
          current: form.current ? Number(form.current) : null,
          temperature: form.temperature ? Number(form.temperature) : null,
          resistance: form.resistance ? Number(form.resistance) : null,
          loadLoss: form.loadLoss ? Number(form.loadLoss) : null,
          noLoadLoss: form.noLoadLoss ? Number(form.noLoadLoss) : null,
          notes: form.notes || null,
          faultLog: form.faultLog || null,
        }),
      })
      if (res.ok) {
        toast.success("Quality test recorded successfully")
        setAddOpen(false)
        setForm(EMPTY_FORM)
        fetchTests()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to record test")
      }
    } catch {
      toast.error("Failed to record test")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTest) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/quality/${selectedTest.id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Test deleted")
        setDeleteOpen(false)
        fetchTests()
      } else {
        toast.error("Failed to delete test")
      }
    } catch {
      toast.error("Failed to delete test")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredTests = tests.filter((t) => {
    if (!search) return true
    return t.transformer.modelNumber.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Quality Testing</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Record and review quality test results
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setAddOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Test
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by transformer model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted"
              />
            </div>
            <Select value={testTypeFilter || "ALL"} onValueChange={(v) => setTestTypeFilter(v === "ALL" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Test Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Test Types</SelectItem>
                {TEST_TYPES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={resultFilter || "ALL"} onValueChange={(v) => setResultFilter(v === "ALL" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Results</SelectItem>
                {RESULTS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                <p className="text-sm">Loading quality tests...</p>
              </div>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No quality tests found</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Transformer</TableHead>
                  <TableHead className="text-muted-foreground">Test Type</TableHead>
                  <TableHead className="text-muted-foreground">Result</TableHead>
                  <TableHead className="text-muted-foreground">Voltage (V)</TableHead>
                  <TableHead className="text-muted-foreground">Temp (°C)</TableHead>
                  <TableHead className="text-muted-foreground">Resistance (Ω)</TableHead>
                  <TableHead className="text-muted-foreground">Engineer</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((t) => (
                  <TableRow key={t.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <p className="font-medium text-foreground">{t.transformer.modelNumber}</p>
                      {t.transformer.serialNumber && (
                        <p className="text-xs text-muted-foreground">{t.transformer.serialNumber}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {TEST_TYPE_LABELS[t.testType] ?? t.testType}
                    </TableCell>
                    <TableCell>{getResultBadge(t.result)}</TableCell>
                    <TableCell className="text-sm font-mono text-foreground">{t.voltage ?? "—"}</TableCell>
                    <TableCell className="text-sm font-mono text-foreground">{t.temperature ?? "—"}</TableCell>
                    <TableCell className="text-sm font-mono text-foreground">{t.resistance ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.engineer?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(t.testedAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem
                            className="text-sm cursor-pointer text-red-400 focus:text-red-400"
                            onClick={() => { setSelectedTest(t); setDeleteOpen(true) }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Test Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Quality Test</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Transformer *</Label>
                <Select value={form.transformerId} onValueChange={(v) => setForm({ ...form, transformerId: v })}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue placeholder="Select transformer" />
                  </SelectTrigger>
                  <SelectContent>
                    {transformers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.modelNumber}{t.serialNumber ? ` (${t.serialNumber})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Test Type *</Label>
                <Select value={form.testType} onValueChange={(v) => setForm({ ...form, testType: v })}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_TYPES.map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Result *</Label>
                <Select value={form.result} onValueChange={(v) => setForm({ ...form, result: v })}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESULTS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Voltage (V)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.voltage}
                  onChange={(e) => setForm({ ...form, voltage: e.target.value })}
                  placeholder="e.g. 11000"
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Current (A)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.current}
                  onChange={(e) => setForm({ ...form, current: e.target.value })}
                  placeholder="e.g. 5.25"
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Temperature (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                  placeholder="e.g. 75"
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Resistance (Ω)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={form.resistance}
                  onChange={(e) => setForm({ ...form, resistance: e.target.value })}
                  placeholder="e.g. 0.025"
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Load Loss (W)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.loadLoss}
                  onChange={(e) => setForm({ ...form, loadLoss: e.target.value })}
                  placeholder="e.g. 1200"
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1.5">
                <Label>No Load Loss (W)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.noLoadLoss}
                  onChange={(e) => setForm({ ...form, noLoadLoss: e.target.value })}
                  placeholder="e.g. 250"
                  className="bg-muted"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional test notes"
                  className="bg-muted"
                />
              </div>
              {form.result === "FAIL" && (
                <div className="col-span-2 space-y-1.5">
                  <Label>Fault Log</Label>
                  <Input
                    value={form.faultLog}
                    onChange={(e) => setForm({ ...form, faultLog: e.target.value })}
                    placeholder="Describe the fault..."
                    className="bg-muted border-red-400/30 focus:border-red-400/50"
                  />
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting || !form.transformerId || !form.testType || !form.result}>
                {submitting ? "Saving..." : "Record Test"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Test Record</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this quality test record? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
