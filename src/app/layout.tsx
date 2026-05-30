import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Gagan Transmissions | ERP System",
  description: "Enterprise resource planning system for Gagan Transmissions",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
