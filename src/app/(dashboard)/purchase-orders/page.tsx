"use client"

import React, { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Plus, Search, ShoppingCart, MoreHorizontal, CheckCircle2, ChevronDown, ChevronUp, Trash2,
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
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Vendor, RawMaterial } from "@/types"

const PO_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "ORDERED", label: "Ordered" },
  { value: "RECEIVED", label: "Received" },
  { value: "CANCELLED", label: "Cancelled" },
]

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING": return <Badge variant="warning">Pending</Badge>
    case "APPROVED": return <Badge variant="default">Approved</Badge>
    case "ORDERED": return <Badge variant="default">Ordered</Badge>
    case "RECEIVED": return <Badge variant="success">Received</Badge>
    case "CANCELLED": return <Badge variant="destructive">Cancelled</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

type POItem = {
  materialId: string
  quantity: string
  unitPrice: string
}

type POListItem = {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  expectedDate: string | null
  createdAt: string
  notes: string | null
  vendor: { id: string; name: string; email: string | null; phone: string | null }
  _count?: { items: number }
}

type PODetail = POListItem & {
  items: {
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    material: { id: string; name: string; unit: string }
  }[]
}

const EMPTY_FORM = {
  vendorId: "",
  expectedDate: "",
  notes: "",
}

const EMPTY_LINE: POItem = { materialId: "", quantity: "", unitPrice: "" }

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<POListItem[]>([])
  const [expandedDetails, setExpandedDetails] = useState<Record<string, PODetail>>({})
  const [loadingExpand, setLoadingExpand] = useState<Record<string, boolean>>({})
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [search, setSearch] = useState("")
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [lineItems, setLineItems] = useState<POItem[]>([{ ...EMPTY_LINE }])
  const [submitting, setSubmitting] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(`/api/purchase-orders?${params}`)
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Failed to load purchase orders")
    } finally {
      setLoading(false)
    }
  }

  const fetchVendorsAndMaterials = async () => {
    try {
      const [vRes, mRes] = await Promise.all([
        fetch("/api/vendors"),
        fetch("/api/inventory"),
      ])
      const [vData, mData] = await Promise.all([vRes.json(), mRes.json()])
      setVendors(Array.isArray(vData) ? vData : [])
      setMaterials(Array.isArray(mData) ? mData : [])
    } catch {}
  }

  useEffect(() => { fetchOrders(); fetchVendorsAndMaterials() }, [])
  useEffect(() => { fetchOrders() }, [statusFilter])

  const fetchOrderDetail = async (orderId: string) => {
    if (expandedDetails[orderId]) return // Already loaded
    setLoadingExpand((prev) => ({ ...prev, [orderId]: true }))
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}`)
      if (res.ok) {
        const data = await res.json()
        setExpandedDetails((prev) => ({ ...prev, [orderId]: data }))
      }
    } catch {
    } finally {
      setLoadingExpand((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  const toggleExpand = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null)
    } else {
      setExpandedOrder(orderId)
      fetchOrderDetail(orderId)
    }
  }

  const addLineItem = () => setLineItems([...lineItems, { ...EMPTY_LINE }])
  const removeLineItem = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx))
  const updateLineItem = (idx: number, field: keyof POItem, value: string) => {
    const updated = [...lineItems]
    updated[idx] = { ...updated[idx], [field]: value }
    setLineItems(updated)
  }

  const totalAmount = lineItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unitPrice) || 0
    return sum + qty * price
  }, 0)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const validItems = lineItems.filter((i) => i.materialId && i.quantity && i.unitPrice)
    if (validItems.length === 0) {
      toast.error("Add at least one line item")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: form.vendorId,
          expectedDate: form.expectedDate || null,
          notes: form.notes || null,
          items: validItems.map((i) => ({
            materialId: i.materialId,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
          })),
        }),
      })
      if (res.ok) {
        toast.success("Purchase order created")
        setAddOpen(false)
        setForm(EMPTY_FORM)
        setLineItems([{ ...EMPTY_LINE }])
        fetchOrders()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to create purchase order")
      }
    } catch {
      toast.error("Failed to create purchase order")
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(`Order status updated to ${PO_STATUSES.find((s) => s.value === status)?.label ?? status}`)
        fetchOrders()
        // Invalidate cached detail
        setExpandedDetails((prev) => {
          const next = { ...prev }
          delete next[orderId]
          return next
        })
      } else {
        toast.error("Failed to update order")
      }
    } catch {
      toast.error("Failed to update order")
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.vendor?.name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Purchase Orders</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and manage material purchase orders
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setLineItems([{ ...EMPTY_LINE }]); setAddOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Create PO
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by order no. or vendor..."
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
                {PO_STATUSES.map((s) => (
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
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                <p className="text-sm">Loading purchase orders...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No purchase orders found</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-8" />
                  <TableHead className="text-muted-foreground">Order No.</TableHead>
                  <TableHead className="text-muted-foreground">Vendor</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Total Amount</TableHead>
                  <TableHead className="text-muted-foreground">Expected Date</TableHead>
                  <TableHead className="text-muted-foreground">Items</TableHead>
                  <TableHead className="text-muted-foreground">Created</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((o) => {
                  const isExpanded = expandedOrder === o.id
                  const detail = expandedDetails[o.id]
                  const isLoadingDetail = loadingExpand[o.id]

                  return (
                    <React.Fragment key={o.id}>
                      <TableRow className="border-border hover:bg-muted/50">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleExpand(o.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <p className="font-mono text-sm font-medium text-foreground">{o.orderNumber}</p>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{o.vendor?.name ?? "—"}</TableCell>
                        <TableCell>{getStatusBadge(o.status)}</TableCell>
                        <TableCell className="font-mono text-sm text-foreground">
                          {formatCurrency(o.totalAmount ?? 0)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {o.expectedDate ? formatDate(o.expectedDate) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {o._count?.items ?? "?"} items
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border">
                              {o.status !== "RECEIVED" && o.status !== "CANCELLED" && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-emerald-400 focus:text-emerald-400"
                                  onClick={() => handleStatusUpdate(o.id, "RECEIVED")}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Mark as Received
                                </DropdownMenuItem>
                              )}
                              {o.status === "PENDING" && (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => handleStatusUpdate(o.id, "APPROVED")}
                                  >
                                    Approve Order
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-red-400 focus:text-red-400"
                                    onClick={() => handleStatusUpdate(o.id, "CANCELLED")}
                                  >
                                    Cancel Order
                                  </DropdownMenuItem>
                                </>
                              )}
                              {o.status === "APPROVED" && (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => handleStatusUpdate(o.id, "ORDERED")}
                                >
                                  Mark as Ordered
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* Expanded row */}
                      {isExpanded && (
                        <TableRow className="border-border bg-muted/20">
                          <TableCell colSpan={9} className="p-0">
                            <div className="px-10 py-4">
                              {isLoadingDetail ? (
                                <p className="text-sm text-muted-foreground">Loading items...</p>
                              ) : detail ? (
                                <>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                    Line Items
                                  </p>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="text-xs text-muted-foreground">
                                        <th className="text-left pb-2 font-medium">Material</th>
                                        <th className="text-right pb-2 font-medium">Quantity</th>
                                        <th className="text-right pb-2 font-medium">Unit Price</th>
                                        <th className="text-right pb-2 font-medium">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {detail.items.map((item) => (
                                        <tr key={item.id} className="border-t border-border/50">
                                          <td className="py-2 text-foreground">{item.material?.name ?? "—"}</td>
                                          <td className="py-2 text-right text-muted-foreground font-mono">
                                            {item.quantity} {item.material?.unit ?? ""}
                                          </td>
                                          <td className="py-2 text-right text-muted-foreground font-mono">
                                            {formatCurrency(item.unitPrice)}
                                          </td>
                                          <td className="py-2 text-right text-foreground font-mono font-medium">
                                            {formatCurrency(item.totalPrice)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="border-t border-border">
                                        <td colSpan={3} className="pt-2 text-right font-semibold text-muted-foreground text-xs">
                                          ORDER TOTAL
                                        </td>
                                        <td className="pt-2 text-right font-bold text-foreground font-mono">
                                          {formatCurrency(detail.totalAmount ?? 0)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                  {detail.notes && (
                                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                                      <span className="font-medium">Notes:</span> {detail.notes}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground">Failed to load items</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create PO Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5 mt-2">
            {/* PO Header */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Vendor *</Label>
                <Select value={form.vendorId} onValueChange={(v) => setForm({ ...form, vendorId: v })}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.filter((v) => v.active).map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={form.expectedDate}
                  onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
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
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">
                  Line Items
                  <span className="text-muted-foreground font-normal ml-2">
                    ({lineItems.filter((i) => i.materialId).length} added)
                  </span>
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-muted overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted border-b border-border">
                  <div className="col-span-5 text-xs font-medium text-muted-foreground">Material</div>
                  <div className="col-span-2 text-xs font-medium text-muted-foreground">Quantity</div>
                  <div className="col-span-3 text-xs font-medium text-muted-foreground">Unit Price (₹)</div>
                  <div className="col-span-1 text-xs font-medium text-muted-foreground text-right">Total</div>
                  <div className="col-span-1" />
                </div>
                {/* Items */}
                <div className="divide-y divide-border/50">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-2 items-center">
                      <div className="col-span-5">
                        <Select value={item.materialId || "NONE"} onValueChange={(v) => updateLineItem(idx, "materialId", v === "NONE" ? "" : v)}>
                          <SelectTrigger className="bg-background h-8 text-xs border-border/50">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">Select material...</SelectItem>
                            {materials.map((m) => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                          className="bg-background h-8 text-xs border-border/50"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Unit price"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(idx, "unitPrice", e.target.value)}
                          className="bg-background h-8 text-xs border-border/50"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="text-xs font-mono text-muted-foreground">
                          {item.quantity && item.unitPrice
                            ? formatCurrency(Number(item.quantity) * Number(item.unitPrice))
                            : "—"}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => removeLineItem(idx)}
                          disabled={lineItems.length === 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {totalAmount > 0 && (
                <div className="flex items-center justify-end mt-3 pt-3 border-t border-border gap-3">
                  <span className="text-sm text-muted-foreground">Order Total:</span>
                  <span className="text-xl font-bold text-foreground font-mono">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting || !form.vendorId}>
                {submitting ? "Creating..." : "Create Purchase Order"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
