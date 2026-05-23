'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { resetPassword } from './actions'

function ResetPasswordForm() {
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setStatus({ type: '', message: '' })
    formData.append('token', token || '')
    const result = await resetPassword(formData)
    
    if (result.success) {
      setStatus({ type: 'success', message: result.message! })
    } else {
      setStatus({ type: 'error', message: result.message! })
    }
    setIsLoading(false)
  }

  if (!token) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">Invalid or missing reset token.</p>
        <Link href="/forgot-password" className="text-brand-sky hover:underline font-bold">
          Request a new link
        </Link>
      </div>
    )
  }

  if (status.type === 'success') {
    return (
      <div className="text-center p-8">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Password Reset!</h2>
        <p className="text-slate-600 mb-6">{status.message}</p>
        <Link href="/login" className="bg-brand-sky text-white px-6 py-3 rounded-full font-bold hover:bg-sky-500 transition-colors inline-block">
          Go to Login
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-center text-brand-sky mb-2">Reset Password</h1>
      <p className="text-center text-slate-400 mb-8">Enter your new password below.</p>

      <form action={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
          <div className="relative">
            <input 
              name="password" 
              type={showPassword ? "text" : "password"} 
              required
              minLength={6}
              placeholder="Enter new password"
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
          <div className="relative">
            <input 
              name="confirmPassword" 
              type={showConfirmPassword ? "text" : "password"} 
              required
              minLength={6}
              placeholder="Confirm new password"
              className="w-full p-3 pr-10 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-sky focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <EyeIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {status.message && (
          <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
            {status.message}
          </p>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-brand-sky text-white font-bold py-3 rounded-lg hover:brightness-105 transition-all shadow-sm disabled:opacity-50"
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-sky/10 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-100">
        <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  )
}
