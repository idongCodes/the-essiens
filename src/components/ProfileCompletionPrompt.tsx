'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { checkProfileStatus } from '@/app/actions'

export default function ProfileCompletionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkStatus() {
      // 1. Check when we last bothered the user
      const lastPromptTimeStr = localStorage.getItem('lastProfilePromptTime')
      if (lastPromptTimeStr) {
        const lastPromptTime = parseInt(lastPromptTimeStr, 10)
        const ONE_DAY_MS = 24 * 60 * 60 * 1000
        
        // If it's been less than 24 hours, don't bother them again yet.
        if (Date.now() - lastPromptTime < ONE_DAY_MS) {
          return
        }
      }

      // 2. Ask the server if they are missing a bio or profile picture
      const { needsUpdate } = await checkProfileStatus()

      // 3. If they need an update, show the prompt (maybe wait 30 seconds so it's not immediate)
      if (needsUpdate) {
        setTimeout(() => {
          setShowPrompt(true)
          // Update the localStorage so we don't bother them again for 24 hours
          localStorage.setItem('lastProfilePromptTime', Date.now().toString())
        }, 30000)
      }
    }

    checkStatus()
  }, [])

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
          <span className="text-3xl">👤</span>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Complete Your Profile</h2>
        <p className="text-slate-600 mb-8">
          Your family wants to see your beautiful face and learn a bit more about what you've been up to! Take a quick second to upload a profile picture and write a short bio.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => {
              setShowPrompt(false)
              router.push('/my-room')
            }}
            className="flex-1 bg-brand-sky text-white font-bold py-3 rounded-xl hover:bg-sky-500 transition-colors shadow-md"
          >
            Update Profile
          </button>
          <button 
            onClick={() => setShowPrompt(false)}
            className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}
