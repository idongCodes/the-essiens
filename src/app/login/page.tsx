'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { login } from './actions'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    const result = await login(formData)
    
    if (result.success) {
      router.push('/common-room') // Success! Go to the room.
    } else {
      setError(result.message || "An unexpected error occurred.")
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-sky/10 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-100">
        
        <h1 className="text-3xl font-bold text-center text-brand-sky mb-2">Family Login</h1>
        <p className="text-center text-slate-400 mb-8">Enter your email and password.</p>

        <form action={handleSubmit} className="space-y-4">
          
          {/* Email Field */}
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

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="Enter your password"
                className="w-full p-3 pr-10 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-sky focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message Display */}
          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full bg-brand-pink text-slate-800 font-bold py-3 rounded-lg hover:brightness-105 transition-all shadow-sm"
          >
            Open the Door
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-3">
          <Link href="/register" className="block text-sm text-brand-sky font-bold hover:underline">
            New to the family? Register here
          </Link>
          <Link href="/forgot-password" className="block text-sm text-brand-sky font-bold hover:underline">
            Forgot your password?
          </Link>
          <Link href="/" className="block text-sm text-slate-400 hover:text-brand-sky transition-colors">
            ← Back Home
          </Link>
        </div>
      </div>
    </main>
  )
}
