"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Search, Store, MoreHorizontal, Pencil, PowerOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
import type { Vendor } from "@/types"

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  address: "",
  gstNumber: "",
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/vendors?all=true")
      const data = await res.json()
      setVendors(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Failed to load vendors")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVendors() }, [])

  const openEdit = (v: Vendor) => {
    setSelectedVendor(v)
    setForm({
      name: v.name,
      email: v.email ?? "",
      phone: v.phone ?? "",
      address: v.address ?? "",
      gstNumber: v.gstNumber ?? "",
    })
    setEditOpen(true)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
          gstNumber: form.gstNumber || null,
        }),
      })
      if (res.ok) {
        toast.success("Vendor added successfully")
        setAddOpen(false)
        setForm(EMPTY_FORM)
        fetchVendors()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to add vendor")
      }
    } catch {
      toast.error("Failed to add vendor")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVendor) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/vendors/${selectedVendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
          gstNumber: form.gstNumber || null,
        }),
      })
      if (res.ok) {
        toast.success("Vendor updated")
        setEditOpen(false)
        fetchVendors()
      } else {
        toast.error("Failed to update vendor")
      }
    } catch {
      toast.error("Failed to update vendor")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async () => {
    if (!selectedVendor) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/vendors/${selectedVendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !selectedVendor.active }),
      })
      if (res.ok) {
        toast.success(selectedVendor.active ? "Vendor deactivated" : "Vendor activated")
        setDeactivateOpen(false)
        fetchVendors()
      } else {
        toast.error("Failed to update vendor status")
      }
    } catch {
      toast.error("Failed to update vendor status")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredVendors = vendors.filter((v) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      v.name.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.phone?.toLowerCase().includes(q) ||
      v.gstNumber?.toLowerCase().includes(q)
    )
  })

  const VendorForm = ({ onSubmit }: { onSubmit: (e: React.FormEvent) => void }) => (
    <form onSubmit={onSubmit} className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Vendor Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Steel Corp India"
            required
            className="bg-muted"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="vendor@example.com"
            className="bg-muted"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+91 98765 43210"
            className="bg-muted"
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>GST Number</Label>
          <Input
            value={form.gstNumber}
            onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
            placeholder="e.g. 07AABCU9603R1ZP"
            className="bg-muted"
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Address</Label>
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Full vendor address"
            className="bg-muted"
          />
        </div>
      </div>
      <DialogFooter className="gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => { setAddOpen(false); setEditOpen(false) }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : addOpen ? "Add Vendor" : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Vendor Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage material suppliers and vendors
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setAddOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors by name, email, phone, or GST..."
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
                <Store className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                <p className="text-sm">Loading vendors...</p>
              </div>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No vendors found</p>
                <p className="text-xs mt-1">Add your first vendor to get started</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Phone</TableHead>
                  <TableHead className="text-muted-foreground">GST Number</TableHead>
                  <TableHead className="text-muted-foreground">Address</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Added</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((v) => (
                  <TableRow key={v.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <p className="font-medium text-foreground">{v.name}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.email ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.phone ?? "—"}</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{v.gstNumber ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-40">
                      <span className="truncate block">{v.address ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      {v.active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(v.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(v)}>
                            <Pencil className="w-4 h-4 mr-2 text-primary" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => { setSelectedVendor(v); setDeactivateOpen(true) }}
                          >
                            <PowerOff
                              className={`w-4 h-4 mr-2 ${v.active ? "text-amber-400" : "text-emerald-400"}`}
                            />
                            {v.active ? "Deactivate" : "Activate"}
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

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <VendorForm onSubmit={handleAdd} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
          </DialogHeader>
          <VendorForm onSubmit={handleEdit} />
        </DialogContent>
      </Dialog>

      {/* Toggle Active Dialog */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selectedVendor?.active ? "Deactivate" : "Activate"} Vendor
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to {selectedVendor?.active ? "deactivate" : "activate"}{" "}
            <span className="text-foreground font-medium">{selectedVendor?.name}</span>?
            {selectedVendor?.active && (
              <span className="block mt-1 text-amber-400 text-xs">
                Deactivated vendors will not appear in material selections.
              </span>
            )}
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeactivateOpen(false)}>Cancel</Button>
            <Button
              variant={selectedVendor?.active ? "destructive" : "default"}
              onClick={handleToggleActive}
              disabled={submitting}
            >
              {submitting
                ? "Updating..."
                : selectedVendor?.active
                ? "Deactivate"
                : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
