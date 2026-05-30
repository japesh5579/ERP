import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar session={session} />
      <div className="ml-56 min-h-screen flex flex-col">
        <Header session={session} />
        <main className="flex-1 p-5">
          {children}
        </main>
      </div>
    </div>
  )
}
