import { auth } from "@/lib/auth"
import InventoryClient from "./InventoryClient"

export default async function InventoryPage() {
  const session = await auth()
  const isAdmin = session?.user.role === "ADMIN"
  return (
    <InventoryClient
      isAdmin={isAdmin}
      userId={session?.user.id ?? ""}
      userName={session?.user.name ?? ""}
    />
  )
}
