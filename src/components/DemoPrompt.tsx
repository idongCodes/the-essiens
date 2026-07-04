'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoPrompt({ isDemoUser }: { isDemoUser: boolean }) {
  const [showPrompt, setShowPrompt] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isDemoUser) return

    // Show the prompt intermittently (e.g., every 90 seconds)
    const interval = setInterval(() => {
      setShowPrompt(true)
    }, 90000)

    // Also show it once shortly after they start exploring (e.g., 30 seconds in)
    const initialTimeout = setTimeout(() => {
      setShowPrompt(true)
    }, 30000)

    return () => {
      clearInterval(interval)
      clearTimeout(initialTimeout)
    }
  }, [isDemoUser])

  if (!showPrompt) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative text-center">
        
        {/* Close button */}
        <button 
          onClick={() => setShowPrompt(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-16 h-16 bg-brand-sky/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🚀</span>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Ready to join?</h2>
        <p className="text-slate-600 mb-8">
          You've been exploring the demo. Are you ready to create your own account and join the family app for real?
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => {
              setShowPrompt(false)
              router.push('/register')
            }}
            className="flex-1 bg-brand-sky text-white font-bold py-3 rounded-xl hover:bg-sky-500 transition-colors shadow-md"
          >
            Yes, let's go!
          </button>
          <button 
            onClick={() => setShowPrompt(false)}
            className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Not yet
          </button>
        </div>
      </div>
    </div>
  )
}
