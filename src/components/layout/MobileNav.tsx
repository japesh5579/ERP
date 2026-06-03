"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard, Package, History, MoreHorizontal, X,
  Factory, ClipboardCheck, Truck, Building2, ShoppingCart,
  Layers, ClipboardList, Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps { role: string; userName: string }

const WORKER_TABS = [
  { href: "/",          icon: LayoutDashboard, label: "Home"      },
  { href: "/inventory", icon: Package,         label: "Inventory" },
  { href: "/my-usage",  icon: History,         label: "Activity"  },
]

const ADMIN_TABS = [
  { href: "/",          icon: LayoutDashboard, label: "Home"      },
  { href: "/inventory", icon: Package,         label: "Inventory" },
  { href: "/users",     icon: Users,           label: "Workers"   },
  { href: "#more",      icon: MoreHorizontal,  label: "More"      },
]

const MORE_LINKS = [
  { href: "/production",      icon: Factory,        label: "Production"        },
  { href: "/quality",         icon: ClipboardCheck, label: "Quality"           },
  { href: "/dispatch",        icon: Truck,          label: "Dispatch"          },
  { href: "/vendors",         icon: Building2,      label: "Vendors"           },
  { href: "/purchase-orders", icon: ShoppingCart,   label: "Purchase Orders"   },
  { href: "/bom",             icon: Layers,         label: "Bill of Materials" },
  { href: "/usage-history",   icon: ClipboardList,  label: "Usage History"     },
]

export function MobileNav({ role }: MobileNavProps) {
  const pathname   = usePathname()
  const [more, setMore] = useState(false)
  const isAdmin    = role === "ADMIN"
  const tabs       = isAdmin ? ADMIN_TABS : WORKER_TABS

  const isActive = (href: string) =>
    href === "#more" ? false : href === "/" ? pathname === "/" : pathname.startsWith(href)

  const moreActive = isAdmin && MORE_LINKS.some((l) => pathname.startsWith(l.href))

  return (
    <>
      {/* Backdrop */}
      {more && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
          onClick={() => setMore(false)} />
      )}

      {/* More sheet */}
      {more && (
        <div className="fixed left-0 right-0 bottom-[68px] z-50 bg-white rounded-t-3xl shadow-2xl border-t border-border sm:hidden animate-slide-up">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <p className="text-sm font-bold">More Options</p>
            <button onClick={() => setMore(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1 px-4 pb-8 pt-1">
            {MORE_LINKS.map(({ href, icon: Icon, label }) => {
              const active = pathname.startsWith(href)
              return (
                <Link key={href} href={href} onClick={() => setMore(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all active:scale-95",
                    active ? "bg-blue-50 text-blue-600" : "text-muted-foreground hover:bg-muted"
                  )}>
                  <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 1.75} />
                  <span className="text-[11px] font-medium text-center leading-tight">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom nav — phone ONLY (hidden on tablet ≥640px and desktop) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border flex items-center sm:hidden"
        style={{ height: 64, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {tabs.map(({ href, icon: Icon, label }) => {
          const isMore   = href === "#more"
          const active   = isMore ? moreActive : isActive(href)

          if (isMore) {
            return (
              <button key="more" onClick={() => setMore(true)}
                className={cn("flex-1 flex flex-col items-center justify-center gap-1 py-2",
                  moreActive ? "text-blue-600" : "text-muted-foreground")}>
                <MoreHorizontal className="w-5 h-5" strokeWidth={moreActive ? 2.5 : 1.75} />
                <span className="text-[10px] font-medium">More</span>
              </button>
            )
          }

          return (
            <Link key={href} href={href}
              className={cn("flex-1 flex flex-col items-center justify-center gap-1 py-2 active:scale-95 transition-all",
                active ? "text-blue-600" : "text-muted-foreground")}>
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.75} />
                {active && <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
