export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center text-white p-8">
      <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M8.464 8.464a5 5 0 000 7.072M15.536 8.464a5 5 0 010 7.072M12 12h.01" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold mb-2">No Connection</h1>
      <p className="text-blue-100 text-center text-lg mb-8 max-w-xs">
        The tablet cannot reach the server right now. Please check the network connection.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-white text-blue-700 font-bold px-8 py-4 rounded-2xl text-lg active:scale-95 transition-transform"
      >
        Try Again
      </button>
    </div>
  )
}
