'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { registerUser, checkSecret } from './actions'

const STEPS = [
  { id: 'firstName', title: "Let's start with your first name", placeholder: 'Jane', type: 'text', errorText: "First name is required" },
  { id: 'lastName', title: "And your last name?", placeholder: 'Doe', type: 'text', errorText: "Last name is required" },
  { id: 'alias', title: "Got a nickname? (Optional)", placeholder: 'What should we call you?', type: 'text', errorText: "" },
  { id: 'phone', title: "What's a good phone number?", placeholder: '555-0123', type: 'tel', errorText: "Enter a valid phone number (min 10 digits)" },
  { id: 'email', title: "Your email address?", placeholder: 'jane@example.com', type: 'email', errorText: "Enter a valid email address" },
  { id: 'securityAnswer', title: "🔒 Security Check", placeholder: 'Type the answer...', type: 'text', errorText: "Incorrect answer. Please try again.", description: "\"What is Charlie's Grandma's name on her Father's side?\"" },
  { id: 'position', title: "✅ Correct! One last thing...", placeholder: "e.g. Mercy's 3rd born son", type: 'text', errorText: "This field is required", description: "What is your relation to Mercy?" }
];

function RegisterContent() {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const secretParam = searchParams.get('familySecret')

  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    alias: '',
    phone: '',
    email: '',
    securityAnswer: secretParam || '',
    position: ''
  })

  const [validation, setValidation] = useState<{ [key: string]: boolean | null }>({ 
    firstName: null,
    lastName: null,
    phone: null,
    email: null,
    securityAnswer: secretParam ? null : null, 
    position: null
  })

  const [isCheckingSecret, setIsCheckingSecret] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input on step change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentStep])

  // --- ASYNC SECRET VALIDATION ---
  useEffect(() => {
    const answer = formData.securityAnswer
    if (!answer) {
      setValidation(prev => ({ ...prev, securityAnswer: null }))
      return
    }

    setIsCheckingSecret(true)
    const timer = setTimeout(async () => {
      try {
        const isValid = await checkSecret(answer)
        setValidation(prev => ({ ...prev, securityAnswer: isValid }))
      } catch (err) {
        console.error("Secret check failed", err)
      } finally {
        setIsCheckingSecret(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.securityAnswer])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (validation[name] === false) {
      setValidation(prev => ({ ...prev, [name]: null }))
    }
  }

  const validateField = (name: string, value: string) => {
    let isValid = true
    
    switch (name) {
      case 'firstName':
      case 'lastName':
      case 'position':
        isValid = value.trim().length > 0
        break
      case 'alias':
        isValid = true
        break
      case 'email':
        isValid = /^[^S@]+@[^S@]+\.[^S@]+$/.test(value)
        break
      case 'phone':
        isValid = /^\+?[\d\s-]{10,}$/.test(value)
        break
      case 'securityAnswer':
        isValid = validation.securityAnswer === true
        break
      default:
        break
    }

    if (name !== 'securityAnswer') {
        setValidation(prev => ({ ...prev, [name]: isValid }))
    }
    return isValid
  }

  const isNextDisabled = () => {
    const step = STEPS[currentStep]
    if (step.id === 'securityAnswer') {
      return isCheckingSecret || validation.securityAnswer !== true
    }
    return false
  }

  const handleNext = () => {
    const step = STEPS[currentStep]
    const val = formData[step.id as keyof typeof formData]
    const isValid = validateField(step.id, val)

    if (isValid && !isNextDisabled()) {
      if (currentStep < STEPS.length - 1) {
        setDirection(1)
        setCurrentStep(p => p + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(p => p - 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNext()
    }
  }

  async function handleSubmit() {
    setError('')
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

  const step = STEPS[currentStep]

  return (
    <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 flex flex-col min-h-[450px] relative overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-xl font-bold text-slate-300 tracking-tight">The Essiens</h1>
            <span className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {currentStep + 1} of {STEPS.length}
            </span>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center relative">
            <div 
                key={currentStep} 
                className={`animate-in fade-in duration-300 ${direction > 0 ? 'slide-in-from-right-8' : 'slide-in-from-left-8'}`}
            >
                <h2 className="text-3xl font-bold text-brand-sky mb-2 leading-tight">{step.title}</h2>
                {step.description && <p className="text-slate-500 mb-6 text-lg">{step.description}</p>}

                <div className="relative mt-4">
                    <input 
                        ref={inputRef}
                        type={step.type}
                        name={step.id}
                        value={formData[step.id as keyof typeof formData]}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder={step.placeholder}
                        className="w-full bg-transparent border-b-2 border-slate-200 focus:border-brand-sky text-2xl md:text-3xl py-3 outline-none transition-colors placeholder:text-slate-300 text-slate-800"
                        autoFocus
                    />
                </div>

                {/* Validation and Feedback */}
                <div className="h-8 mt-4">
                    {validation[step.id] === false && step.id !== 'securityAnswer' && (
                        <p className="text-red-500 text-sm font-medium animate-in slide-in-from-top-2">{step.errorText}</p>
                    )}

                    {step.id === 'securityAnswer' && (
                        <>
                            {isCheckingSecret && <span className="text-brand-sky text-sm font-medium animate-pulse">Verifying family secret...</span>}
                            {validation.securityAnswer === true && !isCheckingSecret && (
                                <span className="text-green-600 text-sm font-medium flex items-center gap-1 animate-in zoom-in">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Verified
                                </span>
                            )}
                            {validation.securityAnswer === false && !isCheckingSecret && formData.securityAnswer.length > 0 && (
                                <span className="text-red-500 text-sm font-medium animate-in slide-in-from-top-2">{step.errorText}</span>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Global Error */}
        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4 animate-in shake absolute top-4 left-4 right-4 z-10">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
        )}

        {/* Navigation Controls */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
            <button 
                onClick={handlePrev} 
                disabled={currentStep === 0} 
                className={`p-3 rounded-full ${currentStep === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100'} transition-all`}
                aria-label="Previous step"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Progress Dots */}
            <div className="flex gap-2">
                {STEPS.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-brand-sky' : 'w-2 bg-slate-200'}`} />
                ))}
            </div>

            <button 
                onClick={handleNext}
                disabled={isNextDisabled() || isSubmitting}
                className={`px-6 py-3 rounded-full font-bold shadow-md transition-all flex items-center gap-2 ${ 
                    isNextDisabled() || isSubmitting 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-brand-sky text-white hover:bg-sky-500 hover:scale-105'
                }`}
            >
                {currentStep === STEPS.length - 1 ? (
                    isSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Wait...
                        </>
                    ) : 'Finish'
                ) : (
                    <>
                        Next
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </>
                )}
            </button>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-slate-400 hover:text-brand-pink transition-colors">
            Already have an account? Login
          </Link>
        </div>
      </div>
  )
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-cream px-4 py-10 font-sans">
      <Suspense fallback={<div className="text-brand-sky font-bold animate-pulse">Loading...</div>}>
        <RegisterContent />
      </Suspense>
    </main>
  )
}