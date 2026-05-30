"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Search, Truck, MoreHorizontal, CreditCard } from "lucide-react"
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
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import type { DispatchWithRelations } from "@/types"

type Transformer = { id: string; modelNumber: string; status: string }
type Client = { id: string; name: string; email: string | null; phone: string | null }

const DELIVERY_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "RETURNED", label: "Returned" },
]

function getDeliveryBadge(status: string) {
  switch (status) {
    case "PENDING": return <Badge variant="warning">Pending</Badge>
    case "IN_TRANSIT": return <Badge variant="default">In Transit</Badge>
    case "DELIVERED": return <Badge variant="success">Delivered</Badge>
    case "RETURNED": return <Badge variant="destructive">Returned</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

const EMPTY_FORM = {
  transformerId: "",
  clientId: "",
  newClientName: "",
  newClientEmail: "",
  newClientPhone: "",
  invoiceAmount: "",
  deliveryAddress: "",
  transporterName: "",
  notes: "",
}

const EMPTY_UPDATE = {
  deliveryStatus: "",
  trackingNumber: "",
  paidAmount: "",
}

export default function DispatchPage() {
  const [dispatches, setDispatches] = useState<DispatchWithRelations[]>([])
  const [completedTransformers, setCompletedTransformers] = useState<Transformer[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [search, setSearch] = useState("")

  const [addOpen, setAddOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selectedDispatch, setSelectedDispatch] = useState<DispatchWithRelations | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [updateForm, setUpdateForm] = useState(EMPTY_UPDATE)
  const [newClientMode, setNewClientMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [creatingClient, setCreatingClient] = useState(false)

  const fetchDispatches = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(`/api/dispatch?${params}`)
      const data = await res.json()
      setDispatches(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Failed to load dispatch records")
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletedTransformers = async () => {
    try {
      const res = await fetch("/api/production?status=COMPLETED")
      const data = await res.json()
      setCompletedTransformers(Array.isArray(data) ? data : [])
    } catch {}
  }

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients")
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
    } catch {}
  }

  useEffect(() => {
    fetchDispatches()
    fetchCompletedTransformers()
    fetchClients()
  }, [])
  useEffect(() => { fetchDispatches() }, [statusFilter])

  // Create a new client and return their ID
  const createClientIfNeeded = async (): Promise<string | null> => {
    if (!newClientMode) return form.clientId || null

    if (!form.newClientName.trim()) {
      toast.error("Client name is required")
      return null
    }
    setCreatingClient(true)
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.newClientName,
          email: form.newClientEmail || null,
          phone: form.newClientPhone || null,
        }),
      })
      if (res.ok) {
        const client = await res.json()
        fetchClients()
        return client.id
      } else {
        toast.error("Failed to create client")
        return null
      }
    } catch {
      toast.error("Failed to create client")
      return null
    } finally {
      setCreatingClient(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.transformerId) {
      toast.error("Please select a transformer")
      return
    }

    setSubmitting(true)
    try {
      const clientId = await createClientIfNeeded()
      if (!clientId) {
        setSubmitting(false)
        return
      }

      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transformerId: form.transformerId,
          clientId,
          invoiceAmount: Number(form.invoiceAmount),
          deliveryAddress: form.deliveryAddress || null,
          transporterName: form.transporterName || null,
          notes: form.notes || null,
        }),
      })
      if (res.ok) {
        toast.success("Dispatch record created")
        setAddOpen(false)
        setForm(EMPTY_FORM)
        fetchDispatches()
        fetchCompletedTransformers()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to create dispatch")
      }
    } catch {
      toast.error("Failed to create dispatch")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDispatch) return
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {}
      if (updateForm.deliveryStatus) body.deliveryStatus = updateForm.deliveryStatus
      if (updateForm.trackingNumber) body.trackingNumber = updateForm.trackingNumber

      const res = await fetch(`/api/dispatch/${selectedDispatch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success("Dispatch updated")
        setUpdateOpen(false)
        fetchDispatches()
      } else {
        toast.error("Failed to update dispatch")
      }
    } catch {
      toast.error("Failed to update dispatch")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDispatch) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/dispatch/${selectedDispatch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: Number(updateForm.paidAmount) }),
      })
      if (res.ok) {
        toast.success("Payment recorded")
        setPaymentOpen(false)
        fetchDispatches()
      } else {
        toast.error("Failed to record payment")
      }
    } catch {
      toast.error("Failed to record payment")
    } finally {
      setSubmitting(false)
    }
  }

  const openUpdate = (d: DispatchWithRelations) => {
    setSelectedDispatch(d)
    setUpdateForm({ deliveryStatus: d.deliveryStatus, trackingNumber: "", paidAmount: "" })
    setUpdateOpen(true)
  }

  const openPayment = (d: DispatchWithRelations) => {
    setSelectedDispatch(d)
    setUpdateForm({ deliveryStatus: d.deliveryStatus, trackingNumber: "", paidAmount: String(d.paidAmount ?? 0) })
    setPaymentOpen(true)
  }

  const filtered = dispatches.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.invoiceNumber?.toLowerCase().includes(q) ||
      d.transformer?.modelNumber?.toLowerCase().includes(q) ||
      d.client?.name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Dispatch Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage shipments, invoicing, and delivery tracking
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setNewClientMode(false); setAddOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Dispatch
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice, model, client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted"
              />
            </div>
            <Select value={statusFilter || "ALL"} onValueChange={(v) => setStatusFilter(v === "ALL" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {DELIVERY_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
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
                <Truck className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                <p className="text-sm">Loading dispatch records...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No dispatch records found</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Invoice No.</TableHead>
                  <TableHead className="text-muted-foreground">Transformer</TableHead>
                  <TableHead className="text-muted-foreground">Client</TableHead>
                  <TableHead className="text-muted-foreground">Invoice Amount</TableHead>
                  <TableHead className="text-muted-foreground">Payment</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Transporter</TableHead>
                  <TableHead className="text-muted-foreground">Dispatch Date</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => {
                  const paid = d.paidAmount ?? 0
                  const total = d.invoiceAmount ?? 0
                  const paymentPct = total > 0 ? Math.round((paid / total) * 100) : 0
                  return (
                    <TableRow key={d.id} className="border-border hover:bg-muted/50">
                      <TableCell>
                        <p className="font-mono text-sm font-medium text-foreground">{d.invoiceNumber}</p>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {d.transformer?.modelNumber ?? "—"}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-foreground">{d.client?.name ?? "—"}</p>
                        {d.client?.phone && (
                          <p className="text-xs text-muted-foreground">{d.client.phone}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-foreground font-mono">
                        {formatCurrency(total)}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-24">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className={cn(
                              "font-medium",
                              paymentPct >= 100 ? "text-emerald-400" : paymentPct > 0 ? "text-amber-400" : "text-red-400"
                            )}>
                              {paymentPct}%
                            </span>
                            <span className="text-muted-foreground">{formatCurrency(paid)}</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                paymentPct >= 100 ? "bg-emerald-500" : paymentPct > 0 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${Math.max(paymentPct, 2)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getDeliveryBadge(d.deliveryStatus)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {d.transporterName ?? "—"}
                        {d.trackingNumber && (
                          <p className="text-xs font-mono text-primary">{d.trackingNumber}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {d.dispatchDate ? formatDate(d.dispatchDate) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => openUpdate(d)}>
                              <Truck className="w-4 h-4 mr-2 text-primary" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => openPayment(d)}>
                              <CreditCard className="w-4 h-4 mr-2 text-emerald-400" />
                              Record Payment
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

      {/* Create Dispatch Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Dispatch Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Transformer (Completed Status) *</Label>
              <Select value={form.transformerId} onValueChange={(v) => setForm({ ...form, transformerId: v })}>
                <SelectTrigger className="bg-muted">
                  <SelectValue placeholder="Select completed transformer" />
                </SelectTrigger>
                <SelectContent>
                  {completedTransformers.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-muted-foreground">
                      No completed transformers available
                    </div>
                  ) : (
                    completedTransformers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.modelNumber}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Client selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Client *</Label>
                <button
                  type="button"
                  onClick={() => { setNewClientMode(!newClientMode); setForm({ ...form, clientId: "", newClientName: "", newClientEmail: "", newClientPhone: "" }) }}
                  className="text-xs text-primary hover:underline"
                >
                  {newClientMode ? "Select existing client" : "+ Create new client"}
                </button>
              </div>
              {newClientMode ? (
                <div className="space-y-2 p-3 rounded-lg bg-muted border border-border">
                  <Input
                    value={form.newClientName}
                    onChange={(e) => setForm({ ...form, newClientName: e.target.value })}
                    placeholder="Client name *"
                    className="bg-background"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={form.newClientEmail}
                      onChange={(e) => setForm({ ...form, newClientEmail: e.target.value })}
                      placeholder="Email"
                      className="bg-background"
                    />
                    <Input
                      value={form.newClientPhone}
                      onChange={(e) => setForm({ ...form, newClientPhone: e.target.value })}
                      placeholder="Phone"
                      className="bg-background"
                    />
                  </div>
                </div>
              ) : (
                <Select value={form.clientId || "NONE"} onValueChange={(v) => setForm({ ...form, clientId: v === "NONE" ? "" : v })}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Select a client...</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Invoice Amount (INR) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.invoiceAmount}
                onChange={(e) => setForm({ ...form, invoiceAmount: e.target.value })}
                placeholder="e.g. 500000"
                required
                className="bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Delivery Address</Label>
              <Input
                value={form.deliveryAddress}
                onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                placeholder="Full delivery address"
                className="bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Transporter Name</Label>
              <Input
                value={form.transporterName}
                onChange={(e) => setForm({ ...form, transporterName: e.target.value })}
                placeholder="e.g. ABC Logistics"
                className="bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
                className="bg-muted"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  creatingClient ||
                  !form.transformerId ||
                  !form.invoiceAmount ||
                  (!newClientMode && !form.clientId) ||
                  (newClientMode && !form.newClientName)
                }
              >
                {submitting || creatingClient ? "Creating..." : "Create Dispatch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Delivery Status</DialogTitle>
          </DialogHeader>
          {selectedDispatch && (
            <form onSubmit={handleUpdate} className="space-y-4 mt-2">
              <div className="p-3 rounded-lg bg-muted border border-border">
                <p className="text-sm font-medium text-foreground">{selectedDispatch.invoiceNumber}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedDispatch.transformer?.modelNumber} — {selectedDispatch.client?.name}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Delivery Status</Label>
                <Select
                  value={updateForm.deliveryStatus}
                  onValueChange={(v) => setUpdateForm({ ...updateForm, deliveryStatus: v })}
                >
                  <SelectTrigger className="bg-muted">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tracking Number</Label>
                <Input
                  value={updateForm.trackingNumber}
                  onChange={(e) => setUpdateForm({ ...updateForm, trackingNumber: e.target.value })}
                  placeholder="e.g. TRK123456"
                  className="bg-muted"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setUpdateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Updating..." : "Update"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedDispatch && (
            <form onSubmit={handleRecordPayment} className="space-y-4 mt-2">
              <div className="p-3 rounded-lg bg-muted border border-border">
                <p className="text-sm font-medium text-foreground">{selectedDispatch.invoiceNumber}</p>
                <div className="flex gap-4 mt-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice</p>
                    <p className="text-sm font-mono text-foreground">{formatCurrency(selectedDispatch.invoiceAmount ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Currently Paid</p>
                    <p className="text-sm font-mono text-emerald-400">{formatCurrency(selectedDispatch.paidAmount ?? 0)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Total Paid Amount (INR) *</Label>
                <Input
                  type="number"
                  min="0"
                  max={selectedDispatch.invoiceAmount ?? undefined}
                  step="0.01"
                  value={updateForm.paidAmount}
                  onChange={(e) => setUpdateForm({ ...updateForm, paidAmount: e.target.value })}
                  placeholder="Enter cumulative paid amount"
                  required
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the total cumulative paid amount (not just this payment).
                </p>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Recording..." : "Record Payment"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
