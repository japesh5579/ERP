export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    /* Full screen on phone, centered card on tablet/desktop */
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[400px]">
        {children}
      </div>
    </div>
  )
}
