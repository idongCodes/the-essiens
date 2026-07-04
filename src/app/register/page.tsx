'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerUser } from './actions'

const STEPS = [
  { id: 'firstName', title: "Let's start with your first name", placeholder: 'Jane', type: 'text', errorText: "First name is required" },
  { id: 'lastName', title: "And your last name?", placeholder: 'Doe', type: 'text', errorText: "Last name is required" },
  { id: 'alias', title: "Got a nickname? (Optional)", placeholder: 'What should we call you?', type: 'text', errorText: "" },
  { id: 'phone', title: "What's a good phone number?", placeholder: '555-0123', type: 'tel', errorText: "Enter a valid phone number (min 10 digits)" },
  { id: 'email', title: "Your email address?", placeholder: 'jane@example.com', type: 'email', errorText: "Enter a valid email address" },
  { id: 'password', title: "Create a password", placeholder: 'Super secret...', type: 'password', errorText: "Password must be at least 6 characters" },
  { id: 'confirmPassword', title: "Confirm your password", placeholder: 'Super secret again...', type: 'password', errorText: "Passwords do not match" },
  { id: 'position', title: "✅ Almost done! One last thing...", placeholder: "e.g. Mercy's 3rd born son", type: 'text', errorText: "This field is required", description: "What is your relation to Mercy?" }
];

function RegisterContent() {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    alias: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    position: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.position) {
      setError('Please fill in all required fields.')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)
    
    const submitData = new FormData()
    Object.entries(formData).forEach(([key, value]) => submitData.append(key, value))

    const result = await registerUser(submitData)
    
    if (result.success) {
      router.push('/common-room')
    } else {
      setError(result.message || "Something went wrong")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl max-w-xl w-full border border-slate-100 flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-brand-sky tracking-tight mb-2">Join The Essiens</h1>
            <p className="text-slate-500">Create your account to stay connected with the family.</p>
        </div>

        {/* Global Error */}
        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6 animate-in shake">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name <span className="text-red-500">*</span></label>
                    <input 
                        type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-sky outline-none transition-colors"
                        placeholder="Jane"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                    <input 
                        type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-sky outline-none transition-colors"
                        placeholder="Doe"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nickname (Optional)</label>
                    <input 
                        type="text" name="alias" value={formData.alias} onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-sky outline-none transition-colors"
                        placeholder="What should we call you?"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input 
                        type="tel" name="phone" value={formData.phone} onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-sky outline-none transition-colors"
                        placeholder="08012345678"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                <input 
                    type="email" name="email" value={formData.email} onChange={handleChange} required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-sky outline-none transition-colors"
                    placeholder="jane@example.com"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password <span className="text-red-500">*</span></label>
                    <input 
                        type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-sky outline-none transition-colors"
                        placeholder="Min 6 characters"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                    <input 
                        type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength={6}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-sky outline-none transition-colors"
                        placeholder="Repeat password"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Family Position <span className="text-red-500">*</span></label>
                <input 
                    type="text" name="position" value={formData.position} onChange={handleChange} required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-sky outline-none transition-colors"
                    placeholder="e.g. Mercy's 3rd born son"
                />
            </div>

            <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-4 px-6 py-3.5 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 ${ 
                    isSubmitting 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-brand-sky text-white hover:bg-sky-500 hover:scale-[1.02]'
                }`}
            >
                {isSubmitting ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                    </>
                ) : 'Join Family'}
            </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-slate-500 hover:text-brand-sky transition-colors font-medium">
            Already have an account? Login
          </Link>
        </div>
      </div>
  )
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4 py-10 font-sans">
      <Suspense fallback={<div className="text-brand-sky font-bold animate-pulse">Loading...</div>}>
        <RegisterContent />
      </Suspense>
    </main>
  )
}