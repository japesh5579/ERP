"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Plus, Search, Users, MoreHorizontal, Pencil, PowerOff, AlertTriangle,
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
import { cn, formatDate, ROLE_LABELS } from "@/lib/utils"
import type { User } from "@/types"

const ROLES = Object.entries(ROLE_LABELS)

function getRoleBadge(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return <Badge className="bg-violet-400/10 text-violet-400 border-transparent">Super Admin</Badge>
    case "PRODUCTION_MANAGER":
      return <Badge variant="default">Production Manager</Badge>
    case "INVENTORY_MANAGER":
      return <Badge variant="success">Inventory Manager</Badge>
    case "QUALITY_ENGINEER":
      return <Badge variant="warning">Quality Engineer</Badge>
    case "DISPATCH_STAFF":
      return <Badge variant="secondary">Dispatch Staff</Badge>
    default:
      return <Badge variant="outline">{role}</Badge>
  }
}

const EMPTY_ADD_FORM = {
  name: "",
  email: "",
  password: "",
  role: "",
}

const EMPTY_EDIT_FORM = {
  name: "",
  role: "",
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM)
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/users")
      if (res.status === 403) {
        // Non-admin: can't see users
        setCurrentUserRole("RESTRICTED")
        setLoading(false)
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) {
        setUsers(data)
        setCurrentUserRole("SUPER_ADMIN")
      } else if (data.users) {
        setUsers(data.users)
        setCurrentUserRole(data.currentUserRole)
      }
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const openEdit = (u: User) => {
    setSelectedUser(u)
    setEditForm({ name: u.name, role: u.role })
    setEditOpen(true)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      })
      if (res.ok) {
        toast.success("User created successfully")
        setAddOpen(false)
        setAddForm(EMPTY_ADD_FORM)
        fetchUsers()
      } else {
        const err = await res.json()
        toast.error(err.error ?? "Failed to create user")
      }
    } catch {
      toast.error("Failed to create user")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        toast.success("User updated")
        setEditOpen(false)
        fetchUsers()
      } else {
        toast.error("Failed to update user")
      }
    } catch {
      toast.error("Failed to update user")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !selectedUser.active }),
      })
      if (res.ok) {
        toast.success(selectedUser.active ? "User deactivated" : "User activated")
        setDeactivateOpen(false)
        fetchUsers()
      } else {
        toast.error("Failed to update user status")
      }
    } catch {
      toast.error("Failed to update user status")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  })

  const isSuperAdmin = currentUserRole === "SUPER_ADMIN"

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage system users and their roles
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => { setAddForm(EMPTY_ADD_FORM); setAddOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      {/* Warning for non-admins */}
      {!isSuperAdmin && currentUserRole !== null && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">Limited Access</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You have read-only access to user management. Only Super Admins can create or modify users.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
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
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                <p className="text-sm">Loading users...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No users found</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Created</TableHead>
                  {isSuperAdmin && (
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-foreground">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="font-medium text-foreground">{u.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>
                      {u.active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(u)}>
                              <Pencil className="w-4 h-4 mr-2 text-primary" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => { setSelectedUser(u); setDeactivateOpen(true) }}
                            >
                              <PowerOff className={`w-4 h-4 mr-2 ${u.active ? "text-amber-400" : "text-emerald-400"}`} />
                              {u.active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="e.g. Rajesh Kumar"
                required
                className="bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="user@company.com"
                required
                className="bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                className="bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select value={addForm.role} onValueChange={(v) => setAddForm({ ...addForm, role: v })}>
                <SelectTrigger className="bg-muted">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting || !addForm.role}>
                {submitting ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="bg-muted"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger className="bg-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedUser?.active ? "Deactivate" : "Activate"} User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to {selectedUser?.active ? "deactivate" : "activate"}{" "}
            <span className="text-foreground font-medium">{selectedUser?.name}</span>?
            {selectedUser?.active && (
              <span className="block mt-1 text-amber-400">
                This will prevent them from signing in.
              </span>
            )}
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeactivateOpen(false)}>Cancel</Button>
            <Button
              variant={selectedUser?.active ? "destructive" : "default"}
              onClick={handleToggleActive}
              disabled={submitting}
            >
              {submitting ? "Updating..." : selectedUser?.active ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
