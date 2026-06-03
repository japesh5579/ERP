import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { MobileNav } from "@/components/layout/MobileNav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-background">

      {/* Sidebar — hidden on phones (<640px), always visible on tablet/desktop (≥640px) */}
      <Sidebar session={session} />

      {/* Content shifts right on tablet/desktop to make room for sidebar */}
      <div className="sm:ml-56 min-h-screen flex flex-col">
        <Header session={session} />

        {/* Bottom padding on phone only (for the bottom nav bar) */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 pb-20 sm:pb-4">
          {children}
        </main>
      </div>

      {/* Bottom nav — phone only (<640px) */}
      <MobileNav role={session.user.role} userName={session.user.name} />
    </div>
  )
}
