"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, Package, Factory, ClipboardCheck,
  Truck, Building2, ShoppingCart, Users, Layers,
  ClipboardList, History, LogOut, Zap,
} from "lucide-react"
import { cn, ROLE_LABELS } from "@/lib/utils"

const ADMIN_NAV = [
  { section: "Overview",    href: "/",               icon: LayoutDashboard, label: "Dashboard"       },
  { section: "Operations",  href: "/inventory",       icon: Package,         label: "Inventory"       },
  { section: "Operations",  href: "/production",      icon: Factory,         label: "Production"      },
  { section: "Operations",  href: "/quality",         icon: ClipboardCheck,  label: "Quality"         },
  { section: "Operations",  href: "/dispatch",        icon: Truck,           label: "Dispatch"        },
  { section: "Operations",  href: "/bom",             icon: Layers,          label: "Bill of Materials"},
  { section: "Procurement", href: "/vendors",         icon: Building2,       label: "Vendors"         },
  { section: "Procurement", href: "/purchase-orders", icon: ShoppingCart,    label: "Purchase Orders" },
  { section: "Admin",       href: "/users",           icon: Users,           label: "Workers"         },
  { section: "Admin",       href: "/usage-history",   icon: ClipboardList,   label: "Usage History"   },
]

const WORKER_NAV = [
  { section: "Overview", href: "/",          icon: LayoutDashboard, label: "Dashboard"  },
  { section: "Overview", href: "/inventory", icon: Package,         label: "Inventory"  },
  { section: "Overview", href: "/my-usage",  icon: History,         label: "My Activity"},
]

interface SidebarProps {
  session: { user: { name: string; email: string; role: string } }
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin  = session.user.role === "ADMIN"
  const nav      = isAdmin ? ADMIN_NAV : WORKER_NAV

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  const initials = session.user.name
    ?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "U"

  // Group by section
  const sections: Record<string, typeof ADMIN_NAV> = {}
  for (const item of nav) {
    if (!sections[item.section]) sections[item.section] = []
    sections[item.section].push(item)
  }

  return (
    /* Hidden on phone (<640px), visible on tablet/laptop/desktop (≥640px) */
    <aside className="hidden sm:flex fixed inset-y-0 left-0 z-40 flex-col w-56 bg-white border-r border-gray-200">

      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-200 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-gray-800 leading-tight truncate">Gagan Transmissions</p>
          <p className="text-[10px] text-gray-400 tracking-wider uppercase mt-0.5">ERP System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
        {Object.entries(sections).map(([sectionName, items]) => (
          <div key={sectionName}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1">
              {sectionName}
            </p>
            {items.map(({ href, icon: Icon, label }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all mb-0.5 active:scale-[0.98]",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-blue-600" />
                  )}
                  <Icon
                    className={cn("w-4 h-4 flex-shrink-0", active ? "text-blue-600" : "text-gray-400")}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span className="truncate">{label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User + Sign out */}
      <div className="flex-shrink-0 border-t border-gray-200 p-3 space-y-1.5">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-gray-50">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0",
            isAdmin ? "bg-blue-600" : "bg-green-600"
          )}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-gray-800 truncate leading-tight">{session.user.name}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{ROLE_LABELS[session.user.role] ?? session.user.role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
