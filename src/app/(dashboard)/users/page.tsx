"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Plus, Search, Users, MoreHorizontal, Pencil, PowerOff,
  Shield, HardHat, Eye, EyeOff,
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatDate, ROLE_LABELS } from "@/lib/utils"
import type { User } from "@/types"

function getRoleBadge(role: string) {
  if (role === "ADMIN") return (
    <Badge className="bg-blue-100 text-blue-700 border-transparent gap-1">
      <Shield className="w-3 h-3" />Admin
    </Badge>
  )
  return (
    <Badge className="bg-green-100 text-green-700 border-transparent gap-1">
      <HardHat className="w-3 h-3" />Worker
    </Badge>
  )
}

const EMPTY_FORM = { name: "", email: "", password: "", role: "WORKER" }
const EMPTY_EDIT = { name: "", role: "" }

export default function WorkersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [search, setSearch] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [toggleOpen, setToggleOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [editForm, setEditForm] = useState(EMPTY_EDIT)
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/users")
      if (res.status === 403) { setLoading(false); return }
      const data = await res.json()
      if (Array.isArray(data)) { setUsers(data); setIsAdmin(true) }
    } catch { toast.error("Failed to load users") }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      })
      if (res.ok) { toast.success("Worker account created"); setAddOpen(false); setAddForm(EMPTY_FORM); fetchUsers() }
      else { const err = await res.json(); toast.error(err.error ?? "Failed") }
    } catch { toast.error("Failed to create user") }
    finally { setSubmitting(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedUser) return; setSubmitting(true)
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (res.ok) { toast.success("Updated"); setEditOpen(false); fetchUsers() }
      else { toast.error("Failed to update") }
    } catch { toast.error("Failed to update user") }
    finally { setSubmitting(false) }
  }

  const handleToggle = async () => {
    if (!selectedUser) return; setSubmitting(true)
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !selectedUser.active }),
      })
      if (res.ok) { toast.success(selectedUser.active ? "Account deactivated" : "Account activated"); setToggleOpen(false); fetchUsers() }
      else { toast.error("Failed") }
    } catch { toast.error("Failed") }
    finally { setSubmitting(false) }
  }

  const filtered = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
  })

  const workerCount = users.filter((u) => u.role === "WORKER").length
  const adminCount  = users.filter((u) => u.role === "ADMIN").length
  const activeCount = users.filter((u) => u.active).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Workers</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage team accounts and roles</p>
        </div>
        {isAdmin && (
          <Button size="sm" className="h-9 text-sm" onClick={() => { setAddForm(EMPTY_FORM); setAddOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" />Add Worker
          </Button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{users.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Total</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{workerCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Workers</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Active</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 bg-white border-border"
        />
      </div>

      {/* User cards */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
          <Users className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">No users found</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((u) => {
            const initials = u.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
            return (
              <div key={u.id} className={cn(
                "bg-white rounded-2xl border border-border p-3.5 flex items-center gap-3 transition-all",
                !u.active && "opacity-60"
              )}>
                {/* Avatar */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0",
                  u.role === "ADMIN" ? "bg-blue-600" : "bg-green-600"
                )}>
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm">{u.name}</p>
                    {getRoleBadge(u.role)}
                    {!u.active && <Badge variant="destructive" className="text-[10px]">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{u.email}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">Added {formatDate(u.createdAt)}</p>
                </div>

                {/* Actions */}
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border-border">
                      <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => {
                        setSelectedUser(u); setEditForm({ name: u.name, role: u.role }); setEditOpen(true)
                      }}>
                        <Pencil className="w-4 h-4 mr-2 text-blue-600" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => { setSelectedUser(u); setToggleOpen(true) }}>
                        <PowerOff className={cn("w-4 h-4 mr-2", u.active ? "text-amber-500" : "text-emerald-500")} />
                        {u.active ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Worker Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-white border-border max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Add New Worker</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="e.g. Rajesh Kumar" required className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address *</Label>
              <Input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="worker@company.com" required className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Min. 8 characters" required minLength={8} className="h-11 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select value={addForm.role} onValueChange={(v) => setAddForm({ ...addForm, role: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WORKER">
                    <div className="flex items-center gap-2"><HardHat className="w-4 h-4 text-green-600" />Worker</div>
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-600" />Admin</div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Workers can only record usage. Admins have full access.</p>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Account"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-white border-border max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WORKER">Worker</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Activate/Deactivate Dialog */}
      <Dialog open={toggleOpen} onOpenChange={setToggleOpen}>
        <DialogContent className="bg-white border-border max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>{selectedUser?.active ? "Deactivate" : "Activate"} Account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {selectedUser?.active ? "Deactivate" : "Activate"} <span className="text-foreground font-medium">{selectedUser?.name}</span>?
            {selectedUser?.active && <span className="block mt-1 text-amber-600 text-xs">This will prevent them from signing in.</span>}
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setToggleOpen(false)}>Cancel</Button>
            <Button variant={selectedUser?.active ? "destructive" : "default"} onClick={handleToggle} disabled={submitting}>
              {submitting ? "Updating..." : selectedUser?.active ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
