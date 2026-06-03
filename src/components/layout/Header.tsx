"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Bell, LogOut, ChevronDown, Zap } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROLE_LABELS } from "@/lib/utils"

const PAGES: Record<string, string> = {
  "/":                "Dashboard",
  "/inventory":       "Inventory",
  "/bom":             "Bill of Materials",
  "/production":      "Production",
  "/quality":         "Quality Control",
  "/dispatch":        "Dispatch",
  "/vendors":         "Vendors",
  "/purchase-orders": "Purchase Orders",
  "/users":           "Workers",
  "/usage-history":   "Usage History",
  "/my-usage":        "My Activity",
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
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [])

  const title =
    PAGES[pathname] ??
    Object.entries(PAGES).find(([k]) => k !== "/" && pathname.startsWith(k))?.[1] ??
    "Gagan Transmissions"

  const initials = session.user.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "U"
  const isAdmin  = session.user.role === "ADMIN"

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center bg-white border-b border-border px-4 gap-3 flex-shrink-0">

      {/* Phone only: brand logo (since sidebar is hidden on phone) */}
      <div className="flex items-center gap-2 sm:hidden flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
      </div>

      {/* Page title */}
      <h1 className="flex-1 min-w-0 font-bold text-foreground truncate
                     text-[14px] sm:text-[15px] lg:text-base">
        {title}
      </h1>

      {/* Right side */}
      <div className="flex items-center gap-1 flex-shrink-0">

        {/* Live clock — tablet + desktop */}
        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-[13px] font-semibold text-foreground tabular-nums">{time}</span>
          <span className="text-[10px] text-muted-foreground tabular-nums">{date}</span>
        </div>

        {/* Bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
          <Bell className="w-[17px] h-[17px] text-muted-foreground" strokeWidth={1.75} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-blue-500 border-2 border-white" />
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-border mx-1" />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-muted transition-colors outline-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0
                ${isAdmin ? "bg-blue-600" : "bg-green-600"}`}>
                {initials}
              </div>
              {/* Name + role — visible on tablet/desktop */}
              <div className="hidden sm:block text-left">
                <p className="text-[12px] font-semibold text-foreground leading-none">{session.user.name}</p>
                <p className="text-[10px] text-muted-foreground mt-[3px]">
                  {ROLE_LABELS[session.user.role] ?? session.user.role}
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 bg-white border-border shadow-xl rounded-2xl p-1.5">
            <div className="px-3 py-2.5">
              <p className="text-[14px] font-bold text-foreground">{session.user.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{session.user.email}</p>
              <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide
                ${isAdmin ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                {ROLE_LABELS[session.user.role] ?? session.user.role}
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-[13px] text-red-600 focus:text-red-600 focus:bg-red-50 rounded-xl mt-1 py-2.5"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
