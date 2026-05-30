"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Bell, LogOut, ChevronDown, ChevronRight } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROLE_LABELS } from "@/lib/utils"

const PAGES: Record<string, { title: string; section: string }> = {
  "/":                { title: "Dashboard",       section: "Overview" },
  "/inventory":       { title: "Inventory",       section: "Operations" },
  "/bom":             { title: "Bill of Materials", section: "Operations" },
  "/production":      { title: "Production",      section: "Operations" },
  "/quality":         { title: "Quality Control", section: "Operations" },
  "/dispatch":        { title: "Dispatch",        section: "Operations" },
  "/vendors":         { title: "Vendors",         section: "Procurement" },
  "/purchase-orders": { title: "Purchase Orders", section: "Procurement" },
  "/users":           { title: "User Management", section: "Administration" },
}

interface HeaderProps {
  session: { user: { name: string; email: string; role: string } }
}

export function Header({ session }: HeaderProps) {
  const pathname = usePathname()
  const [time, setTime] = useState("")
  const [date, setDate] = useState("")

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setDate(now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }))
      setTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }))
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [])

  const page =
    PAGES[pathname] ??
    Object.entries(PAGES).find(([k]) => k !== "/" && pathname.startsWith(k))?.[1] ??
    { title: "Gagan Transmissions", section: "ERP" }

  const initials = session.user.name
    ?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "U"

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center bg-white border-b border-border px-5 gap-4 flex-shrink-0">

      {/* ── Breadcrumb + Title ── */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-[11px] text-muted-foreground">{page.section}</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
        <span className="text-[12px] font-semibold text-foreground truncate">{page.title}</span>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-0.5">

        {/* Date & time */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 mr-1">
          <span className="text-[11px] text-muted-foreground tabular-nums">{date}</span>
          <span className="text-[11px] text-muted-foreground/40">·</span>
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{time}</span>
        </div>

        {/* Bell */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors">
          <Bell className="w-[15px] h-[15px] text-muted-foreground" strokeWidth={1.75} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-border mx-2" />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted transition-colors outline-none">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[12px] font-semibold text-foreground leading-none">{session.user.name}</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-[3px]">
                  {ROLE_LABELS[session.user.role] ?? session.user.role}
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52 bg-white border-border shadow-lg rounded-lg p-1">
            <div className="px-2 py-2 mb-1">
              <p className="text-[12px] font-semibold text-foreground">{session.user.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{session.user.email}</p>
              <p className="text-[10px] text-blue-600 font-medium mt-1">
                {ROLE_LABELS[session.user.role] ?? session.user.role}
              </p>
            </div>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="cursor-pointer text-[12px] text-red-600 focus:text-red-600 focus:bg-red-50 rounded mt-1"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
