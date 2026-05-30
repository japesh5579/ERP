"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Zap, Loader2, AlertCircle, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        setError("Invalid email or password. Please try again.")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

      {/* Amber top bar */}
      <div className="h-1 bg-primary w-full" />

      {/* Header */}
      <div className="px-8 pt-8 pb-6 text-center border-b border-border">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
          <Zap className="w-6 h-6 text-primary" strokeWidth={2.5} />
        </div>
        <h1 className="text-[20px] font-extrabold tracking-widest text-foreground uppercase">
          Gagan Transmissions
        </h1>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase mt-1">
          ERP Management System
        </p>
      </div>

      {/* Form */}
      <div className="px-8 py-7">
        <div className="mb-5">
          <h2 className="text-[15px] font-semibold text-foreground">Sign in to your account</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[12px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[12px] font-semibold text-foreground/80 uppercase tracking-[0.08em]">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="pl-9 h-10 bg-background border-border text-[13px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[12px] font-semibold text-foreground/80 uppercase tracking-[0.08em]">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pl-9 h-10 bg-background border-border text-[13px]"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-10 font-bold tracking-wide mt-1 text-[13px]"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          Authorized personnel only &mdash; activity is monitored
        </p>
      </div>
    </div>
  )
}
