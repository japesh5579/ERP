"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Package, Factory, ClipboardCheck,
  Truck, Building2, ShoppingCart, Users, Layers,
} from "lucide-react"
import { cn, ROLE_LABELS } from "@/lib/utils"

const NAV = [
  { section: 0, href: "/",               icon: LayoutDashboard, label: "Dashboard" },
  { section: 1, href: "/inventory",       icon: Package,         label: "Inventory" },
  { section: 1, href: "/bom",             icon: Layers,          label: "Bill of Materials" },
  { section: 1, href: "/production",      icon: Factory,         label: "Production" },
  { section: 1, href: "/quality",         icon: ClipboardCheck,  label: "Quality" },
  { section: 1, href: "/dispatch",        icon: Truck,           label: "Dispatch" },
  { section: 2, href: "/vendors",         icon: Building2,       label: "Vendors" },
  { section: 2, href: "/purchase-orders", icon: ShoppingCart,    label: "Purchase Orders" },
]

interface SidebarProps {
  session: { user: { name: string; email: string; role: string } }
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  const initials = session.user.name
    ?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "U"

  const allNav = [
    ...NAV,
    ...(session.user.role === "SUPER_ADMIN"
      ? [{ section: 3, href: "/users", icon: Users, label: "User Management" }]
      : []),
  ]

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex flex-col w-56 bg-white border-r border-gray-200">

      {/* ── Brand ── */}
      <div className="flex items-center gap-2.5 px-4 h-12 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-[6px] bg-blue-600 flex-shrink-0">
          <span className="text-[11px] font-black text-white tracking-tight leading-none select-none">GT</span>
        </div>
        <div className="min-w-0">
          <p className="text-[12.5px] font-bold text-gray-800 leading-none tracking-tight truncate">
            Gagan Transmissions
          </p>
          <p className="text-[9px] text-gray-400 mt-[3px] tracking-wider uppercase">
            ERP System
          </p>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {allNav.map((item, i) => {
          const { href, icon: Icon, label, section } = item
          const prev = allNav[i - 1]
          const showDivider = i > 0 && prev.section !== section
          const active = isActive(href)

          return (
            <div key={href}>
              {showDivider && (
                <div className="my-2 border-t border-gray-100" />
              )}
              <Link
                href={href}
                className={cn(
                  "relative flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[12px] font-medium transition-colors mb-0.5",
                  active
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                )}
              >
                {/* Active left bar */}
                {active && (
                  <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-blue-600" />
                )}
                <Icon
                  className={cn(
                    "w-[15px] h-[15px] flex-shrink-0",
                    active ? "text-blue-600" : "text-gray-400"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="truncate">{label}</span>
              </Link>
            </div>
          )
        })}
      </nav>

      {/* ── User ── */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-gray-700 truncate leading-tight">
              {session.user.name}
            </p>
            <p className="text-[10px] text-gray-400 truncate mt-[2px]">
              {ROLE_LABELS[session.user.role] ?? session.user.role}
            </p>
          </div>
        </div>
      </div>

    </aside>
  )
}
