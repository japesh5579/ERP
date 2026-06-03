import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const ADMIN_ONLY_PAGES = [
  "/production",
  "/quality",
  "/dispatch",
  "/vendors",
  "/purchase-orders",
  "/bom",
  "/users",
  "/usage-history",
]

export default auth((req) => {
  const { nextUrl, auth: session } = req

  const isLoggedIn = !!session
  const isAuthPage = nextUrl.pathname.startsWith("/login")
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth")

  if (isApiAuth) return NextResponse.next()

  if (isAuthPage) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", nextUrl))
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  const role = (session as any)?.user?.role
  if (role === "WORKER") {
    const isAdminPage = ADMIN_ONLY_PAGES.some((path) =>
      nextUrl.pathname.startsWith(path)
    )
    if (isAdminPage) {
      return NextResponse.redirect(new URL("/", nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
