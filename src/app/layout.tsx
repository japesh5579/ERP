import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Toaster } from "sonner"
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration"

export const metadata: Metadata = {
  title: "Gagan Transmissions | ERP",
  description: "Inventory management system for Gagan Transmissions",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GT ERP",
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>
        <ServiceWorkerRegistration />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
