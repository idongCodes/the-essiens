'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from './actions'

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setStatus({ type: '', message: '' })
    const result = await requestPasswordReset(formData)
    
    if (result.success) {
      setStatus({ type: 'success', message: result.message! })
    } else {
      setStatus({ type: 'error', message: result.message! })
    }
    setIsLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-sky/10 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-100">
        
        <h1 className="text-3xl font-bold text-center text-brand-sky mb-2">Forgot Password</h1>
        <p className="text-center text-slate-400 mb-8">Enter your email to receive a reset link.</p>

        <form action={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your Email</label>
            <input 
              name="email" 
              type="email" 
              required
              placeholder="you@example.com"
              className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-sky focus:outline-none"
            />
          </div>

          {status.message && (
            <p className={`text-sm text-center p-2 rounded ${status.type === 'success' ? 'text-green-700 bg-green-50' : 'text-red-500 bg-red-50'}`}>
              {status.message}
            </p>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-brand-sky text-white font-bold py-3 rounded-lg hover:brightness-105 transition-all shadow-sm disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <Link href="/login" className="block text-sm text-brand-sky font-bold hover:underline">
            Remembered your password? Login
          </Link>
        </div>
      </div>
    </main>
  )
}
