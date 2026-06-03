"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import {
  Plus, Search, Package, Pencil, Trash2, MinusCircle, MoreHorizontal,
  History, TrendingUp, AlertTriangle, ArrowDownCircle, ArrowUpCircle,
  X, PlusCircle, Mic, MicOff, Bot, Send, ChevronDown, ImageIcon, Filter,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn, formatCurrency, formatDateTime, CATEGORY_LABELS } from "@/lib/utils"
import type { RawMaterialWithVendor, Vendor } from "@/types"

/* ── Constants ─────────────────────────────────────────────────────────── */
const CATEGORIES = Object.entries(CATEGORY_LABELS)
const LOW = 10

type StockStatus = "critical" | "low" | "ok"

const CATEGORY_GRADIENTS: Record<string, { bg: string; text: string }> = {
  COPPER_COIL:      { bg: "from-orange-400 to-amber-500",   text: "text-orange-700" },
  CRGO_STEEL:       { bg: "from-slate-400 to-gray-500",     text: "text-slate-700"  },
  TRANSFORMER_OIL:  { bg: "from-blue-400 to-cyan-500",      text: "text-blue-700"   },
  BUSHINGS:         { bg: "from-purple-400 to-violet-500",  text: "text-purple-700" },
  INSULATION:       { bg: "from-yellow-400 to-lime-500",    text: "text-yellow-700" },
  CORE_FRAME:       { bg: "from-zinc-400 to-stone-500",     text: "text-zinc-700"   },
  TAPPING_SWITCH:   { bg: "from-green-400 to-emerald-500",  text: "text-green-700"  },
  COOLING_RADIATOR: { bg: "from-sky-400 to-blue-500",       text: "text-sky-700"    },
  PACKAGING:        { bg: "from-pink-400 to-rose-500",      text: "text-pink-700"   },
  OTHER:            { bg: "from-gray-400 to-slate-500",     text: "text-gray-700"   },
}

function getStatus(cur: number, min: number): StockStatus {
  if (cur < min) return "critical"
  if (cur < min * 1.25) return "low"
  return "ok"
}

function StockPill({ current, minimum }: { current: number; minimum: number }) {
  const s = getStatus(current, minimum)
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
      s === "critical" ? "bg-red-100 text-red-700" :
      s === "low"      ? "bg-orange-100 text-orange-700" :
                         "bg-emerald-100 text-emerald-700"
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full",
        s === "critical" ? "bg-red-500" : s === "low" ? "bg-orange-500" : "bg-emerald-500"
      )} />
      {s === "critical" ? "Critical" : s === "low" ? "Low" : "OK"}
    </span>
  )
}

/* Fuzzy search helper */
function levenshtein(a: string, b: string) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

function parseName(name: string) {
  const m = name.match(/^(.+?)\s*\((.+?)\)/)
  return m ? { base: m[1].trim(), variant: m[2].trim() } : { base: name, variant: null }
}

type Movement = { id: string; type: "IN"|"OUT"; quantity: number; date: string; reference: string; notes: string|null; balanceAfter: number }

const EMPTY_FORM = { name:"",category:"",currentStock:"",unit:"",minimumStock:"10",unitPrice:"",location:"",description:"",vendorId:"",imageUrl:"" }
const EMPTY_USE  = { quantity:"", notes:"" }
const EMPTY_RST  = { quantity:"", notes:"" }

/* ── Props ──────────────────────────────────────────────────────────────── */
interface Props { isAdmin: boolean; userId: string; userName: string }

export default function InventoryClient({ isAdmin }: Props) {
  const [materials, setMaterials] = useState<RawMaterialWithVendor[]>([])
  const [vendors,   setVendors]   = useState<Vendor[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState("")
  const [catFilter, setCatFilter] = useState("")
  const [viewMode,  setViewMode]  = useState<"shelf"|"table">("shelf")

  const [addOpen,     setAddOpen]     = useState(false)
  const [editOpen,    setEditOpen]    = useState(false)
  const [useOpen,     setUseOpen]     = useState(false)
  const [restockOpen, setRestockOpen] = useState(false)
  const [deleteOpen,  setDeleteOpen]  = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [alertOpen,   setAlertOpen]   = useState(false)
  const [alertShown,  setAlertShown]  = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [successMsg,  setSuccessMsg]  = useState("")

  const [selected,  setSelected]  = useState<RawMaterialWithVendor | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [movLoad,   setMovLoad]   = useState(false)

  const [form,    setForm]    = useState(EMPTY_FORM)
  const [useForm, setUseForm] = useState(EMPTY_USE)
  const [rstForm, setRstForm] = useState(EMPTY_RST)
  const [saving,  setSaving]  = useState(false)

  /* AI chat */
  type Msg = { role:"user"|"ai"; text:string }
  const [chatOpen,  setChatOpen]  = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatMsgs,  setChatMsgs]  = useState<Msg[]>([
    { role:"ai", text:'Hi! Try: "use 10 copper coil", "add 50 transformer oil", or "search steel".' }
  ])
  const [listening, setListening] = useState(false)
  const chatEnd = useRef<HTMLDivElement>(null)

  /* ── Fetch ──────────────────────────────────────────────────────────── */
  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (search)   p.set("search",   search)
      if (catFilter && catFilter !== "ALL") p.set("category", catFilter)
      const r = await fetch(`/api/inventory?${p}`)
      const d = await r.json()
      const list: RawMaterialWithVendor[] = Array.isArray(d) ? d : []
      setMaterials(list)
      if (!alertShown && list.some((m) => m.currentStock < LOW || m.currentStock < m.minimumStock)) {
        setAlertOpen(true); setAlertShown(true)
      }
    } catch { toast.error("Failed to load inventory") }
    finally { setLoading(false) }
  }, [search, catFilter, alertShown])

  useEffect(() => { fetch_() }, [fetch_])
  useEffect(() => { if (isAdmin) fetch("/api/vendors").then((r) => r.json()).then((d) => setVendors(Array.isArray(d) ? d : [])).catch(() => {}) }, [isAdmin])

  /* ── Actions ──────────────────────────────────────────────────────── */
  const openUse     = (m: RawMaterialWithVendor) => { setSelected(m); setUseForm(EMPTY_USE); setUseOpen(true) }
  const openRestock = (m: RawMaterialWithVendor) => { setSelected(m); setRstForm(EMPTY_RST); setRestockOpen(true) }
  const openEdit    = (m: RawMaterialWithVendor) => {
    setSelected(m)
    setForm({ name:m.name, category:m.category, currentStock:String(m.currentStock), unit:m.unit,
      minimumStock:String(m.minimumStock), unitPrice:String(m.unitPrice??""), location:m.location??"",
      description:m.description??"", vendorId:m.vendorId??"", imageUrl:(m as any).imageUrl??"" })
    setEditOpen(true)
  }
  const openHistory = async (m: RawMaterialWithVendor) => {
    setSelected(m); setHistoryOpen(true); setMovLoad(true); setMovements([])
    try { const r = await fetch(`/api/inventory/${m.id}/movements`); setMovements((await r.json()).movements??[]) }
    catch { toast.error("Failed") } finally { setMovLoad(false) }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const r = await fetch("/api/inventory", { method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({...form, currentStock:+form.currentStock, minimumStock:+form.minimumStock,
          unitPrice:+form.unitPrice, vendorId:form.vendorId||null, imageUrl:form.imageUrl||null}) })
      if (r.ok) { toast.success("Material added"); setAddOpen(false); setForm(EMPTY_FORM); fetch_() }
      else { const e = await r.json(); toast.error(e.error??"Failed") }
    } catch { toast.error("Error") } finally { setSaving(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true)
    try {
      const r = await fetch(`/api/inventory/${selected.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({...form, currentStock:+form.currentStock, minimumStock:+form.minimumStock,
          unitPrice:+form.unitPrice, vendorId:form.vendorId||null, imageUrl:form.imageUrl||null}) })
      if (r.ok) { toast.success("Updated"); setEditOpen(false); fetch_() }
      else toast.error("Failed")
    } catch { toast.error("Error") } finally { setSaving(false) }
  }

  const handleUse = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true)
    try {
      const qty = +useForm.quantity
      const r = await fetch(`/api/inventory/${selected.id}/use`, { method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ quantity:qty, notes:useForm.notes||null }) })
      if (r.ok) {
        setUseOpen(false)
        const remaining = selected.currentStock - qty
        fetch_()
        if (remaining < LOW) {
          toast.warning(`⚠ Low stock: "${selected.name}" — only ${remaining} ${selected.unit} left!`, { duration:8000 })
        } else {
          setSuccessMsg(`✓  Recorded: −${qty} ${selected.unit} of ${selected.name}`)
          setSuccessOpen(true)
          setTimeout(() => setSuccessOpen(false), 3000)
        }
      } else {
        const err = await r.json(); toast.error(err.error??"Insufficient stock")
      }
    } catch { toast.error("Error") } finally { setSaving(false) }
  }

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true)
    try {
      const r = await fetch(`/api/inventory/${selected.id}/restock`, { method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ quantity:+rstForm.quantity, notes:rstForm.notes||null }) })
      if (r.ok) { toast.success(`Added +${rstForm.quantity} ${selected.unit}`); setRestockOpen(false); fetch_() }
      else { const e=await r.json(); toast.error(e.error??"Failed") }
    } catch { toast.error("Error") } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!selected) return; setSaving(true)
    try {
      const r = await fetch(`/api/inventory/${selected.id}`, { method:"DELETE" })
      if (r.ok) { toast.success("Deleted"); setDeleteOpen(false); fetch_() }
      else toast.error("Failed to delete")
    } catch { toast.error("Error") } finally { setSaving(false) }
  }

  /* ── AI Chat ────────────────────────────────────────────────────────── */
  const pushAI = (text: string) => {
    setChatMsgs(p => [...p, { role:"ai", text }])
    setTimeout(() => chatEnd.current?.scrollIntoView({ behavior:"smooth" }), 50)
  }
  const runCmd = useCallback((raw: string) => {
    const t = raw.trim().toLowerCase()
    if (!t) return
    setChatMsgs(p => [...p, { role:"user", text:raw }])
    setTimeout(() => chatEnd.current?.scrollIntoView({ behavior:"smooth" }), 50)
    const find = (hint: string) => {
      const h = hint.toLowerCase().trim(), hw = h.split(/\s+/)
      return materials.find(m=>m.name.toLowerCase()===h)
        || materials.find(m=>m.name.toLowerCase().startsWith(h))
        || materials.find(m=>m.name.toLowerCase().includes(h))
        || materials.find(m=>hw.every(w=>m.name.toLowerCase().includes(w)))
        || (() => { let b: typeof materials[0]|null=null, bd=3
          for (const m of materials) for (const nw of m.name.toLowerCase().split(/\s+/)) for (const w of hw) {
            const d=levenshtein(w,nw); if(d<bd){bd=d;b=m}
          } return b })()
    }
    const addM  = t.match(/^(?:add|restock|stock)\s+(\d+\.?\d*)\s*(?:\w+\s+)?(.+)$/)
    const useM  = t.match(/^(?:use|remove|take|consume|deduct)\s+(\d+\.?\d*)\s*(?:\w+\s+)?(.+)$/)
    const srchM = t.match(/^(?:search|find|show)\s+(.+)$/)
    if (addM && isAdmin) {
      const mat = find(addM[2]); if (!mat) { pushAI(`❌ "${addM[2]}" not found`); return }
      setRstForm({ quantity:addM[1], notes:`Via assistant: ${raw}` }); setSelected(mat); setRestockOpen(true)
      pushAI(`✅ Opening restock for "${mat.name}" — qty ${addM[1]}`); return
    }
    if (useM) {
      const mat = find(useM[2]); if (!mat) { pushAI(`❌ "${useM[2]}" not found`); return }
      setUseForm({ quantity:useM[1], notes:`Via assistant: ${raw}` }); setSelected(mat); setUseOpen(true)
      pushAI(`✅ Recording use of "${mat.name}" — qty ${useM[1]}`); return
    }
    if (srchM) { setSearch(srchM[1].trim()); pushAI(`🔍 Searching for "${srchM[1].trim()}"`); return }
    pushAI(`Commands:\n• "use 10 copper coil"\n• "search steel"\n${isAdmin?'• "add 50 transformer oil"':''}`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materials, isAdmin])

  const sendChat = () => { const t=chatInput.trim(); if(!t)return; setChatInput(""); runCmd(t) }
  const toggleVoice = () => {
    const SR=(window as any).SpeechRecognition??(window as any).webkitSpeechRecognition
    if(!SR){toast.error("Voice not supported");return}
    if(listening){setListening(false);return}
    const r=new SR(); r.lang="en-IN"; r.interimResults=false
    r.onresult=(e:any)=>{const s=e.results[0][0].transcript;setChatInput(s);runCmd(s)}
    r.onend=()=>setListening(false)
    r.onerror=()=>{setListening(false);toast.error("Voice error")}
    r.start();setListening(true)
  }

  const critical = materials.filter(m => m.currentStock < LOW || m.currentStock < m.minimumStock)

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {isAdmin ? "Inventory Management" : "Inventory"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAdmin ? "Manage stock, restocking, and item details" : "Tap an item to record usage"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          {isAdmin && (
            <div className="hidden md:flex items-center gap-1 p-1 bg-muted rounded-xl">
              {([["shelf","Shelf"],["table","Table"]] as const).map(([v, label]) => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                    viewMode===v ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {isAdmin && (
            <Button size="sm" className="h-10 text-sm gap-1.5" onClick={() => { setForm(EMPTY_FORM); setAddOpen(true) }}>
              <Plus className="w-4 h-4" />Add Item
            </Button>
          )}
        </div>
      </div>

      {/* Low stock banner */}
      {critical.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-orange-200 bg-orange-50">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-700">{critical.length} item{critical.length>1?"s":""} below minimum stock</p>
            <p className="text-xs text-orange-600/80 mt-0.5 line-clamp-1">{critical.map(m=>m.name).join(" · ")}</p>
          </div>
          {isAdmin && (
            <button onClick={() => setAlertOpen(true)}
              className="text-xs font-semibold text-orange-700 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded-xl transition-colors flex-shrink-0">
              View
            </button>
          )}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search materials..."
            className="w-full h-12 pl-11 pr-4 rounded-2xl border border-border bg-white text-[14px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={catFilter||"ALL"} onValueChange={v => setCatFilter(v==="ALL"?"":v)}>
          <SelectTrigger className="h-12 w-12 md:w-48 rounded-2xl border-border bg-white px-3">
            <Filter className="w-4 h-4 text-muted-foreground md:hidden" />
            <span className="hidden md:inline text-sm"><SelectValue placeholder="All Categories" /></span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {CATEGORIES.map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* ══ SHELF VIEW — Blinkit-style: one row per category ══════════ */}
      {viewMode === "shelf" && (() => {
        // Group materials by category, preserving CATEGORY_LABELS order
        const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS)
        const grouped: Record<string, RawMaterialWithVendor[]> = {}
        for (const m of materials) {
          if (!grouped[m.category]) grouped[m.category] = []
          grouped[m.category].push(m)
        }
        const sortedKeys = CATEGORY_ORDER.filter(k => grouped[k]?.length)

        if (loading) return (
          <div className="space-y-6">
            {[...Array(4)].map((_,i) => (
              <div key={i}>
                <div className="h-5 w-32 bg-white rounded-lg skeleton mb-3" />
                <div className="flex gap-3 overflow-hidden">
                  {[...Array(5)].map((_,j) => (
                    <div key={j} className="w-40 h-52 flex-shrink-0 bg-white rounded-2xl border border-border skeleton" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )

        if (materials.length === 0) return (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Package className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No materials found</p>
          </div>
        )

        return (
          <div className="space-y-6">
            {sortedKeys.map(cat => {
              const items = grouped[cat]
              const grad  = CATEGORY_GRADIENTS[cat] ?? CATEGORY_GRADIENTS.OTHER

              return (
                <div key={cat}>
                  {/* ── Category header ── */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      {/* Colour dot matching card gradient */}
                      <span className={cn("w-3 h-3 rounded-full bg-gradient-to-br flex-shrink-0", grad.bg)} />
                      <h3 className="text-[15px] font-bold text-foreground">
                        {CATEGORY_LABELS[cat] ?? cat}
                      </h3>
                      <span className="text-xs text-muted-foreground font-medium">
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => setCatFilter(cat)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                    >
                      See all →
                    </button>
                  </div>

                  {/* ── Horizontal scroll row ── */}
                  <div
                    className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
                    style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as any}
                  >
                    {items.map(m => {
                      const status = getStatus(m.currentStock, m.minimumStock)
                      const img    = (m as any).imageUrl as string | null
                      const { base, variant } = parseName(m.name)

                      return (
                        /* Fixed-width card — flex-shrink-0 keeps them from compressing */
                        <div
                          key={m.id}
                          className="w-40 sm:w-44 flex-shrink-0 bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col card-press"
                        >
                          {/* Image band */}
                          <div className={cn(
                            "relative flex items-center justify-center overflow-hidden h-24 bg-gradient-to-br",
                            grad.bg
                          )}>
                            {img
                              ? <img src={img} alt={m.name} className="w-full h-full object-cover" />
                              : <Package className="w-9 h-9 text-white/70" />
                            }
                            {/* Status badge */}
                            <span className={cn(
                              "absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                              status==="critical" ? "bg-red-500 text-white" :
                              status==="low"      ? "bg-orange-400 text-white" :
                                                    "bg-emerald-500 text-white"
                            )}>
                              {status==="critical"?"Critical":status==="low"?"Low":"OK"}
                            </span>
                          </div>

                          {/* Body */}
                          <div className="flex flex-col p-2.5 gap-1.5 flex-1">
                            <p className="text-[12px] font-bold text-foreground leading-tight line-clamp-2">{base}</p>
                            {variant && (
                              <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 w-fit">
                                {variant}
                              </span>
                            )}
                            <div className="flex items-baseline gap-1 mt-auto mb-1">
                              <span className={cn(
                                "text-xl font-black tabular-nums",
                                status==="critical"?"text-red-600":status==="low"?"text-orange-500":"text-emerald-600"
                              )}>
                                {m.currentStock}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{m.unit}</span>
                            </div>

                            {/* Action */}
                            {isAdmin ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => openUse(m)}
                                  className="flex-1 h-8 rounded-xl bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center gap-0.5 active:scale-95 transition-transform"
                                >
                                  <MinusCircle className="w-3 h-3" />Use
                                </button>
                                <button
                                  onClick={() => openRestock(m)}
                                  className="flex-1 h-8 rounded-xl bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center gap-0.5 active:scale-95 transition-transform"
                                >
                                  <PlusCircle className="w-3 h-3" />Add
                                </button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center active:scale-95">
                                      <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-white border-border rounded-2xl p-1">
                                    <DropdownMenuItem className="cursor-pointer text-sm rounded-xl py-2" onClick={()=>openHistory(m)}>
                                      <History className="w-4 h-4 mr-2" />History
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer text-sm rounded-xl py-2" onClick={()=>openEdit(m)}>
                                      <Pencil className="w-4 h-4 mr-2" />Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer text-sm rounded-xl py-2 text-red-600" onClick={()=>{setSelected(m);setDeleteOpen(true)}}>
                                      <Trash2 className="w-4 h-4 mr-2" />Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ) : (
                              <button
                                onClick={() => openUse(m)}
                                disabled={m.currentStock <= 0}
                                className="w-full h-9 rounded-xl bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                              >
                                <MinusCircle className="w-3.5 h-3.5" />
                                {m.currentStock <= 0 ? "Out of Stock" : "Record Usage"}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* ══ TABLE VIEW (admin, desktop) ════════════════════════════════ */}
      {viewMode === "table" && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              <Package className="w-5 h-5 mr-2 animate-pulse" />Loading...
            </div>
          ) : materials.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No materials found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Material</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Category</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground text-right">Stock</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Vendor</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground text-right">Price</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map(m => {
                  const s = getStatus(m.currentStock, m.minimumStock)
                  const {base, variant} = parseName(m.name)
                  return (
                    <TableRow key={m.id} className="border-border hover:bg-blue-50/30">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center overflow-hidden", CATEGORY_GRADIENTS[m.category]?.bg??"from-gray-300 to-gray-400")}>
                            {(m as any).imageUrl ? <img src={(m as any).imageUrl} alt="" className="w-full h-full object-cover rounded-xl" /> : <Package className="w-4 h-4 text-white/80" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1 flex-wrap">
                              <p className="font-semibold text-foreground text-[13px]">{base}</p>
                              {variant && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">{variant}</span>}
                            </div>
                            {m.location && <p className="text-[11px] text-muted-foreground">{m.location}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px] text-muted-foreground py-3">{CATEGORY_LABELS[m.category]??m.category}</TableCell>
                      <TableCell className="text-right py-3">
                        <span className={cn("font-bold tabular-nums text-[14px]", s==="critical"?"text-red-600":s==="low"?"text-orange-500":"text-emerald-600")}>{m.currentStock}</span>
                        <span className="text-[11px] text-muted-foreground ml-1">{m.unit}</span>
                      </TableCell>
                      <TableCell className="py-3"><StockPill current={m.currentStock} minimum={m.minimumStock} /></TableCell>
                      <TableCell className="text-[12px] text-muted-foreground py-3">{m.vendor?.name??"—"}</TableCell>
                      <TableCell className="text-right text-[12px] tabular-nums py-3">{m.unitPrice?formatCurrency(m.unitPrice):"—"}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={()=>openRestock(m)} className="h-8 px-2.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold transition-colors active:scale-95"><PlusCircle className="w-3.5 h-3.5 inline mr-1"/>Add</button>
                          <button onClick={()=>openUse(m)} className="h-8 px-2.5 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50 text-[11px] font-bold transition-colors active:scale-95"><MinusCircle className="w-3.5 h-3.5 inline mr-1"/>Use</button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"><MoreHorizontal className="w-3.5 h-3.5"/></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border-border rounded-2xl p-1 text-[13px]">
                              <DropdownMenuItem className="cursor-pointer rounded-xl py-2" onClick={()=>openHistory(m)}><History className="w-3.5 h-3.5 mr-2"/>History</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer rounded-xl py-2" onClick={()=>openEdit(m)}><Pencil className="w-3.5 h-3.5 mr-2"/>Edit</DropdownMenuItem>
                              <DropdownMenuSeparator/>
                              <DropdownMenuItem className="cursor-pointer rounded-xl py-2 text-red-600 focus:text-red-600" onClick={()=>{setSelected(m);setDeleteOpen(true)}}><Trash2 className="w-3.5 h-3.5 mr-2"/>Delete</DropdownMenuItem>
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
      )}

      {/* ══ SUCCESS TOAST (big, kiosk-friendly) ════════════════════════ */}
      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-emerald-600 text-white rounded-3xl px-8 py-6 flex items-center gap-4 shadow-2xl animate-fade-up">
            <CheckCircle2 className="w-10 h-10 flex-shrink-0" />
            <p className="text-lg font-bold">{successMsg}</p>
          </div>
        </div>
      )}

      {/* ══ USE STOCK DIALOG ════════════════════════════════════════════ */}
      <Dialog open={useOpen} onOpenChange={setUseOpen}>
        <DialogContent className="bg-white border-border max-w-md mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <MinusCircle className="w-5 h-5 text-orange-600" />
              </span>
              {isAdmin ? "Use / Remove Stock" : "Record Usage"}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="p-4 rounded-2xl bg-muted border border-border">
              <p className="font-bold text-foreground">{selected.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Available: <span className={cn("font-bold", selected.currentStock < LOW ? "text-red-600":"text-emerald-600")}>
                  {selected.currentStock} {selected.unit}
                </span>
              </p>
            </div>
          )}
          <form onSubmit={handleUse} className="space-y-4">
            <div>
              <Label className="text-sm font-bold mb-2 block">Quantity Used *</Label>
              <input
                type="number" inputMode="decimal" min="0.01" step="0.01" max={selected?.currentStock}
                value={useForm.quantity}
                onChange={e => setUseForm({...useForm, quantity:e.target.value})}
                placeholder="0" required autoFocus
                className="w-full h-14 px-4 rounded-2xl border border-border bg-background text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {useForm.quantity && selected && (
                <p className={cn("text-sm mt-1.5 text-center font-medium",
                  selected.currentStock - +useForm.quantity < LOW ? "text-red-600":"text-muted-foreground")}>
                  Remaining: <span className="font-bold">{Math.max(0, selected.currentStock - +useForm.quantity)} {selected.unit}</span>
                  {selected.currentStock - +useForm.quantity < LOW && " ⚠"}
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-bold mb-2 block">Remarks (optional)</Label>
              <input
                type="text" value={useForm.notes}
                onChange={e => setUseForm({...useForm, notes:e.target.value})}
                placeholder="e.g. Used for coil winding"
                className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <button type="button" onClick={()=>setUseOpen(false)}
                className="flex-1 h-13 rounded-2xl border border-border text-sm font-bold text-foreground hover:bg-muted transition-colors active:scale-95" style={{height:52}}>
                Cancel
              </button>
              <button type="submit" disabled={saving||!useForm.quantity}
                className="flex-1 h-13 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm disabled:opacity-50 transition-colors active:scale-95" style={{height:52}}>
                {saving ? "Recording..." : `Confirm −${useForm.quantity||"?"} ${selected?.unit??""}`}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══ ADD STOCK DIALOG ════════════════════════════════════════════ */}
      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent className="bg-white border-border max-w-md mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
              </span>
              Add Stock
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="p-4 rounded-2xl bg-muted border border-border">
              <p className="font-bold">{selected.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Current: <span className="font-bold text-foreground">{selected.currentStock} {selected.unit}</span>
              </p>
            </div>
          )}
          <form onSubmit={handleRestock} className="space-y-4">
            <div>
              <Label className="text-sm font-bold mb-2 block">Quantity to Add *</Label>
              <input
                type="number" inputMode="decimal" min="0.01" step="0.01"
                value={rstForm.quantity}
                onChange={e => setRstForm({...rstForm, quantity:e.target.value})}
                placeholder="0" required autoFocus
                className="w-full h-14 px-4 rounded-2xl border border-border bg-background text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {rstForm.quantity && selected && (
                <p className="text-sm mt-1.5 text-center text-emerald-600 font-medium">
                  New total: <span className="font-bold">{selected.currentStock + +rstForm.quantity} {selected.unit}</span>
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-bold mb-2 block">Notes (optional)</Label>
              <input type="text" value={rstForm.notes}
                onChange={e => setRstForm({...rstForm, notes:e.target.value})}
                placeholder="e.g. Received from supplier"
                className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <button type="button" onClick={()=>setRestockOpen(false)}
                className="flex-1 rounded-2xl border border-border text-sm font-bold hover:bg-muted transition-colors active:scale-95" style={{height:52}}>
                Cancel
              </button>
              <button type="submit" disabled={saving||!rstForm.quantity}
                className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-50 transition-colors active:scale-95" style={{height:52}}>
                {saving ? "Adding..." : `Add +${rstForm.quantity||"?"} ${selected?.unit??""}`}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══ LOW STOCK ALERT ════════════════════════════════════════════ */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="bg-white max-w-lg mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />Low Stock Alert
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {critical.map(m => {
              const pct = Math.min(100, Math.round((m.currentStock/Math.max(m.minimumStock,1))*100))
              return (
                <div key={m.id} className="p-3.5 rounded-2xl border border-red-200 bg-red-50">
                  <div className="flex justify-between mb-1.5">
                    <p className="font-semibold text-sm">{m.name}</p>
                    <Badge variant="destructive" className="text-xs">Below min</Badge>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Current: <span className="text-red-600 font-bold">{m.currentStock} {m.unit}</span></span>
                    <span>Min: {m.minimumStock} {m.unit}</span>
                  </div>
                  <Progress value={pct} className="h-1.5 [&>div]:bg-red-500" />
                </div>
              )
            })}
          </div>
          <DialogFooter className="gap-2 mt-2">
            <button onClick={()=>setAlertOpen(false)} className="flex-1 rounded-2xl border border-border font-bold text-sm hover:bg-muted transition-colors" style={{height:48}}>Dismiss</button>
            {isAdmin && (
              <button onClick={()=>{setAlertOpen(false);if(critical[0])openRestock(critical[0])}}
                className="flex-1 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors active:scale-95 flex items-center justify-center gap-2" style={{height:48}}>
                <TrendingUp className="w-4 h-4"/>Restock Now
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ HISTORY DIALOG ════════════════════════════════════════════ */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="bg-white max-w-2xl max-h-[85vh] flex flex-col mx-4 rounded-3xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2"><History className="w-5 h-5 text-primary"/>Stock History</DialogTitle>
            {selected && (
              <div className="flex justify-between pt-1 text-sm">
                <p className="text-muted-foreground">{selected.name}</p>
                <p className="font-bold">{selected.currentStock} {selected.unit}</p>
              </div>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-2 min-h-0">
            {movLoad ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading...</div>
            ) : movements.length === 0 ? (
              <div className="flex flex-col items-center h-32 justify-center text-muted-foreground"><History className="w-8 h-8 mb-2 opacity-40"/><p className="text-sm">No movements yet</p></div>
            ) : (
              <div className="border border-border rounded-2xl overflow-hidden">
                {movements.map(mv => (
                  <div key={mv.id} className={cn("flex items-center gap-3 px-4 py-3 border-b border-border/60 last:border-0", mv.type==="IN"?"hover:bg-emerald-50/50":"hover:bg-red-50/50")}>
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", mv.type==="IN"?"bg-emerald-100":"bg-red-100")}>
                      {mv.type==="IN"?<ArrowUpCircle className="w-4 h-4 text-emerald-600"/>:<ArrowDownCircle className="w-4 h-4 text-red-600"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{mv.reference}</p>
                      {mv.notes && <p className="text-xs text-muted-foreground truncate">{mv.notes}</p>}
                      <p className="text-xs text-muted-foreground">{formatDateTime(mv.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-bold tabular-nums", mv.type==="IN"?"text-emerald-600":"text-red-600")}>
                        {mv.type==="IN"?"+":"−"}{mv.quantity} <span className="text-xs font-normal text-muted-foreground">{selected?.unit}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">Bal: {mv.balanceAfter}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-shrink-0 pt-3 flex justify-end border-t border-border mt-3">
            <button onClick={()=>setHistoryOpen(false)} className="px-5 py-2.5 rounded-2xl border border-border text-sm font-bold hover:bg-muted transition-colors active:scale-95">
              <X className="w-4 h-4 inline mr-1.5"/>Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ ADD / EDIT MATERIAL ════════════════════════════════════════ */}
      {(addOpen||editOpen) && (
        <Dialog open={addOpen||editOpen} onOpenChange={()=>{setAddOpen(false);setEditOpen(false)}}>
          <DialogContent className="bg-white max-w-lg max-h-[90vh] overflow-y-auto mx-4 rounded-3xl">
            <DialogHeader><DialogTitle>{addOpen?"Add New Material":"Edit Material"}</DialogTitle></DialogHeader>
            <form onSubmit={addOpen?handleAdd:handleEdit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-sm font-bold mb-1.5 block">Material Name *</Label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Copper Coil Grade A" required className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <Label className="text-sm font-bold mb-1.5 block">Category *</Label>
                  <Select value={form.category} onValueChange={v=>setForm({...form,category:v})}>
                    <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Select"/></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-bold mb-1.5 block">Unit *</Label>
                  <input value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} placeholder="kg, pcs, liters..." required className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <Label className="text-sm font-bold mb-1.5 block">Current Stock</Label>
                  <input type="number" min="0" value={form.currentStock} onChange={e=>setForm({...form,currentStock:e.target.value})} placeholder="0" className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <Label className="text-sm font-bold mb-1.5 block">Min Stock</Label>
                  <input type="number" min="0" value={form.minimumStock} onChange={e=>setForm({...form,minimumStock:e.target.value})} placeholder="10" className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <Label className="text-sm font-bold mb-1.5 block">Unit Price (₹)</Label>
                  <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={e=>setForm({...form,unitPrice:e.target.value})} placeholder="0" className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <Label className="text-sm font-bold mb-1.5 block">Location</Label>
                  <input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Warehouse A, Shelf 3" className="w-full h-12 px-4 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-bold mb-1.5 block">Item Photo URL</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                      <input value={form.imageUrl} onChange={e=>setForm({...form,imageUrl:e.target.value})} placeholder="https://example.com/photo.jpg" className="w-full h-12 pl-10 pr-4 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    {form.imageUrl && (
                      <div className="w-12 h-12 rounded-2xl border border-border overflow-hidden flex-shrink-0">
                        <img src={form.imageUrl} alt="" className="w-full h-full object-cover" onError={e=>{(e.target as any).style.display='none'}}/>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Paste a URL to your item photo — shows on the inventory card.</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-bold mb-1.5 block">Vendor</Label>
                  <Select value={form.vendorId||"NONE"} onValueChange={v=>setForm({...form,vendorId:v==="NONE"?"":v})}>
                    <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="No vendor"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No vendor</SelectItem>
                      {vendors.map(v=><SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-2 pt-2">
                <button type="button" onClick={()=>{setAddOpen(false);setEditOpen(false)}} className="flex-1 rounded-2xl border border-border font-bold text-sm hover:bg-muted transition-colors active:scale-95" style={{height:52}}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-60 transition-colors active:scale-95" style={{height:52}}>
                  {saving?"Saving...":addOpen?"Add Material":"Save Changes"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ══ DELETE DIALOG ════════════════════════════════════════════= */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-white max-w-sm mx-4 rounded-3xl">
          <DialogHeader><DialogTitle className="text-red-600">Delete Material</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete <span className="font-bold text-foreground">{selected?.name}</span>? This cannot be undone.</p>
          <DialogFooter className="gap-2 mt-2">
            <button onClick={()=>setDeleteOpen(false)} className="flex-1 rounded-2xl border border-border font-bold text-sm hover:bg-muted transition-colors active:scale-95" style={{height:52}}>Cancel</button>
            <button onClick={handleDelete} disabled={saving} className="flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-60 transition-colors active:scale-95" style={{height:52}}>
              {saving?"Deleting...":"Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ AI ASSISTANT ════════════════════════════════════════════════ */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-3">
        {chatOpen && (
          <div className="w-80 bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{height:400}}>
            <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4"/>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold">Inventory Assistant</p>
                <p className="text-[10px] text-blue-100">{listening?"🔴 Listening...":"Ask me anything"}</p>
              </div>
              <button onClick={()=>setChatOpen(false)} className="text-white/70 hover:text-white"><ChevronDown className="w-4 h-4"/></button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
              {chatMsgs.map((m,i)=>(
                <div key={i} className={cn("flex gap-2", m.role==="user"?"justify-end":"justify-start")}>
                  {m.role==="ai" && <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5"><Bot className="w-3.5 h-3.5 text-white"/></div>}
                  <div className={cn("max-w-[85%] px-3 py-2 rounded-2xl text-[12px] leading-relaxed whitespace-pre-line",
                    m.role==="user"?"bg-blue-500 text-white rounded-tr-sm":"bg-white text-gray-700 border border-gray-200 rounded-tl-sm shadow-sm")}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEnd}/>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-gray-100 flex-shrink-0">
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendChat()}}
                placeholder="Type a command..." className="flex-1 text-[12px] bg-gray-100 rounded-full px-3 py-1.5 outline-none border border-transparent focus:border-blue-300 focus:bg-white transition-all"/>
              <button onClick={toggleVoice} className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                listening?"bg-red-500 text-white animate-pulse":"bg-gray-100 text-gray-500 hover:bg-gray-200")}>
                {listening?<MicOff className="w-3.5 h-3.5"/>:<Mic className="w-3.5 h-3.5"/>}
              </button>
              <button onClick={sendChat} disabled={!chatInput.trim()} className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center disabled:opacity-40 hover:bg-blue-600 transition-colors">
                <Send className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>
        )}
        <button onClick={()=>setChatOpen(v=>!v)}
          className="w-12 h-12 rounded-full shadow-xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all active:scale-95">
          {chatOpen?<X className="w-5 h-5"/>:<Bot className="w-5 h-5"/>}
        </button>
      </div>
    </div>
  )
}
